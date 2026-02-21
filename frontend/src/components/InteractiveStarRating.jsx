import React, { useState } from "react";
import { FiStar } from "react-icons/fi";

export default function InteractiveStarRating({ rating, setRating, size = 28 }) {
  const [hovered, setHovered] = useState(0);

  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          className="transition-transform hover:scale-110 focus:outline-none"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => setRating(i)}
          aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
        >
          <FiStar
            size={size}
            className={
              i <= (hovered || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        </button>
      ))}
    </span>
  );
}
