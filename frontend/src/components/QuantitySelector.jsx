import React from "react";
import { FiMinus, FiPlus } from "react-icons/fi";

export default function QuantitySelector({ qty, setQty, max = 99 }) {
  return (
    <div className="inline-flex items-center rounded-md border border-black/15">
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center text-[#4a4a4a] transition hover:bg-black/5 disabled:opacity-30"
        onClick={() => setQty((q) => Math.max(1, q - 1))}
        disabled={qty <= 1}
        aria-label="Decrease quantity"
      >
        <FiMinus size={14} />
      </button>
      <span className="flex h-10 w-10 items-center justify-center text-sm font-semibold text-[#1f1f1f]">
        {qty}
      </span>
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center text-[#4a4a4a] transition hover:bg-black/5 disabled:opacity-30"
        onClick={() => setQty((q) => Math.min(max, q + 1))}
        disabled={qty >= max}
        aria-label="Increase quantity"
      >
        <FiPlus size={14} />
      </button>
    </div>
  );
}
