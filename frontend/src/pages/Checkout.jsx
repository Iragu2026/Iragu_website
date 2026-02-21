import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { FiChevronDown, FiGift } from "react-icons/fi";
import toast from "react-hot-toast";
import usePageTitle from "../hooks/usePageTitle.js";
import { clearCart } from "../features/cart/cartSlice.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../features/orders/ordersSlice.js";
import PolicyModal, {
  TermsAndConditions,
  PrivacyPolicy,
  ShippingAndReturnsPolicy,
} from "../components/PolicyModal.jsx";

const SHIPPING_FLAT = 100;
const GIFT_WRAP_FLAT = 50;

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

let razorpayScriptPromise = null;

const loadRazorpayScript = () => {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
};

const openRazorpayCheckout = (options) => new Promise((resolve) => {
    let settled = false;
    const finish = (payload) => {
      if (settled) return;
      settled = true;
      resolve(payload);
    };

    const rzp = new window.Razorpay({
      ...options,
      handler: (response) => finish({ success: true, response }),
      modal: {
        ...(options.modal || {}),
        ondismiss: () => finish({ success: false, cancelled: true }),
      },
    });

    rzp.on("payment.failed", (response) => {
      finish({ success: false, failed: true, error: response?.error });
    });

    rzp.open();
  });

const normalizePinCode = (value) => String(value || "")
    .replace(/\D/g, "")
    .slice(0, 6);

const fetchIndiaPincodeDetails = async (pinCode) => {
  const response = await fetch(`https://api.postalpincode.in/pincode/${pinCode}`);
  if (!response.ok) {
    throw new Error("Unable to verify PIN code at the moment.");
  }

  const data = await response.json();
  const result = Array.isArray(data) ? data[0] : null;

  if (
    !result ||
    result.Status !== "Success" ||
    !Array.isArray(result.PostOffice) ||
    result.PostOffice.length === 0
  ) {
    throw new Error("Invalid Indian PIN code.");
  }

  const office = result.PostOffice[0] || {};
  const city = office.District || office.Block || office.Name || "";
  const state = office.State || "";

  if (!city || !state) {
    throw new Error("Could not resolve city/state from this PIN code.");
  }

  return { city, state };
};

const getCheckoutLineKey = (item) => [
    String(item?.product || "").trim(),
    String(item?.size || "").trim().toLowerCase(),
    String(item?.color || "").trim().toLowerCase(),
  ].join("__");

export default function Checkout() {
  usePageTitle("Checkout");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { cartItems, giftWrap } = useSelector((s) => s.cart);
  const { isAuthenticated, loading: userLoading, user } = useSelector((s) => s.user);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !isAuthenticated) {
      navigate("/login?redirect=checkout", { replace: true });
    }
  }, [isAuthenticated, userLoading, navigate]);

  // Form state
  const [form, setForm] = useState({
    email: user?.email || "",
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    gst: "",
    address: "",
    apartment: "",
    city: "",
    state: "Tamil Nadu",
    pinCode: "",
    phone: "",
    billingType: "same", // "same" | "different"
    // Billing address fields (used when billingType === "different")
    billFirstName: "",
    billLastName: "",
    billGst: "",
    billAddress: "",
    billApartment: "",
    billCity: "",
    billState: "Tamil Nadu",
    billPinCode: "",
    billPhone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [giftWrapByLine, setGiftWrapByLine] = useState({});
  const pinCacheRef = useRef(new Map());
  const [pinStatus, setPinStatus] = useState({
    shipping: { loading: false, valid: null, message: "" },
    billing: { loading: false, valid: null, message: "" },
  });

  // Policy modal state: null | "terms" | "privacy" | "shipping"
  const [activePolicy, setActivePolicy] = useState(null);

  const setSinglePinStatus = (kind, patch) => {
    setPinStatus((prev) => ({
      ...prev,
      [kind]: {
        ...prev[kind],
        ...patch,
      },
    }));
  };

  const showPinWarning = (message, kind = "shipping") => {
    const finalMessage = message || "Please enter a valid Indian PIN code.";
    setSinglePinStatus(kind, {
      loading: false,
      valid: false,
      message: finalMessage,
    });
    toast.error(finalMessage);
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(finalMessage);
    }
  };

  const validateAndResolvePinCode = async (rawPinCode, kind) => {
    const pinCode = normalizePinCode(rawPinCode);

    if (!PINCODE_REGEX.test(pinCode)) {
      setSinglePinStatus(kind, {
        loading: false,
        valid: false,
        message: "Please enter a valid 6-digit Indian PIN code.",
      });
      return null;
    }

    setSinglePinStatus(kind, {
      loading: true,
      valid: null,
      message: "Checking PIN code...",
    });

    try {
      let details = pinCacheRef.current.get(pinCode);
      if (!details) {
        details = await fetchIndiaPincodeDetails(pinCode);
        pinCacheRef.current.set(pinCode, details);
      }

      if (!INDIAN_STATES.includes(details.state)) {
        throw new Error("Only Indian states listed in checkout are supported.");
      }

      setForm((prev) => kind === "shipping"
          ? { ...prev, pinCode, city: details.city, state: details.state }
          : { ...prev, billPinCode: pinCode, billCity: details.city, billState: details.state }
      );

      setSinglePinStatus(kind, {
        loading: false,
        valid: true,
        message: `${details.city}, ${details.state}`,
      });

      return { pinCode, city: details.city, state: details.state };
    } catch (error) {
      setSinglePinStatus(kind, {
        loading: false,
        valid: false,
        message: error?.message || "Invalid Indian PIN code.",
      });
      return null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "pinCode" || name === "billPinCode") {
      const normalized = normalizePinCode(value);
      setForm((prev) => ({ ...prev, [name]: normalized }));

      const kind = name === "pinCode" ? "shipping" : "billing";
      if (normalized.length < 6) {
        setSinglePinStatus(kind, {
          loading: false,
          valid: null,
          message: normalized.length > 0 ? "Enter full 6-digit PIN code." : "",
        });
      }
      if (normalized.length === 6) {
        void validateAndResolvePinCode(normalized, kind);
      }
      return;
    }

    if (name === "billingType" && value === "same") {
      setSinglePinStatus("billing", { loading: false, valid: null, message: "" });
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const groupedCartItems = useMemo(() => {
    const grouped = new Map();

    for (const item of cartItems) {
      const key = getCheckoutLineKey(item);

      const quantity = Number(item.quantity || 0);
      if (!grouped.has(key)) {
        grouped.set(key, {
          ...item,
          lineKey: key,
          giftWrapDefault: Boolean(item.giftWrap),
          quantity: quantity > 0 ? quantity : 1,
        });
        continue;
      }

      const existing = grouped.get(key);
      existing.quantity += quantity > 0 ? quantity : 1;
      existing.giftWrapDefault = existing.giftWrapDefault || Boolean(item.giftWrap);
    }

    return Array.from(grouped.values());
  }, [cartItems]);

  const totalUnits = useMemo(
    () => groupedCartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [groupedCartItems]
  );

  const isLineGiftWrapped = (item) => {
    const chosen = giftWrapByLine[item.lineKey];
    if (chosen === undefined) {
      return Boolean(item.giftWrapDefault) || Boolean(giftWrap);
    }
    return Boolean(chosen);
  };

  const toggleLineGiftWrap = (item) => {
    setGiftWrapByLine((prev) => {
      const selected = prev[item.lineKey];
      const resolvedSelected =
        selected === undefined
          ? Boolean(item.giftWrapDefault) || Boolean(giftWrap)
          : Boolean(selected);
      return {
        ...prev,
        [item.lineKey]: !resolvedSelected,
      };
    });
  };

  const giftWrapUnits = groupedCartItems.reduce(
    (sum, item) => sum + (isLineGiftWrapped(item) ? Number(item.quantity || 0) : 0),
    0
  );

  // Totals
  const subtotal = groupedCartItems.reduce(
    (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0),
    0
  );
  const hasGiftWrap = giftWrapUnits > 0;
  const giftWrapPrice = giftWrapUnits * GIFT_WRAP_FLAT;
  const total = subtotal + SHIPPING_FLAT + giftWrapPrice;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    // Validate required fields
    const required = ["firstName", "address", "city", "state", "pinCode", "phone"];
    for (const field of required) {
      if (!form[field]?.trim()) {
        toast.error(`Please fill in the ${field.replace(/([A-Z])/g, " $1").toLowerCase()} field.`);
        return;
      }
    }

    const normalizedShippingPinCode = normalizePinCode(form.pinCode);
    if (!PINCODE_REGEX.test(normalizedShippingPinCode)) {
      showPinWarning("Please enter a valid 6-digit Indian shipping PIN code before payment.", "shipping");
      return;
    }

    const shippingPinResolved = await validateAndResolvePinCode(form.pinCode, "shipping");
    if (!shippingPinResolved) {
      showPinWarning("Invalid shipping PIN code. Please correct it before payment.", "shipping");
      return;
    }

    let billingPinResolved = null;
    if (form.billingType === "different" && String(form.billPinCode || "").trim()) {
      const normalizedBillingPinCode = normalizePinCode(form.billPinCode);
      if (!PINCODE_REGEX.test(normalizedBillingPinCode)) {
        showPinWarning("Please enter a valid 6-digit Indian billing PIN code before payment.", "billing");
        return;
      }

      billingPinResolved = await validateAndResolvePinCode(form.billPinCode, "billing");
      if (!billingPinResolved) {
        showPinWarning("Invalid billing PIN code. Please correct it before payment.", "billing");
        return;
      }
    }

    setSubmitting(true);

    const shippingInfo = {
      firstName: form.firstName,
      lastName: form.lastName,
      gst: form.gst || "",
      address: form.address,
      apartment: form.apartment || "",
      city: shippingPinResolved.city || form.city,
      state: shippingPinResolved.state || form.state,
      country: "India",
      pinCode: Number(shippingPinResolved.pinCode || form.pinCode),
      phoneNo: Number(form.phone),
    };

    const billingInfo =
      form.billingType === "different"
        ? {
            firstName: form.billFirstName,
            lastName: form.billLastName,
            gst: form.billGst || "",
            address: form.billAddress,
            apartment: form.billApartment || "",
            city: billingPinResolved?.city || form.billCity,
            state: billingPinResolved?.state || form.billState,
            country: "India",
            pinCode: billingPinResolved?.pinCode
              ? Number(billingPinResolved.pinCode)
              : form.billPinCode
              ? Number(form.billPinCode)
              : undefined,
            phoneNo: form.billPhone ? Number(form.billPhone) : undefined,
      }
        : shippingInfo;

    const orderItems = groupedCartItems.map((i) => ({
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      size: i.size || "",
      color: i.color || "",
      giftWrap: isLineGiftWrapped(i),
      image: i.image || "/images/new_arrival1.png",
      product: i.product,
    }));

    try {
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        throw new Error("Unable to load Razorpay checkout. Please check your connection and retry.");
      }

      const paymentInit = await dispatch(
        createRazorpayOrder({ orderItems, giftWrap: hasGiftWrap })
      ).unwrap();

      const { razorpayOrder, key } = paymentInit || {};
      if (!razorpayOrder?.id || !key) {
        throw new Error("Failed to initialize payment gateway.");
      }

      const paymentResult = await openRazorpayCheckout({
        key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        name: "Iragu For Her",
        description: "Secure checkout",
        order_id: razorpayOrder.id,
        prefill: {
          name: [form.firstName, form.lastName].filter(Boolean).join(" "),
          email: user?.email || form.email || "",
          contact: form.phone || "",
        },
        notes: {
          address: form.address || "",
          customerId: user?._id || "",
        },
        theme: {
          color: "#2a3a33",
        },
      });

      if (!paymentResult.success) {
        if (paymentResult.cancelled) {
          toast.error("Payment was cancelled. Your cart is still saved.");
          return;
        }
        const failureMessage =
          paymentResult.error?.description ||
          paymentResult.error?.reason ||
          "Payment failed. Please try again.";
        throw new Error(failureMessage);
      }

      const verifyPayload = {
        shippingInfo,
        billingType: form.billingType,
        billingInfo,
        orderItems,
        giftWrap: hasGiftWrap,
        razorpay_order_id: paymentResult.response.razorpay_order_id,
        razorpay_payment_id: paymentResult.response.razorpay_payment_id,
        razorpay_signature: paymentResult.response.razorpay_signature,
      };

      const verifyResult = await dispatch(verifyRazorpayPayment(verifyPayload)).unwrap();

      dispatch(clearCart());
      toast.success("Payment successful. Order placed.");
      navigate(`/payment/success?orderId=${verifyResult?.order?._id || ""}`, {
        state: { order: verifyResult?.order || null },
      });
    } catch (err) {
      const msg = err?.message || "Failed to place order. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // If cart is empty, redirect home
  if (cartItems.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg text-[#6b6b6b]" style={{ fontFamily: "Cormorant Garamond, serif" }}>
          Your cart is empty
        </p>
        <Link
          to="/"
          className="rounded px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:opacity-90"
          style={{ background: "var(--brand-ink)" }}
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Logo header */}
      <div className="border-b border-black/5 py-5 text-center">
        <Link to="/">
          <div className="mx-auto h-12 w-48 overflow-hidden sm:h-14 sm:w-56">
            <img
              src="/images/logo.png"
              alt="Iragu For Her"
              className="h-auto w-full -mt-[22%] object-contain"
            />
          </div>
        </Link>
      </div>

      <form onSubmit={handlePlaceOrder}>
        <div className="mx-auto flex max-w-6xl flex-col gap-0 lg:flex-row">
          {/* ════════ LEFT: Delivery form ════════ */}
          <div className="order-2 flex-1 border-r border-black/5 px-5 py-8 sm:px-10 lg:order-1 lg:px-14">
            {/* Email / User info */}
            {isAuthenticated ? (
              <div className="mb-6 flex items-center gap-3 rounded-md border border-black/10 bg-[#fbf7f0] px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--brand-ink)] text-xs font-bold text-white">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="text-sm text-[#1f1f1f]">{user?.email}</span>
              </div>
            ) : (
              <div className="mb-6">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-full rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
                 id="email" aria-label="Email"/>
              </div>
            )}

            <h2 className="text-lg font-semibold text-[#1f1f1f]">Delivery</h2>

            {/* Country */}
            <div className="relative mt-4">
              <label className="text-xs text-[#6b6b6b]">Country/Region</label>
              <div className="mt-1 flex items-center rounded border border-black/15 bg-[#f5f5f5] px-4 py-3 text-sm text-[#1f1f1f]">
                India
                <FiChevronDown size={16} className="ml-auto text-[#9a9a9a]" />
              </div>
            </div>

            {/* Name row */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="First name"
                required
                className="rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
               id="firstname" aria-label="First name"/>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Last name"
                className="rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
               id="lastname" aria-label="Last name"/>
            </div>

            {/* GST */}
            <input
              type="text"
              name="gst"
              value={form.gst}
              onChange={handleChange}
              placeholder="GST (Optional)"
              className="mt-3 w-full rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
             id="gst" aria-label="GST (Optional)"/>

            {/* Address */}
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address"
              required
              className="mt-3 w-full rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
             id="address" aria-label="Address"/>

            {/* Apartment */}
            <input
              type="text"
              name="apartment"
              value={form.apartment}
              onChange={handleChange}
              placeholder="Apartment, suite, etc. (optional)"
              className="mt-3 w-full rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
             id="apartment" aria-label="Apartment, suite, etc. (optional)"/>

            {/* City / State / PIN */}
            <div className="mt-3 grid grid-cols-3 gap-3">
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
                required
                className="rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
               id="city" aria-label="City"/>
              <div className="relative">
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="h-full w-full appearance-none rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
                 id="state" aria-label="state">
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <FiChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9a9a]"
                />
              </div>
              <input
                type="text"
                name="pinCode"
                value={form.pinCode}
                onChange={handleChange}
                placeholder="PIN code"
                inputMode="numeric"
                maxLength={6}
                required
                className="rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
               id="pincode" aria-label="PIN code"/>
            </div>
            {pinStatus.shipping.message ? (
              <p
                className={`mt-1 text-xs ${
                  pinStatus.shipping.valid === false
                    ? "text-red-600"
                    : pinStatus.shipping.valid
                    ? "text-green-700"
                    : "text-[#7a7a7a]"
                }`}
              >
                {pinStatus.shipping.loading
                  ? "Checking PIN code..."
                  : pinStatus.shipping.valid
                  ? `PIN code matched: ${pinStatus.shipping.message}`
                  : pinStatus.shipping.message}
              </p>
            ) : null}

            {/* Phone */}
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone"
              required
              className="mt-3 w-full rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
             id="phone" aria-label="Phone"/>

            {/* ── Shipping method ── */}
            <div className="mt-8">
              <h3 className="text-base font-semibold text-[#1f1f1f]">
                Shipping method
              </h3>
              <div className="mt-3 flex items-center justify-between rounded border border-black/10 bg-[#fbf7f0] px-4 py-3 text-sm">
                <span className="text-[#1f1f1f]">Standard</span>
                <span className="font-medium text-[#1f1f1f]">
                  ₹{SHIPPING_FLAT.toLocaleString("en-IN")}.00
                </span>
              </div>
            </div>

            {/* ── Payment ── */}
            <div className="mt-8">
              <h3 className="text-base font-semibold text-[#1f1f1f]">Payment</h3>
              <p className="mt-1 text-xs text-[#9a9a9a]">
                All transactions are secure and encrypted.
              </p>
              <div className="mt-3 rounded border border-black/10 bg-[#fbf7f0] px-4 py-4">
                <span className="text-sm text-[#1f1f1f]">Razorpay Secure Checkout</span>
                <p className="mt-2 text-xs text-[#9a9a9a]">
                  You'll be redirected to Razorpay Secure to complete your
                  purchase.
                </p>
              </div>
            </div>

            {/* ── Billing address ── */}
            <div className="mt-8">
              <h3 className="text-base font-semibold text-[#1f1f1f]">
                Billing address
              </h3>
              <div className="mt-3 overflow-hidden rounded border border-black/10">
                {/* Option 1: Same as shipping */}
                <label className="flex cursor-pointer items-center gap-2 border-b border-black/10 bg-white px-4 py-3.5 text-sm text-[#1f1f1f]">
                  <input
                    type="radio"
                    name="billingType"
                    value="same"
                    checked={form.billingType === "same"}
                    onChange={handleChange}
                    className="accent-[color:var(--brand-ink)]"
                   id="billingtype" aria-label="billingType"/>
                  Same as shipping address
                </label>

                {/* Option 2: Different */}
                <label className="flex cursor-pointer items-center gap-2 bg-white px-4 py-3.5 text-sm text-[#1f1f1f]">
                  <input
                    type="radio"
                    name="billingType"
                    value="different"
                    checked={form.billingType === "different"}
                    onChange={handleChange}
                    className="accent-[color:var(--brand-ink)]"
                   id="billingtype-2" aria-label="billingType"/>
                  Use a different billing address
                </label>

                {/* Billing form — visible only when "different" is selected */}
                {form.billingType === "different" ? (
                  <div className="space-y-3 border-t border-black/10 bg-[#f9f9f9] px-4 py-5">
                    {/* Country */}
                    <div>
                      <label className="text-xs text-[#6b6b6b]">Country/Region</label>
                      <div className="mt-1 flex items-center rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f]">
                        India
                        <FiChevronDown size={16} className="ml-auto text-[#9a9a9a]" />
                      </div>
                    </div>

                    {/* Name */}
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        name="billFirstName"
                        value={form.billFirstName}
                        onChange={handleChange}
                        placeholder="First name"
                        className="rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
                       id="billfirstname" aria-label="First name"/>
                      <input
                        type="text"
                        name="billLastName"
                        value={form.billLastName}
                        onChange={handleChange}
                        placeholder="Last name"
                        className="rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
                       id="billlastname" aria-label="Last name"/>
                    </div>

                    {/* GST */}
                    <input
                      type="text"
                      name="billGst"
                      value={form.billGst}
                      onChange={handleChange}
                      placeholder="GST (Optional)"
                      className="w-full rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
                     id="billgst" aria-label="GST (Optional)"/>

                    {/* Address */}
                    <input
                      type="text"
                      name="billAddress"
                      value={form.billAddress}
                      onChange={handleChange}
                      placeholder="Address"
                      className="w-full rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
                     id="billaddress" aria-label="Address"/>

                    {/* Apartment */}
                    <input
                      type="text"
                      name="billApartment"
                      value={form.billApartment}
                      onChange={handleChange}
                      placeholder="Apartment, suite, etc. (optional)"
                      className="w-full rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
                     id="billapartment" aria-label="Apartment, suite, etc. (optional)"/>

                    {/* City / State / PIN */}
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        name="billCity"
                        value={form.billCity}
                        onChange={handleChange}
                        placeholder="City"
                        className="rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
                       id="billcity" aria-label="City"/>
                      <div className="relative">
                        <label className="absolute left-4 top-1 text-[10px] text-[#9a9a9a]">State</label>
                        <select
                          name="billState"
                          value={form.billState}
                          onChange={handleChange}
                          className="h-full w-full appearance-none rounded border border-black/15 bg-white px-4 pt-4 pb-2 text-sm text-[#1f1f1f] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
                         id="billstate" aria-label="billState">
                          {INDIAN_STATES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <FiChevronDown
                          size={14}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9a9a]"
                        />
                      </div>
                      <input
                        type="text"
                        name="billPinCode"
                        value={form.billPinCode}
                        onChange={handleChange}
                        placeholder="PIN code"
                        inputMode="numeric"
                        maxLength={6}
                        className="rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
                       id="billpincode" aria-label="PIN code"/>
                    </div>
                    {pinStatus.billing.message ? (
                      <p
                        className={`-mt-1 text-xs ${
                          pinStatus.billing.valid === false
                            ? "text-red-600"
                            : pinStatus.billing.valid
                            ? "text-green-700"
                            : "text-[#7a7a7a]"
                        }`}
                      >
                        {pinStatus.billing.loading
                          ? "Checking PIN code..."
                          : pinStatus.billing.valid
                          ? `PIN code matched: ${pinStatus.billing.message}`
                          : pinStatus.billing.message}
                      </p>
                    ) : null}

                    {/* Phone */}
                    <input
                      type="tel"
                      name="billPhone"
                      value={form.billPhone}
                      onChange={handleChange}
                      placeholder="Phone (optional)"
                      className="w-full rounded border border-black/15 bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
                     id="billphone" aria-label="Phone (optional)"/>
                  </div>
                ) : null}
              </div>
            </div>

            {/* ── Pay now button ── */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-8 w-full rounded py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--brand-ink)" }}
            >
              {submitting ? "Processing…" : "Pay now"}
            </button>

            {/* Footer links */}
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-[#9a9a9a]">
              <button
                type="button"
                onClick={() => setActivePolicy("shipping")}
                className="cursor-pointer bg-transparent border-none p-0 text-xs text-[#9a9a9a] hover:underline"
              >
                Shipping &amp; Return Policy
              </button>
              <button
                type="button"
                onClick={() => setActivePolicy("privacy")}
                className="cursor-pointer bg-transparent border-none p-0 text-xs text-[#9a9a9a] hover:underline"
              >
                Privacy policy
              </button>
              <button
                type="button"
                onClick={() => setActivePolicy("terms")}
                className="cursor-pointer bg-transparent border-none p-0 text-xs text-[#9a9a9a] hover:underline"
              >
                Terms of service
              </button>
            </div>
          </div>

          {/* ════════ RIGHT: Order summary ════════ */}
          <div className="order-1 w-full px-5 py-8 sm:px-10 lg:order-2 lg:w-[420px] lg:px-10">
            <div className="rounded-lg border border-black/8 bg-[#fbf7f0] p-6">
              {/* Cart items summary */}
              <div className="mb-3 text-xs text-[#6b6b6b]">
                {totalUnits} item{totalUnits === 1 ? "" : "s"} in cart
              </div>
              <div className="space-y-3">
                {groupedCartItems.map((item, i) => {
                  const isWrapped = isLineGiftWrapped(item);
                  const lineGiftWrapPrice = Number(item.quantity || 0) * GIFT_WRAP_FLAT;

                  return (
                    <div
                      key={`${item.lineKey}_${i}`}
                      className="flex items-start gap-3 rounded-md border border-black/8 bg-white/70 p-2.5"
                    >
                      {/* Image with quantity badge */}
                      <div className="relative h-16 w-14 flex-shrink-0 rounded border border-black/10 bg-white">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full rounded object-cover"
                        />
                        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--brand-ink)] px-1.5 text-[10px] font-bold leading-none text-white shadow-sm">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug text-[#1f1f1f]">
                          {item.name}
                        </p>
                        <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-[#9a9a9a]">
                          {item.size ? <span>Size: {item.size}</span> : null}
                          {item.color ? <span>Colour: {item.color}</span> : null}
                        </div>
                        <p className="mt-1 text-xs text-[#6b6b6b]">
                          Qty {item.quantity} x Rs. {Number(item.price || 0).toLocaleString("en-IN")}
                        </p>

                        <button
                          type="button"
                          onClick={() => toggleLineGiftWrap(item)}
                          className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                            isWrapped
                              ? "border-[color:var(--brand-ink)] bg-[color:var(--brand-ink)]/10 text-[color:var(--brand-ink)]"
                              : "border-black/15 text-[#6b6b6b] hover:bg-black/[0.03]"
                          }`}
                          aria-pressed={isWrapped}
                        >
                          <FiGift size={13} />
                          <span>
                            {isWrapped
                              ? `Gift wrap added (+Rs. ${lineGiftWrapPrice.toLocaleString("en-IN")})`
                              : "Add gift wrap (+Rs. 50/item)"}
                          </span>
                        </button>
                      </div>
                      <p className="flex-shrink-0 text-sm font-semibold text-[#1f1f1f]">
                        Rs. {(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString("en-IN")}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Discount code */}
              <div className="mt-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Discount code or gift card"
                  className="flex-1 rounded border border-black/15 bg-white px-4 py-2.5 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
                 name="discount-code-or-gift-card" id="discount-code-or-gift-card" aria-label="Discount code or gift card"/>
                <button
                  type="button"
                  className="rounded border border-black/15 bg-[#f5f5f5] px-5 py-2.5 text-sm font-medium text-[#6b6b6b] transition hover:bg-black/5"
                >
                  Apply
                </button>
              </div>

              {/* Totals */}
              <div className="mt-6 space-y-2 border-t border-black/10 pt-4">
                <div className="flex justify-between text-sm text-[#1f1f1f]">
                  <span>Subtotal</span>
                  <span>Rs. {subtotal.toLocaleString("en-IN")}.00</span>
                </div>
                <div className="flex justify-between text-sm text-[#6b6b6b]">
                  <span>Shipping</span>
                  <span>Rs. {SHIPPING_FLAT.toLocaleString("en-IN")}.00</span>
                </div>
                {giftWrapPrice > 0 ? (
                  <div className="flex justify-between text-sm text-[#6b6b6b]">
                    <span>Gift wrap ({giftWrapUnits} item{giftWrapUnits === 1 ? "" : "s"})</span>
                    <span>Rs. {giftWrapPrice.toLocaleString("en-IN")}.00</span>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 border-t border-black/10 pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-semibold text-[#1f1f1f]">
                    Total
                  </span>
                  <div className="text-right">
                    <span className="text-xs text-[#9a9a9a]">INR </span>
                    <span className="text-lg font-semibold text-[#1f1f1f]">
                      Rs. {total.toLocaleString("en-IN")}.00
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ── Policy Modals ── */}
      <PolicyModal
        isOpen={activePolicy === "terms"}
        onClose={() => setActivePolicy(null)}
        title="Terms And Conditions"
      >
        <TermsAndConditions />
      </PolicyModal>

      <PolicyModal
        isOpen={activePolicy === "privacy"}
        onClose={() => setActivePolicy(null)}
        title="Privacy Policy"
      >
        <PrivacyPolicy />
      </PolicyModal>

      <PolicyModal
        isOpen={activePolicy === "shipping"}
        onClose={() => setActivePolicy(null)}
        title="Shipping and Returns Policy"
      >
        <ShippingAndReturnsPolicy />
      </PolicyModal>
    </div>
  );
}


