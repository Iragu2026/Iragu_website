import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiPackage, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import {
  clearAdminOrdersError,
  fetchAdminOrders,
  updateAdminOrderStatus,
} from "../../features/admin/adminOrdersSlice.js";

const STATUS_OPTIONS = ["Processing", "Shipped", "Delivered", "Cancelled"];

export default function AdminOrders() {
  const dispatch = useDispatch();
  const { orders, totalAmount, loading, error, updating } = useSelector(
    (s) => s.adminOrders
  );
  const [q, setQ] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminOrders());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearAdminOrdersError());
    }
  }, [error, dispatch]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((o) => {
      const u = o.user || {};
      const hay = `${o._id || ""} ${o.orderStatus || ""} ${o.paymentInfo?.status || ""} ${u.name || ""} ${u.email || ""}`.toLowerCase();
      return hay.includes(query);
    });
  }, [orders, q]);

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const money = (n) => Number(n || 0).toLocaleString("en-IN");

  const openDetails = (order) => {
    setSelected(order);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelected(null);
  };

  const formatAddress = (info) => {
    if (!info) return "-";
    const parts = [
      info.firstName || "",
      info.lastName || "",
      info.gst ? `(GST: ${info.gst})` : "",
    ]
      .filter(Boolean)
      .join(" ");
    const line1 = [info.address, info.apartment].filter(Boolean).join(", ");
    const line2 = [info.city, info.state, info.pinCode].filter(Boolean).join(", ");
    const line3 = [info.country].filter(Boolean).join(", ");
    return { parts, line1, line2, line3, phone: info.phoneNo };
  };

  const onStatusChange = async (orderId, nextStatus) => {
    try {
      await dispatch(updateAdminOrderStatus({ id: orderId, orderStatus: nextStatus })).unwrap();
      toast.success("Order status updated");
    } catch (err) {
      toast.error(err || "Failed to update status");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-[color:var(--brand)]">
          <FiPackage size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1f1f1f]">Orders</h2>
          <p className="text-sm text-[#6b6b6b]">
            View all orders, payment status, and update fulfillment status.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
            Total orders
          </p>
          <p className="mt-1 text-xl font-semibold text-[#1f1f1f]">
            {orders?.length || 0}
          </p>
        </div>
        <div className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
            Total amount
          </p>
          <p className="mt-1 text-xl font-semibold text-[#1f1f1f]">
            Rs. {money(totalAmount)}
          </p>
        </div>
        <div className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
            Updating
          </p>
          <p className="mt-1 text-xl font-semibold text-[#1f1f1f]">
            {updating ? "Yes" : "No"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by order id, user, status..."
          className="w-full max-w-md rounded-lg border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--brand)]"
         name="search-by-order-id-user-status" id="search-by-order-id-user-status" aria-label="Search by order id, user, status..." />
        <div className="text-sm text-[#6b6b6b]">
          {loading ? "Loading..." : `${filtered.length} orders`}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-black/10">
        <div className="grid min-w-[920px] grid-cols-[1fr_1.2fr_0.7fr_0.9fr_0.9fr_0.9fr_120px] gap-4 bg-black/[0.03] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
          <div>Order</div>
          <div>User</div>
          <div className="text-right">Total</div>
          <div>Payment</div>
          <div>Status</div>
          <div>Placed</div>
          <div className="text-right">Details</div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-md bg-black/[0.03]" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="divide-y divide-black/5">
            {filtered.map((o) => (
              <div
                key={o._id}
                className="grid min-w-[920px] grid-cols-[1fr_1.2fr_0.7fr_0.9fr_0.9fr_0.9fr_120px] items-center gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1f1f1f]">
                    #{String(o._id).slice(-8).toUpperCase()}
                  </p>
                  <p className="mt-0.5 text-xs text-[#6b6b6b]">
                    {o.orderItems?.length || 0} item(s)
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1f1f1f]">
                    {o.user?.name || "-"}
                  </p>
                  <p className="truncate text-xs text-[#6b6b6b]">
                    {o.user?.email || "-"}
                  </p>
                </div>
                <div className="text-right text-sm font-semibold text-[#1f1f1f]">
                  Rs. {money(o.totalPrice)}
                </div>
                <div className="text-sm text-[#1f1f1f]">
                  {o.paymentInfo?.status || "processing"}
                </div>
                <div>
                  <select
                    value={o.orderStatus || "Processing"}
                    onChange={(e) => onStatusChange(o._id, e.target.value)}
                    className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-[color:var(--brand)]"
                    disabled={updating}
                   name="select-field" id="select-field" aria-label="select field">
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-sm text-[#1f1f1f]">
                  {formatDate(o.createdAt)}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => openDetails(o)}
                    className="rounded border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#4a4a4a] transition hover:bg-black/[0.03]"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-[#6b6b6b]">No orders found.</p>
          </div>
        )}
      </div>

      {/* Order details modal */}
      {detailsOpen && selected ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45" onClick={closeDetails} />
          <div className="relative z-[81] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-[#1f1f1f]">
                  Order #{String(selected._id).slice(-8).toUpperCase()}
                </p>
                <p className="mt-0.5 text-xs text-[#9a9a9a]">
                  Placed on {formatDate(selected.createdAt)}  · Status:{" "}
                  {selected.orderStatus || "Processing"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="rounded-md p-2 text-[#6b6b6b] hover:bg-black/[0.03]"
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="max-h-[78vh] overflow-y-auto p-6">
              {/* Customer */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
                    Customer
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#1f1f1f]">
                    {selected.user?.name || "-"}
                  </p>
                  <p className="mt-1 text-sm text-[#6b6b6b]">
                    {selected.user?.email || "-"}
                  </p>
                </div>
                <div className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
                    Payment
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#1f1f1f]">
                    {selected.paymentInfo?.status || "processing"}
                  </p>
                  <p className="mt-1 text-xs text-[#6b6b6b]">
                    ID: {selected.paymentInfo?.id || "-"}
                  </p>
                </div>
                <div className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
                    Total
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#1f1f1f]">
                    Rs. {money(selected.totalPrice)}
                  </p>
                  <p className="mt-1 text-xs text-[#6b6b6b]">
                    Items: {selected.orderItems?.length || 0}
                  </p>
                </div>
              </div>

              {/* Addresses */}
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {(() => {
                  const ship = formatAddress(selected.shippingInfo);
                  const bill =
                    selected.billingType === "different"
                      ? formatAddress(selected.billingInfo)
                      : ship;
                  return (
                    <>
                      <div className="rounded-lg border border-black/10 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
                          Shipping address
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#1f1f1f]">
                          {ship.parts || "-"}
                        </p>
                        <p className="mt-1 text-sm text-[#6b6b6b]">{ship.line1 || "-"}</p>
                        <p className="mt-1 text-sm text-[#6b6b6b]">{ship.line2 || "-"}</p>
                        <p className="mt-1 text-sm text-[#6b6b6b]">{ship.line3 || "-"}</p>
                        <p className="mt-2 text-sm text-[#6b6b6b]">
                          Phone: {ship.phone || "-"}
                        </p>
                      </div>

                      <div className="rounded-lg border border-black/10 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
                              Billing address
                            </p>
                            <p className="mt-1 text-xs text-[#9a9a9a]">
                              {selected.billingType === "different"
                                ? "Different billing address"
                                : "Same as shipping"}
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-[#1f1f1f]">
                          {bill.parts || "-"}
                        </p>
                        <p className="mt-1 text-sm text-[#6b6b6b]">{bill.line1 || "-"}</p>
                        <p className="mt-1 text-sm text-[#6b6b6b]">{bill.line2 || "-"}</p>
                        <p className="mt-1 text-sm text-[#6b6b6b]">{bill.line3 || "-"}</p>
                        <p className="mt-2 text-sm text-[#6b6b6b]">
                          Phone: {bill.phone || "-"}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Items */}
              <div className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
                  Items
                </p>
                <div className="mt-2 divide-y divide-black/5 rounded-lg border border-black/10">
                  {(selected.orderItems || []).map((it, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4">
                      <div className="h-14 w-14 overflow-hidden rounded-md border border-black/10 bg-[#fbf7f0]">
                        <img
                          src={it.image || "/images/new_arrival1.png"}
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
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#1f1f1f]">
                          Rs. {money(it.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="mt-6 grid gap-3 rounded-lg border border-black/10 bg-black/[0.02] p-4 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
                    Items
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">
                    Rs. {money(selected.itemsPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
                    Shipping
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">
                    Rs. {money(selected.shippingPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
                    Total
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">
                    Rs. {money(selected.totalPrice)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}





