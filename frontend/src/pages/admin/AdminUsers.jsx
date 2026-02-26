import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiUsers } from "react-icons/fi";
import toast from "react-hot-toast";
import {
  clearAdminUsersError,
  fetchAdminUsers,
} from "../../features/admin/adminUsersSlice.js";

export default function AdminUsers() {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((s) => s.adminUsers);
  const [q, setQ] = useState("");

  useEffect(() => {
    dispatch(fetchAdminUsers());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearAdminUsersError());
    }
  }, [error, dispatch]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return users;
    return users.filter((u) => {
      const hay = `${u.name || ""} ${u.email || ""} ${u.role || ""}`.toLowerCase();
      return hay.includes(query);
    });
  }, [users, q]);

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

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-[color:var(--brand)]">
          <FiUsers size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1f1f1f]">Users</h2>
          <p className="text-sm text-[#6b6b6b]">
            View all registered users.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email, role…"
          className="w-full max-w-md rounded-lg border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--brand)]"
         name="search-by-name-email-role" id="search-by-name-email-role" aria-label="Search by name, email, role…" />
        <div className="text-sm text-[#6b6b6b]">
          {loading ? "Loading…" : `${filtered.length} users`}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-black/10">
        <div className="grid min-w-[700px] grid-cols-[1.2fr_1.4fr_0.8fr_0.8fr] gap-4 bg-black/[0.03] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
          <div>Name</div>
          <div>Email</div>
          <div>Role</div>
          <div>Created</div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-md bg-black/[0.03]" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="divide-y divide-black/5">
            {filtered.map((u) => (
              <div
                key={u._id}
                className="grid min-w-[700px] grid-cols-[1.2fr_1.4fr_0.8fr_0.8fr] items-center gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1f1f1f]">
                    {u.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#6b6b6b]">
                    ID: {String(u._id).slice(-10)}
                  </p>
                </div>
                <div className="min-w-0 truncate text-sm text-[#1f1f1f]">
                  {u.email}
                </div>
                <div className="text-sm text-[#1f1f1f]">{u.role || "user"}</div>
                <div className="text-sm text-[#1f1f1f]">
                  {formatDate(u.createdAt)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-[#6b6b6b]">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

