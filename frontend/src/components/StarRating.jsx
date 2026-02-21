import React from "react";
import { FiStar } from "react-icons/fi";

export default function StarRating({ rating = 0, size = 14 }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <FiStar
        key={i}
        size={size}
        className={i <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
      />
    );
  }
  return <span className="inline-flex items-center gap-0.5">{stars}</span>;
}
