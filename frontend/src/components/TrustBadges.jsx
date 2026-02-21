import React from "react";
import { FiCheckCircle, FiRefreshCw, FiTruck } from "react-icons/fi";

export default function TrustBadges() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[#3a3a3a]">
        <span className="flex items-center gap-1.5">
          <FiCheckCircle size={14} className="text-[#4a4a4a]" />
          Authentic & Quality Assured
        </span>
        <span className="flex items-center gap-1.5">
          <FiRefreshCw size={14} className="text-[#4a4a4a]" />
          Hassle Free Exchanges
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-[13px] text-[#3a3a3a]">
        <FiTruck size={14} className="text-[#4a4a4a]" />
        Flat Rs. 100 shipping for all Domestic Orders
      </div>
    </div>
  );
}
