import React from "react";
import { Link } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle.js";

export default function AdminDashboard() {
  usePageTitle("Admin Dashboard");

  return (
    <div className="min-h-[70vh] bg-[#fbf7f0]">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-20">
        <div className="rounded-lg border border-black/5 bg-white px-8 py-14 text-center shadow-sm sm:px-16">
          <h1
            className="text-3xl font-semibold text-[#1f1f1f]"
            style={{ fontFamily: "Cormorant Garamond, serif" }}
          >
            Admin Dashboard
          </h1>
          <div className="mx-auto mt-4 mb-6 h-px w-12 bg-[color:var(--brand)]" />
          <p className="text-sm text-[#6b6b6b]">
            This page is under construction. Admin features like product
            management, order management, and user management will be added here
            soon.
          </p>
          <Link
            to="/"
            className="mt-8 inline-block rounded px-7 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:opacity-90"
            style={{ background: "var(--brand-ink)" }}
          >
            Go to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
