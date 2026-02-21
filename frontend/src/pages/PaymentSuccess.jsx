import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import usePageTitle from "../hooks/usePageTitle.js";
import axiosInstance from "../utils/axiosInstance.js";

export default function PaymentSuccess() {
  usePageTitle("Order Confirmed");
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order && Boolean(orderId));
  const [secondsLeft, setSecondsLeft] = useState(3);

  useEffect(() => {
    if (!orderId) {
      navigate("/account?tab=orders", { replace: true });
      return;
    }

    const redirectTimer = setTimeout(() => {
      navigate("/account?tab=orders", { replace: true });
    }, 3000);

    const countdown = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);

    return () => {
      clearTimeout(redirectTimer);
      clearInterval(countdown);
    };
  }, [orderId, navigate]);

  useEffect(() => {
    if (order || !orderId) return;

    let mounted = true;
    const loadOrder = async () => {
      try {
        const { data } = await axiosInstance.get(`/api/v1/order/${orderId}`);
        if (mounted) setOrder(data?.order || null);
      } catch {
        // If this fetch fails, user can still see order from account page after redirect.
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadOrder();
    return () => {
      mounted = false;
    };
  }, [order, orderId]);

  const totalItems = useMemo(() => {
    if (!Array.isArray(order?.orderItems)) return 0;
    return order.orderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [order]);

  const money = (value) => Number(value || 0).toLocaleString("en-IN");

  return (
    <div className="min-h-screen bg-[#fbf7f0] px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-black/10 bg-white p-6 shadow-sm sm:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0faf1] text-[#2e7d32]">
            <FiCheckCircle size={34} />
          </div>
          <h1
            className="mt-4 text-3xl font-semibold text-[#1f1f1f] sm:text-4xl"
            style={{ fontFamily: "Cormorant Garamond, serif" }}
          >
            Order Confirmed
          </h1>
          <p className="mt-2 text-sm text-[#6b6b6b]">
            Payment was successful. Redirecting to your orders in {secondsLeft}s.
          </p>
        </div>

        <div className="mt-8 rounded-lg border border-black/10 bg-[#fbf7f0] p-4 sm:p-5">
          {loading ? (
            <p className="text-sm text-[#6b6b6b]">Loading order details...</p>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6b6b6b]">Order ID</span>
                <span className="font-semibold text-[#1f1f1f]">
                  #{String(order?._id || orderId || "").slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-[#6b6b6b]">Payment status</span>
                <span className="font-semibold text-[#2e7d32]">
                  {String(order?.paymentInfo?.status || "paid").toUpperCase()}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-[#6b6b6b]">Items</span>
                <span className="font-semibold text-[#1f1f1f]">{totalItems}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-[#6b6b6b]">Total paid</span>
                <span className="font-semibold text-[#1f1f1f]">
                  Rs. {money(order?.totalPrice)}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/account?tab=orders"
            className="rounded px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90"
            style={{ background: "var(--brand-ink)" }}
          >
            View My Orders
          </Link>
          <Link
            to="/"
            className="rounded border border-black/10 bg-white px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#4a4a4a] transition hover:bg-black/[0.03]"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
