import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCamera,
  FiChevronRight,
  FiEdit3,
  FiLock,
  FiPackage,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import toast from "react-hot-toast";
import InteractiveStarRating from "../components/InteractiveStarRating.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { getAvatarUrl, isDefaultAvatar } from "../utils/avatarHelper.js";
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from "../utils/passwordPolicy.js";
import axiosInstance from "../utils/axiosInstance.js";
import {
  loadUser,
  updateUserPassword,
  updateUserProfile,
  updateUserAvatar,
  removeUserAvatar,
  clearUserError,
  clearPasswordMessage,
  clearProfileMessage,
} from "../features/user/userSlice.js";
import {
  fetchMyOrders,
  fetchOrderDetails,
  clearSelectedOrder,
  clearOrdersError,
} from "../features/orders/ordersSlice.js";
import {
  submitReview,
  clearReviewState,
} from "../features/products/productDetailSlice.js";

const EXCHANGE_WINDOW_DAYS = 3;
const EXCHANGE_WINDOW_MS = EXCHANGE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

const normalizePhoneDigits = (value) => String(value || "").replace(/\D/g, "");

export default function Account() {
  usePageTitle("My Account");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = tabParam === "orders" ? "orders" : "profile";

  const {
    user,
    isAuthenticated,
    loading,
    error,
    profileUpdating,
    avatarUpdating,
    avatarRemoving,
    passwordUpdating,
    profileMessage,
    passwordMessage,
  } = useSelector((s) => s.user);

  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    selectedOrder,
    selectedLoading,
    selectedError,
  } = useSelector((s) => s.orders);
  const { reviewLoading } = useSelector((s) => s.productDetail);

  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [reviewModal, setReviewModal] = useState({
    open: false,
    productId: "",
    productName: "",
  });
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewedProductMap, setReviewedProductMap] = useState({});
  const [reviewStatusLoading, setReviewStatusLoading] = useState(false);
  const [exchangeByOrderId, setExchangeByOrderId] = useState({});
  const [exchangeLoadingOrderId, setExchangeLoadingOrderId] = useState("");
  const [exchangeSubmitting, setExchangeSubmitting] = useState(false);
  const [exchangeModal, setExchangeModal] = useState({
    open: false,
    orderId: "",
  });
  const [exchangeForm, setExchangeForm] = useState({
    name: "",
    email: "",
    address: "",
    reason: "",
    mobileNumber: "",
  });
  const avatarInputRef = useRef(null);

  const avatarUrl = getAvatarUrl(user);
  const hasCustomAvatar = !isDefaultAvatar(user);

  useEffect(() => {
    // If user refreshed and redux is empty, try to load session
    if (!user && isAuthenticated) dispatch(loadUser());
    if (!user && !isAuthenticated && !loading) navigate("/login");
  }, [dispatch, user, isAuthenticated, loading, navigate]);

  useEffect(() => {
    // Hydrate form fields when user loads
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearUserError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (ordersError) {
      toast.error(ordersError);
      dispatch(clearOrdersError());
    }
  }, [ordersError, dispatch]);

  useEffect(() => {
    if (selectedError) toast.error(selectedError);
  }, [selectedError]);

  useEffect(() => {
    if (profileMessage) {
      toast.success(profileMessage);
      dispatch(clearProfileMessage());
    }
  }, [profileMessage, dispatch]);

  useEffect(() => {
    if (passwordMessage) {
      toast.success(passwordMessage);
      dispatch(clearPasswordMessage());
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    }
  }, [passwordMessage, dispatch]);

  const setTab = (tab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next, { replace: true });
    if (tab !== "orders") {
      setSelectedOrderId(null);
      dispatch(clearSelectedOrder());
    }
  };

  useEffect(() => {
    if (activeTab === "orders" && isAuthenticated) {
      dispatch(fetchMyOrders());
    }
  }, [activeTab, isAuthenticated, dispatch]);

  const onUploadClick = () => {
    avatarInputRef.current?.click();
  };

  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    dispatch(updateUserAvatar(file));
  };

  const onRemoveAvatar = () => {
    if (!hasCustomAvatar) return;
    dispatch(removeUserAvatar());
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    const name = profileForm.name.trim();
    const email = profileForm.email.trim();
    if (name.length < 4) {
      toast.error("Name must be at least 4 characters");
      return;
    }
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    dispatch(updateUserProfile({ name, email }));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = passwordForm;
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (!isStrongPassword(newPassword)) {
      toast.error(PASSWORD_POLICY_MESSAGE);
      return;
    }
    if (oldPassword === newPassword) {
      toast.error("New password must be different from current password");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    dispatch(updateUserPassword({ oldPassword, newPassword, confirmPassword }));
  };

  const formatMoney = (value) => {
    const n = Number(value || 0);
    return n.toLocaleString("en-IN");
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const statusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("delivered")) return "bg-[#f0faf1] text-[#2e7d32] border-[#c8e6c9]";
    if (s.includes("shipped")) return "bg-[#eef7ff] text-[#1565c0] border-[#bbdefb]";
    if (s.includes("cancel")) return "bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]";
    return "bg-[#fff7ed] text-[#9a3412] border-[#fed7aa]"; // processing/default
  };
  const isDeliveredStatus = (status) => String(status || "").trim().toLowerCase() === "delivered";
  const exchangeStatusBadge = (status) => {
    const normalized = String(status || "").trim().toLowerCase();
    if (normalized === "exchange accepted") {
      return "bg-[#f0faf1] text-[#2e7d32] border-[#c8e6c9]";
    }
    if (normalized === "exchange rejected") {
      return "bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]";
    }
    return "bg-[#fff7ed] text-[#9a3412] border-[#fed7aa]";
  };
  const getExchangeEligibility = (order) => {
    if (!order || !isDeliveredStatus(order.orderStatus)) {
      return {
        canApply: false,
        message: "Exchange is available only after order is delivered.",
        deadline: null,
      };
    }

    const deliveredAtMs = new Date(order.deliveredAt || "").getTime();
    if (!Number.isFinite(deliveredAtMs) || deliveredAtMs <= 0) {
      return {
        canApply: false,
        message: "Exchange is currently unavailable for this order.",
        deadline: null,
      };
    }

    const deadlineMs = deliveredAtMs + EXCHANGE_WINDOW_MS;
    if (Date.now() > deadlineMs) {
      return {
        canApply: false,
        message: `Exchange window closed on ${formatDate(deadlineMs)}.`,
        deadline: deadlineMs,
      };
    }

    return {
      canApply: true,
      message: `Apply exchange before ${formatDate(deadlineMs)} (${EXCHANGE_WINDOW_DAYS} days from delivery).`,
      deadline: deadlineMs,
    };
  };
  const currentUserId = user?._id || user?.id || "";

  useEffect(() => {
    let cancelled = false;

    async function loadReviewedFlags() {
      if (!selectedOrder || !isDeliveredStatus(selectedOrder.orderStatus) || !currentUserId) {
        setReviewedProductMap({});
        return;
      }

      const productIds = Array.from(
        new Set(
          (selectedOrder.orderItems || [])
            .map((it) => (it?.product ? String(it.product) : ""))
            .filter(Boolean)
        )
      );

      if (!productIds.length) {
        setReviewedProductMap({});
        return;
      }

      setReviewStatusLoading(true);

      try {
        const entries = await Promise.all(
          productIds.map(async (productId) => {
            try {
              const { data } = await axiosInstance.get(`/api/v1/product/${productId}`);
              const reviews = Array.isArray(data?.product?.reviews) ? data.product.reviews : [];
              const hasReviewed = reviews.some((r) => {
                const reviewUserId =
                  typeof r?.user === "string" ? r.user : r?.user?._id || r?.user;
                return reviewUserId && String(reviewUserId) === String(currentUserId);
              });
              return [productId, hasReviewed];
            } catch {
              return [productId, false];
            }
          })
        );

        if (!cancelled) {
          setReviewedProductMap(Object.fromEntries(entries));
        }
      } finally {
        if (!cancelled) {
          setReviewStatusLoading(false);
        }
      }
    }

    loadReviewedFlags();

    return () => {
      cancelled = true;
    };
  }, [selectedOrder, currentUserId]);

  const selectedOrderKey = String(selectedOrder?._id || "");
  const hasLoadedExchangeForSelectedOrder =
    Boolean(selectedOrderKey) &&
    Object.prototype.hasOwnProperty.call(exchangeByOrderId, selectedOrderKey);

  useEffect(() => {
    let cancelled = false;

    async function loadExchangeRequestForSelectedOrder() {
      if (!selectedOrderKey || hasLoadedExchangeForSelectedOrder) {
        return;
      }

      setExchangeLoadingOrderId(selectedOrderKey);

      try {
        const { data } = await axiosInstance.get(`/api/v1/order/${selectedOrderKey}/exchange`);
        if (!cancelled) {
          setExchangeByOrderId((prev) => ({
            ...prev,
            [selectedOrderKey]: data?.exchangeRequest || null,
          }));
        }
      } catch (apiError) {
        if (!cancelled) {
          setExchangeByOrderId((prev) => ({
            ...prev,
            [selectedOrderKey]: null,
          }));
          const message =
            apiError?.response?.data?.message ||
            apiError?.message ||
            "Unable to load exchange status";
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setExchangeLoadingOrderId((current) => current === selectedOrderKey ? "" : current
          );
        }
      }
    }

    loadExchangeRequestForSelectedOrder();

    return () => {
      cancelled = true;
    };
  }, [selectedOrderKey, hasLoadedExchangeForSelectedOrder]);

  const openExchangeModal = () => {
    if (!selectedOrder) return;
    const orderId = String(selectedOrder._id || "");
    if (!orderId) return;

    const shippingInfo = selectedOrder.shippingInfo || {};
    const defaultAddress = [
      shippingInfo.address,
      shippingInfo.city,
      shippingInfo.state,
      shippingInfo.country,
      shippingInfo.pinCode,
    ]
      .filter(Boolean)
      .join(", ");

    setExchangeForm({
      name: user?.name || "",
      email: user?.email || "",
      address: defaultAddress,
      reason: "",
      mobileNumber: String(shippingInfo.phoneNo || ""),
    });
    setExchangeModal({ open: true, orderId });
  };

  const closeExchangeModal = () => {
    setExchangeModal({ open: false, orderId: "" });
    setExchangeSubmitting(false);
  };

  const handleExchangeSubmit = async (e) => {
    e.preventDefault();

    const name = String(exchangeForm.name || "").trim();
    const email = String(exchangeForm.email || "").trim().toLowerCase();
    const address = String(exchangeForm.address || "").trim();
    const reason = String(exchangeForm.reason || "").trim();
    const mobileNumber = normalizePhoneDigits(exchangeForm.mobileNumber);

    if (!exchangeModal.orderId) {
      toast.error("Unable to submit exchange request. Please try again.");
      return;
    }
    if (!name || !email || !address || !reason || !mobileNumber) {
      toast.error("Please fill all exchange details");
      return;
    }
    if (!/^\d{10}$/.test(mobileNumber)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    if (reason.length < 10) {
      toast.error("Please provide at least 10 characters for the exchange reason");
      return;
    }

    setExchangeSubmitting(true);

    try {
      const { data } = await axiosInstance.post(
        `/api/v1/order/${exchangeModal.orderId}/exchange`,
        {
          name,
          email,
          address,
          reason,
          mobileNumber,
        }
      );

      setExchangeByOrderId((prev) => ({
        ...prev,
        [exchangeModal.orderId]: data?.exchangeRequest || null,
      }));
      toast.success("Exchange request submitted successfully");
      closeExchangeModal();
    } catch (apiError) {
      const message =
        apiError?.response?.data?.message ||
        apiError?.message ||
        "Failed to submit exchange request";
      toast.error(message);
      setExchangeSubmitting(false);
    }
  };

  const openReviewModal = (item) => {
    const productId = item?.product ? String(item.product) : "";
    if (!productId) return;
    setReviewModal({
      open: true,
      productId,
      productName: item?.name || "Product",
    });
    setReviewRating(0);
    setReviewComment("");
    dispatch(clearReviewState());
  };

  const closeReviewModal = () => {
    setReviewModal({ open: false, productId: "", productName: "" });
    setReviewRating(0);
    setReviewComment("");
    dispatch(clearReviewState());
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModal.productId) {
      toast.error("Missing product information. Please try again.");
      return;
    }
    if (!reviewRating) {
      toast.error("Please select a rating");
      return;
    }
    if (!reviewComment.trim()) {
      toast.error("Please write a review");
      return;
    }

    try {
      await dispatch(
        submitReview({
          rating: reviewRating,
          comment: reviewComment.trim(),
          productId: reviewModal.productId,
        })
      ).unwrap();

      setReviewedProductMap((prev) => ({
        ...prev,
        [reviewModal.productId]: true,
      }));
      toast.success("Review submitted successfully");
      closeReviewModal();
    } catch (submitError) {
      toast.error(submitError || "Failed to submit review");
    }
  };

  /* ─── Reusable: Order list ─── */
  const renderOrderList = () => (
    <div className="min-w-0 rounded-lg border border-black/10">
      <div className="flex items-center justify-between border-b border-black/5 px-4 py-4 sm:px-5">
        <p className="text-sm font-semibold text-[#1f1f1f]">Order history</p>
        {ordersLoading ? (
          <span className="text-xs text-[#9a9a9a]">Loading…</span>
        ) : (
          <span className="text-xs text-[#9a9a9a]">
            {orders?.length || 0} orders
          </span>
        )}
      </div>

      {ordersLoading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-md bg-black/[0.03]" />
          ))}
        </div>
      ) : orders?.length ? (
        <div className="divide-y divide-black/5">
          {orders.map((o) => {
            const isActive = selectedOrderId === o._id;
            return (
              <button
                key={o._id}
                type="button"
                onClick={() => {
                  setSelectedOrderId(o._id);
                  dispatch(fetchOrderDetails(o._id));
                }}
                className={`flex w-full flex-col items-start justify-between gap-3 px-4 py-4 text-left transition hover:bg-black/[0.02] sm:flex-row sm:items-center sm:gap-4 sm:px-5 ${
                  isActive ? "bg-black/[0.02]" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1f1f1f]">
                    Order #{String(o._id).slice(-8).toUpperCase()}
                  </p>
                  <p className="mt-0.5 whitespace-nowrap text-xs text-[#6b6b6b]">
                    {formatDate(o.createdAt)} · {o.orderItems?.length || 0} item(s)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadge(
                      o.orderStatus
                    )}`}
                  >
                    {o.orderStatus || "Processing"}
                  </span>
                  <FiChevronRight className="text-[#9a9a9a]" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center">
          <p className="text-sm text-[#6b6b6b]">
            You don't have any orders yet.
          </p>
          <Link
            to="/"
            className="mt-5 inline-block rounded px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90"
            style={{ background: "var(--brand-ink)" }}
          >
            Start Shopping
          </Link>
        </div>
      )}
    </div>
  );

  /* ─── Reusable: Order detail ─── */
  const renderOrderDetail = () => {
    if (!selectedOrder) return null;
    const orderId = String(selectedOrder._id || "");
    const hasLoadedExchange = Boolean(orderId) &&
      Object.prototype.hasOwnProperty.call(exchangeByOrderId, orderId);
    const exchangeRequest = hasLoadedExchange ? exchangeByOrderId[orderId] : null;
    const exchangeEligibility = getExchangeEligibility(selectedOrder);
    const isExchangeLoading =
      exchangeLoadingOrderId === orderId && !hasLoadedExchange;

    return (
      <div className="p-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1f1f1f]">
              Order #{String(selectedOrder._id).slice(-8).toUpperCase()}
            </p>
            <p className="mt-0.5 text-xs text-[#6b6b6b]">
              Placed on {formatDate(selectedOrder.createdAt)}
            </p>
          </div>
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadge(
              selectedOrder.orderStatus
            )}`}
          >
            {selectedOrder.orderStatus || "Processing"}
          </span>
        </div>

        {/* Summary strip */}
        <div className="mt-5 grid gap-3 rounded-lg bg-black/[0.03] p-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
              Total
            </p>
            <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">
              Rs. {formatMoney(selectedOrder.totalPrice)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
              Payment
            </p>
            <p className="mt-1 text-sm text-[#1f1f1f]">
              {selectedOrder.paymentInfo?.status || "processing"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
              Items
            </p>
            <p className="mt-1 text-sm text-[#1f1f1f]">
              {selectedOrder.orderItems?.length || 0}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="mt-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
            Items
          </p>
          <div className="mt-2 divide-y divide-black/5 rounded-lg border border-black/10">
            {(selectedOrder.orderItems || []).map((it, idx) => (
              <Link
                key={`${it.product}_${idx}`}
                to={it.product ? `/product/${String(it.product)}` : "#"}
                onClick={(e) => {
                  // Defensive: if product id missing, don't navigate
                  if (!it.product) e.preventDefault();
                }}
                className="flex items-center gap-4 p-4 no-underline transition hover:bg-black/[0.02]"
                aria-label={it.product ? `View product: ${it.name}` : `Product unavailable: ${it.name}`}
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-black/10 bg-[#fbf7f0]">
                  <img
                    src={it.image}
                    alt={it.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#1f1f1f]">
                    {it.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#6b6b6b]">
                    Qty {it.quantity}
                    {it.size ? ` - Size ${it.size}` : ""}
                    {it.color ? ` - Colour ${it.color}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-[#1f1f1f]">
                    Rs. {formatMoney(it.price)}
                  </p>
                  {isDeliveredStatus(selectedOrder.orderStatus) && it.product ? (
                    reviewedProductMap[String(it.product)] ? (
                      <span className="mt-2 inline-block rounded-full border border-[#c8e6c9] bg-[#f0faf1] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#2e7d32]">
                        Reviewed
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openReviewModal(it);
                        }}
                        disabled={reviewStatusLoading || reviewLoading}
                        className="mt-2 rounded border border-[color:var(--brand-ink)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand-ink)] transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {reviewLoading && reviewModal.productId === String(it.product)
                          ? "Submitting..."
                          : "Write a review"}
                      </button>
                    )
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Shipping */}
        <div className="mt-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
            Shipping
          </p>
          <div className="mt-2 rounded-lg border border-black/10 p-4 text-sm text-[#1f1f1f]">
            <p className="text-sm font-semibold">
              {selectedOrder.shippingInfo?.city},{" "}
              {selectedOrder.shippingInfo?.state}
            </p>
            <p className="mt-1 text-sm text-[#6b6b6b]">
              {selectedOrder.shippingInfo?.address}
            </p>
            <p className="mt-1 text-sm text-[#6b6b6b]">
              {selectedOrder.shippingInfo?.country} ·{" "}
              {selectedOrder.shippingInfo?.pinCode}
            </p>
            <p className="mt-1 text-sm text-[#6b6b6b]">
              Phone: {selectedOrder.shippingInfo?.phoneNo}
            </p>
          </div>
        </div>

        {/* Exchange */}
        <div className="mt-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
            Exchange
          </p>
          <div className="mt-2 rounded-lg border border-black/10 p-4 text-sm text-[#1f1f1f]">
            {isExchangeLoading ? (
              <p className="text-sm text-[#6b6b6b]">Checking exchange status...</p>
            ) : exchangeRequest ? (
              <div>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${exchangeStatusBadge(
                    exchangeRequest.status
                  )}`}
                >
                  {exchangeRequest.status || "Pending"}
                </span>
                <p className="mt-2 text-sm text-[#6b6b6b]">
                  Requested on {formatDate(exchangeRequest.createdAt)}
                </p>
                {exchangeRequest.reason ? (
                  <p className="mt-2 text-sm text-[#6b6b6b]">
                    Reason: {exchangeRequest.reason}
                  </p>
                ) : null}
              </div>
            ) : exchangeEligibility.canApply ? (
              <div>
                <p className="text-sm text-[#6b6b6b]">{exchangeEligibility.message}</p>
                <button
                  type="button"
                  onClick={openExchangeModal}
                  className="mt-3 rounded px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:opacity-90"
                  style={{ background: "var(--brand-ink)" }}
                >
                  Apply Exchange
                </button>
              </div>
            ) : (
              <p className="text-sm text-[#6b6b6b]">{exchangeEligibility.message}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ─── Detail skeleton ─── */
  const renderDetailSkeleton = () => (
    <div className="space-y-3 p-5">
      <div className="h-6 w-2/3 rounded bg-black/[0.03]" />
      <div className="h-4 w-1/2 rounded bg-black/[0.03]" />
      <div className="h-24 rounded bg-black/[0.03]" />
      <div className="h-24 rounded bg-black/[0.03]" />
    </div>
  );

  /* Whether to show mobile detail view */
  const showMobileDetail = !!(selectedOrderId && (selectedLoading || selectedOrder));

  return (
    <div className="min-h-[80vh] bg-[#fbf7f0]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-12">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-2 sm:mb-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1
                className="text-3xl font-semibold text-[#1f1f1f] sm:text-4xl"
                style={{ fontFamily: "Cormorant Garamond, serif" }}
              >
                My Account
              </h1>
              <p className="mt-1 text-sm text-[#6b6b6b]">
                Manage your profile details and account security.
              </p>
            </div>
            <Link
              to="/"
              className="hidden rounded px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90 sm:inline-block"
              style={{ background: "var(--brand-ink)" }}
            >
              Continue Shopping
            </Link>
          </div>
          <Link
            to="/"
            className="inline-block w-full rounded px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90 sm:hidden"
            style={{ background: "var(--brand-ink)" }}
          >
            Continue Shopping
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-xl border border-black/5 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 overflow-hidden rounded-full border border-black/10 bg-[#f6f2ea]">
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onAvatarChange}
                  className="hidden"
                 name="file" id="file" aria-label="input field"/>
                <button
                  type="button"
                  onClick={onUploadClick}
                  disabled={avatarUpdating}
                  className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-[#4a4a4a] shadow-sm transition hover:bg-black/[0.03]"
                  aria-label="Upload profile photo"
                  title="Upload profile photo"
                >
                  <FiCamera size={15} className={avatarUpdating ? "animate-pulse" : ""} />
                </button>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1f1f1f]">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-[12px] text-[#9a9a9a]">
                  {user?.email || ""}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onUploadClick}
                    disabled={avatarUpdating}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand)] transition hover:opacity-80 disabled:opacity-50"
                  >
                    <FiCamera size={12} />
                    {avatarUpdating ? "Updating..." : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={onRemoveAvatar}
                    disabled={avatarRemoving || !hasCustomAvatar}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-600 transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FiTrash2 size={12} />
                    {avatarRemoving ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-lg bg-black/[0.03] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6b6b6b]">
                Member
              </p>
              <p className="mt-1 text-sm text-[#1f1f1f]">
                Secure account access
              </p>
            </div>

            <nav className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => setTab("profile")}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
                  activeTab === "profile"
                    ? "bg-black/[0.04] text-[color:var(--brand)]"
                    : "text-[#4a4a4a] hover:bg-black/[0.03] hover:text-[color:var(--brand)]"
                }`}
              >
                <FiUser size={16} />
                Profile
              </button>
              <button
                type="button"
                onClick={() => setTab("orders")}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
                  activeTab === "orders"
                    ? "bg-black/[0.04] text-[color:var(--brand)]"
                    : "text-[#4a4a4a] hover:bg-black/[0.03] hover:text-[color:var(--brand)]"
                }`}
              >
                <FiPackage size={16} />
                Orders
              </button>
            </nav>
          </aside>

          {/* Main */}
          <section className="min-w-0 rounded-xl border border-black/5 bg-white p-4 shadow-sm sm:p-8">
            {activeTab === "orders" ? (
              <div>
                {/* Section heading */}
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-[color:var(--brand)]">
                    <FiPackage size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#1f1f1f]">
                      Your Orders
                    </h2>
                    <p className="text-sm text-[#6b6b6b]">
                      Track your order status and view past purchases.
                    </p>
                  </div>
                </div>

                {/* ═══ Single-column layout (below xl): list OR detail ═══ */}
                <div className="mt-5 xl:hidden">
                  {showMobileDetail ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrderId(null);
                          dispatch(clearSelectedOrder());
                        }}
                        className="mb-3 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold text-[color:var(--brand)] transition hover:bg-black/[0.03]"
                      >
                        <FiArrowLeft size={14} />
                        Back to orders
                      </button>
                      <div className="rounded-lg border border-black/10">
                        {selectedLoading
                          ? renderDetailSkeleton()
                          : selectedOrder
                          ? renderOrderDetail()
                          : (
                            <div className="p-5">
                              <p className="text-sm text-[#6b6b6b]">
                                Unable to load order details.
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  ) : (
                    renderOrderList()
                  )}
                </div>

                {/* ═══ Two-column layout (xl+): side-by-side ═══ */}
                <div className="mt-7 hidden gap-6 xl:grid xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] xl:items-start">
                  <div className="min-w-0">
                    {renderOrderList()}
                  </div>

                  {/* Right panel — details */}
                  <div className="min-w-0 rounded-lg border border-black/10">
                    <div className="border-b border-black/5 px-5 py-4">
                      <p className="text-sm font-semibold text-[#1f1f1f]">
                        Order details
                      </p>
                      {!selectedOrderId && (
                        <p className="mt-0.5 text-xs text-[#9a9a9a]">
                          Choose an order from the list.
                        </p>
                      )}
                    </div>

                    {!selectedOrderId ? (
                      <div className="p-6">
                        <div className="rounded-lg border border-dashed border-black/10 bg-[#fbf7f0] p-6 text-center">
                          <p className="text-sm text-[#6b6b6b]">
                            Pick an order from your history to see items, totals,
                            and shipping details.
                          </p>
                        </div>
                      </div>
                    ) : selectedLoading ? (
                      renderDetailSkeleton()
                    ) : selectedOrder ? (
                      renderOrderDetail()
                    ) : (
                      <div className="p-6">
                        <p className="text-sm text-[#6b6b6b]">
                          Unable to load order details.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Profile */}
                <div>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-[color:var(--brand)]">
                      <FiEdit3 size={18} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[#1f1f1f]">
                        Profile Details
                      </h2>
                      <p className="text-sm text-[#6b6b6b]">
                        Update your name and email address.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleProfileSubmit}
                    className="mt-6 grid gap-4 sm:grid-cols-2"
                  >
                    <div className="sm:col-span-1">
                      <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                        Full name
                      </label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))
                        }
                        className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[color:var(--brand)]"
                        placeholder="Enter your name"
                        required
                       name="enter-your-name" id="enter-your-name" aria-label="Enter your name" />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))
                        }
                        className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[color:var(--brand)]"
                        placeholder="Enter your email"
                        required
                       name="enter-your-email" id="enter-your-email" aria-label="Enter your email" />
                    </div>

                    <div className="sm:col-span-2 mt-1 flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={profileUpdating}
                        className="w-full rounded px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2.5"
                        style={{ background: "var(--brand-ink)" }}
                      >
                        {profileUpdating ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileForm({
                            name: user?.name || "",
                            email: user?.email || "",
                          })
                        }
                        className="w-full rounded border border-black/10 bg-white px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#4a4a4a] transition hover:bg-black/[0.03] sm:w-auto sm:py-2.5"
                      >
                        Reset
                      </button>
                    </div>
                  </form>
                </div>

                {/* Password */}
                <div className="border-t border-black/5 pt-10">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-[color:var(--brand)]">
                      <FiLock size={18} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[#1f1f1f]">
                        Change Password
                      </h2>
                      <p className="text-sm text-[#6b6b6b]">
                        Keep your account secure with a strong password.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handlePasswordSubmit}
                    className="mt-6 grid gap-4 sm:grid-cols-2"
                  >
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                        Current password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.oldPassword}
                        onChange={(e) => setPasswordForm((p) => ({
                            ...p,
                            oldPassword: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[color:var(--brand)]"
                        placeholder="Enter your current password"
                        required
                       name="enter-your-current-password" id="enter-your-current-password" aria-label="Enter your current password" />
                    </div>
                    <div>
                      <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                        New password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm((p) => ({
                            ...p,
                            newPassword: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[color:var(--brand)]"
                        placeholder="Use a strong password"
                        required
                       name="use-a-strong-password" id="use-a-strong-password" aria-label="Use a strong password" />
                    </div>
                    <div>
                      <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                        Confirm new password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm((p) => ({
                            ...p,
                            confirmPassword: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[color:var(--brand)]"
                        placeholder="Re-enter new password"
                        required
                       name="re-enter-new-password" id="re-enter-new-password" aria-label="Re-enter new password" />
                    </div>

                    <div className="sm:col-span-2 mt-1 flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={passwordUpdating}
                        className="w-full rounded px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2.5"
                        style={{ background: "var(--brand-ink)" }}
                      >
                        {passwordUpdating ? "Updating..." : "Update Password"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPasswordForm({
                            oldPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          })
                        }
                        className="w-full rounded border border-black/10 bg-white px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#4a4a4a] transition hover:bg-black/[0.03] sm:w-auto sm:py-2.5"
                      >
                        Clear
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {exchangeModal.open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          onClick={closeExchangeModal}
        >
          <div
            className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="text-2xl font-semibold text-[#1f1f1f]"
              style={{ fontFamily: "Cormorant Garamond, serif" }}
            >
              Apply Exchange
            </h3>
            <p className="mt-1 text-sm text-[#6b6b6b]">
              Share your details and reason. Our admin team will review your request.
            </p>

            <form onSubmit={handleExchangeSubmit} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                    Name
                  </label>
                  <input
                    type="text"
                    value={exchangeForm.name}
                    onChange={(e) => setExchangeForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm text-[#1f1f1f] outline-none transition focus:border-[color:var(--brand)]"
                    placeholder="Enter your name"
                    required
                   name="enter-your-name-2" id="enter-your-name-2" aria-label="Enter your name" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={exchangeForm.email}
                    onChange={(e) => setExchangeForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm text-[#1f1f1f] outline-none transition focus:border-[color:var(--brand)]"
                    placeholder="Enter your email"
                    required
                   name="enter-your-email-2" id="enter-your-email-2" aria-label="Enter your email" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={exchangeForm.mobileNumber}
                    onChange={(e) => setExchangeForm((prev) => ({
                        ...prev,
                        mobileNumber: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm text-[#1f1f1f] outline-none transition focus:border-[color:var(--brand)]"
                    placeholder="10-digit mobile number"
                    required
                   name="10-digit-mobile-number" id="10-digit-mobile-number" aria-label="10-digit mobile number" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                    Address
                  </label>
                  <input
                    type="text"
                    value={exchangeForm.address}
                    onChange={(e) => setExchangeForm((prev) => ({ ...prev, address: e.target.value }))
                    }
                    className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm text-[#1f1f1f] outline-none transition focus:border-[color:var(--brand)]"
                    placeholder="Enter your address"
                    required
                   name="enter-your-address" id="enter-your-address" aria-label="Enter your address" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                  Reason for Exchange
                </label>
                <textarea
                  rows={4}
                  value={exchangeForm.reason}
                  onChange={(e) => setExchangeForm((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  className="w-full resize-y rounded-lg border border-black/10 px-3.5 py-2.5 text-sm text-[#1f1f1f] outline-none transition focus:border-[color:var(--brand)]"
                  placeholder="Please describe why you need an exchange"
                  required
                 name="please-describe-why-you-need-an-exchange" id="please-describe-why-you-need-an-exchange" aria-label="Please describe why you need an exchange" />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeExchangeModal}
                  className="rounded border border-black/15 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#4a4a4a] transition hover:bg-black/[0.03]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={exchangeSubmitting}
                  className="rounded px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: "var(--brand-ink)" }}
                >
                  {exchangeSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {reviewModal.open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          onClick={closeReviewModal}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="text-2xl font-semibold text-[#1f1f1f]"
              style={{ fontFamily: "Cormorant Garamond, serif" }}
            >
              Write a review
            </h3>
            <p className="mt-1 truncate text-sm text-[#6b6b6b]">
              {reviewModal.productName}
            </p>

            <div className="mt-5">
              <p className="text-sm text-[#6b6b6b]">Rating</p>
              <div className="mt-2">
                <InteractiveStarRating
                  rating={reviewRating}
                  setRating={setReviewRating}
                  size={28}
                />
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="mt-4">
              <label className="mb-2 block text-sm text-[#6b6b6b]">
                Review content
              </label>
              <textarea
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Start writing here..."
                className="w-full resize-y rounded-lg border border-black/10 px-4 py-3 text-sm text-[#1f1f1f] outline-none transition focus:border-[color:var(--brand)]"
               name="start-writing-here" id="start-writing-here" aria-label="Start writing here..." />

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="rounded border border-black/15 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#4a4a4a] transition hover:bg-black/[0.03]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="rounded px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: "var(--brand-ink)" }}
                >
                  {reviewLoading ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

