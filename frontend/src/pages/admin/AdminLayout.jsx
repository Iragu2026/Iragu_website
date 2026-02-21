import React from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { FiBox, FiHome, FiPackage, FiRefreshCw, FiUsers } from "react-icons/fi";
import usePageTitle from "../../hooks/usePageTitle.js";

const navLinkBase =
  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition";

export default function AdminLayout() {
  usePageTitle("Admin");

  return (
    <div className="min-h-dvh bg-[#fbf7f0]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1
              className="text-3xl font-semibold text-[#1f1f1f] sm:text-4xl"
              style={{ fontFamily: "Cormorant Garamond, serif" }}
            >
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-[#6b6b6b]">
              Manage products, users, and orders.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90"
            style={{ background: "var(--brand-ink)" }}
          >
            <FiHome size={14} />
            Store
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
            <div className="px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a9a9a]">
                Manage
              </p>
            </div>

            <nav className="space-y-2">
              <div className="rounded-lg border border-black/5 p-2">
                <div className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9a9a]">
                  Products
                </div>
                <NavLink
                  to="/admin/products/sarees"
                  className={({ isActive }) => `${navLinkBase} ${
                      isActive
                        ? "bg-black/[0.04] text-[color:var(--brand)]"
                        : "text-[#4a4a4a] hover:bg-black/[0.03] hover:text-[color:var(--brand)]"
                    }`
                  }
                >
                  <FiBox size={16} />
                  Sarees
                </NavLink>
                <NavLink
                  to="/admin/products/salwars"
                  className={({ isActive }) => `${navLinkBase} ${
                      isActive
                        ? "bg-black/[0.04] text-[color:var(--brand)]"
                        : "text-[#4a4a4a] hover:bg-black/[0.03] hover:text-[color:var(--brand)]"
                    }`
                  }
                >
                  <FiBox size={16} />
                  Salwars
                </NavLink>
              </div>

              <NavLink
                to="/admin/users"
                className={({ isActive }) => `${navLinkBase} ${
                    isActive
                      ? "bg-black/[0.04] text-[color:var(--brand)]"
                      : "text-[#4a4a4a] hover:bg-black/[0.03] hover:text-[color:var(--brand)]"
                  }`
                }
              >
                <FiUsers size={16} />
                Users
              </NavLink>

              <NavLink
                to="/admin/orders"
                className={({ isActive }) => `${navLinkBase} ${
                    isActive
                      ? "bg-black/[0.04] text-[color:var(--brand)]"
                      : "text-[#4a4a4a] hover:bg-black/[0.03] hover:text-[color:var(--brand)]"
                  }`
                }
              >
                <FiPackage size={16} />
                Orders
              </NavLink>

              <NavLink
                to="/admin/exchanges"
                className={({ isActive }) => `${navLinkBase} ${
                    isActive
                      ? "bg-black/[0.04] text-[color:var(--brand)]"
                      : "text-[#4a4a4a] hover:bg-black/[0.03] hover:text-[color:var(--brand)]"
                  }`
                }
              >
                <FiRefreshCw size={16} />
                Exchanges
              </NavLink>
            </nav>
          </aside>

          <main className="min-w-0 rounded-xl border border-black/5 bg-white p-5 shadow-sm sm:p-7">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

