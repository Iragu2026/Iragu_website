import React from "react";

export default function SizeSelector({ sizes = [], selected, onSelect }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1f1f1f]">Size:</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {sizes.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSelect(s)}
            className={[
              "flex h-10 min-w-[44px] items-center justify-center rounded border px-3 text-xs font-semibold tracking-wide transition",
              selected === s
                ? "border-[color:var(--brand-ink)] bg-[color:var(--brand-ink)] text-white"
                : "border-black/15 text-[#4a4a4a] hover:border-[color:var(--brand)]",
            ].join(" ")}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
