import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiRefreshCw, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import {
  clearAdminExchangesError,
  fetchAdminExchanges,
  updateAdminExchangeStatus,
} from "../../features/admin/adminExchangesSlice.js";

const EXCHANGE_STATUS_OPTIONS = ["Pending", "Exchange Accepted", "Exchange Rejected"];

export default function AdminExchanges() {
  const dispatch = useDispatch();
  const { exchangeRequests, loading, updating, error } = useSelector(
    (s) => s.adminExchanges
  );
  const [q, setQ] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminExchanges());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearAdminExchangesError());
    }
  }, [error, dispatch]);

  const formatDate = (value) => {
    try {
      return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const filteredRequests = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return exchangeRequests;
    return exchangeRequests.filter((request) => {
      const haystack = [
        request?._id,
        request?.order?._id,
        request?.name,
        request?.email,
        request?.mobileNumber,
        request?.reason,
        request?.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [exchangeRequests, q]);

  const onStatusChange = async (requestId, nextStatus) => {
    try {
      await dispatch(
        updateAdminExchangeStatus({ id: requestId, status: nextStatus })
      ).unwrap();
      toast.success("Exchange status updated");
    } catch (updateError) {
      toast.error(updateError || "Failed to update exchange status");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-[color:var(--brand)]">
          <FiRefreshCw size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1f1f1f]">Exchanges</h2>
          <p className="text-sm text-[#6b6b6b]">
            Review customer exchange requests and accept or reject them.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by customer, order id, status..."
          className="w-full max-w-md rounded-lg border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--brand)]"
         name="search-by-customer-order-id-status" id="search-by-customer-order-id-status" aria-label="Search by customer, order id, status..." />
        <div className="text-sm text-[#6b6b6b]">
          {loading ? "Loading..." : `${filteredRequests.length} requests`}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-black/10">
        <div className="grid min-w-[900px] grid-cols-[1fr_1.1fr_0.8fr_1.6fr_1fr_0.9fr_100px] gap-4 bg-black/[0.03] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
          <div>Request</div>
          <div>Customer</div>
          <div>Mobile</div>
          <div>Reason</div>
          <div>Status</div>
          <div>Requested</div>
          <div className="text-right">View</div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-md bg-black/[0.03]" />
            ))}
          </div>
        ) : filteredRequests.length ? (
          <div className="divide-y divide-black/5">
            {filteredRequests.map((request) => (
              <div
                key={request._id}
                className="grid min-w-[900px] grid-cols-[1fr_1.1fr_0.8fr_1.6fr_1fr_0.9fr_100px] items-center gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1f1f1f]">
                    #{String(request._id).slice(-8).toUpperCase()}
                  </p>
                  <p className="truncate text-xs text-[#6b6b6b]">
                    Order #{String(request?.order?._id || "").slice(-8).toUpperCase() || "-"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1f1f1f]">
                    {request.name || "-"}
                  </p>
                  <p className="truncate text-xs text-[#6b6b6b]">{request.email || "-"}</p>
                </div>
                <div className="text-sm text-[#1f1f1f]">{request.mobileNumber || "-"}</div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm text-[#1f1f1f]">{request.reason || "-"}</p>
                </div>
                <div>
                  <select
                    value={request.status || "Pending"}
                    onChange={(e) => onStatusChange(request._id, e.target.value)}
                    className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-[color:var(--brand)]"
                    disabled={updating}
                   name="select-field" id="select-field" aria-label="select field">
                    {EXCHANGE_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-sm text-[#1f1f1f]">{formatDate(request.createdAt)}</div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(request)}
                    className="rounded border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#4a4a4a] transition hover:bg-black/[0.03]"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-[#6b6b6b]">No exchange requests found.</p>
          </div>
        )}
      </div>

      {selectedRequest ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setSelectedRequest(null)}
          />
          <div className="relative z-[81] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-[#1f1f1f]">
                  Exchange Request #{String(selectedRequest._id).slice(-8).toUpperCase()}
                </p>
                <p className="mt-0.5 text-xs text-[#9a9a9a]">
                  Order #{String(selectedRequest?.order?._id || "").slice(-8).toUpperCase() || "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="rounded-md p-2 text-[#6b6b6b] hover:bg-black/[0.03]"
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="max-h-[75vh] space-y-4 overflow-y-auto p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
                    Customer
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#1f1f1f]">
                    {selectedRequest.name || "-"}
                  </p>
                  <p className="mt-1 text-sm text-[#6b6b6b]">{selectedRequest.email || "-"}</p>
                  <p className="mt-1 text-sm text-[#6b6b6b]">{selectedRequest.mobileNumber || "-"}</p>
                </div>
                <div className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
                    Request
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#1f1f1f]">
                    {selectedRequest.status || "Pending"}
                  </p>
                  <p className="mt-1 text-sm text-[#6b6b6b]">
                    Submitted: {formatDate(selectedRequest.createdAt)}
                  </p>
                  <p className="mt-1 text-sm text-[#6b6b6b]">
                    Decision: {selectedRequest.decisionAt ? formatDate(selectedRequest.decisionAt) : "-"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-black/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
                  Address
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#1f1f1f]">
                  {selectedRequest.address || "-"}
                </p>
              </div>

              <div className="rounded-lg border border-black/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
                  Reason for exchange
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#1f1f1f]">
                  {selectedRequest.reason || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
