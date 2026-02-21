import React from "react";
import { Link } from "react-router-dom";
import { getProductImage } from "../utils/imageHelper.js";
import StarRating from "./StarRating.jsx";
import "../componentStyles/ProductCard.css";

export default function ProductCard({ product }) {
  const productId = product._id || product.id || "demo";
  const imageUrl = getProductImage(product);
  const rating = Number(product?.ratings || 0);
  const reviewsCount = Number(product?.numOfReviews || 0);

  return (
    <Link to={`/product/${productId}`} className="group block">
      <div className="overflow-hidden rounded-sm bg-white shadow-sm ring-1 ring-black/5 transition group-hover:shadow-md">
        <div className="aspect-[2/3] w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
      </div>

      <div className="mt-3 text-center">
        <div className="productTitle text-sm font-medium tracking-wide text-[#3a3a3a]">
          {product.name}
        </div>
        <div className="mt-1 text-sm font-semibold text-[color:var(--brand)]">
          ₹ {product.price?.toLocaleString("en-IN")}
        </div>
        <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-[#6b6b6b]">
          <StarRating rating={rating} size={12} />
          <span>
            {rating.toFixed(1)} ({reviewsCount.toLocaleString("en-IN")})
          </span>
        </div>
      </div>
    </Link>
  );
}
