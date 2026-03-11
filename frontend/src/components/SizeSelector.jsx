import React from "react";

export default function SizeSelector({
  sizes = [],
  selected,
  onSelect,
  piecesBySize = {},
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1f1f1f]">Size:</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {sizes.map((s) => {
          const pieces = Number(piecesBySize?.[s]);
          const hasPieceCount = Number.isFinite(pieces);
          const isOutOfStock = hasPieceCount && pieces <= 0;

          return (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(s)}
              disabled={isOutOfStock}
              className={[
                "relative flex min-w-[64px] items-center justify-center overflow-hidden rounded border px-3 py-2.5 text-xs font-semibold tracking-wide transition",
                isOutOfStock
                  ? "cursor-not-allowed border-black/10 text-black/25"
                  : selected === s
                  ? "border-[color:var(--brand-ink)] bg-[color:var(--brand-ink)] text-white"
                  : "border-black/15 text-[#4a4a4a] hover:border-[color:var(--brand)]",
              ].join(" ")}
            >
              <span>{s}</span>
              {isOutOfStock && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  <span className="block h-[1.5px] w-[140%] -rotate-[25deg] bg-black/30" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
