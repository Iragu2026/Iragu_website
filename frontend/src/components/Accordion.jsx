import React, { useState } from "react";
import { FiPlus, FiMinus } from "react-icons/fi";

export default function Accordion({ icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-black/10">
      <button
        type="button"
        className="flex w-full items-center justify-between py-4 text-left transition hover:opacity-80"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          {icon ? <span className="text-[#4a4a4a]">{icon}</span> : null}
          <span className="text-sm font-bold text-[#1f1f1f]">{title}</span>
        </div>
        {open ? (
          <FiMinus size={16} className="text-[#4a4a4a]" />
        ) : (
          <FiPlus size={16} className="text-[#4a4a4a]" />
        )}
      </button>
      {open ? (
        <div className="pb-4 text-sm leading-relaxed text-[#6b6b6b]">
          {children}
        </div>
      ) : null}
    </div>
  );
}
