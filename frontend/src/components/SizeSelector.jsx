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
          const isDisabled = hasPieceCount && pieces <= 0;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(s)}
              disabled={isDisabled}
              className={[
                "flex min-w-[64px] flex-col items-center justify-center rounded border px-3 py-2 text-xs font-semibold tracking-wide transition",
                isDisabled
                  ? "cursor-not-allowed border-black/10 text-black/25"
                  : selected === s
                  ? "border-[color:var(--brand-ink)] bg-[color:var(--brand-ink)] text-white"
                  : "border-black/15 text-[#4a4a4a] hover:border-[color:var(--brand)]",
              ].join(" ")}
            >
              <span>{s}</span>
              {hasPieceCount ? (
                <span className="mt-0.5 text-[10px] font-medium opacity-85">
                  {pieces} left
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
