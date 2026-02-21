import React from "react";

/**
 * Full-section spinner.
 * Use inside a page or section to indicate data is loading.
 */
export default function Loader({ className = "" }) {
  return (
    <div
      className={`flex min-h-[40vh] items-center justify-center ${className}`}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-[3px] border-black/10"
          style={{ borderTopColor: "var(--brand)" }}
        />
        <span className="text-xs tracking-widest text-[#9a9a9a] uppercase">
          Loading…
        </span>
      </div>
    </div>
  );
}
