import React from "react";
import { useDispatch } from "react-redux";
import { FiMinus, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import { removeFromCart, updateCartQty } from "../features/cart/cartSlice.js";

export default function CartItem({ item }) {
  const dispatch = useDispatch();

  const handleQtyChange = (delta) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    dispatch(
      updateCartQty({
        product: item.product,
        size: item.size,
        color: item.color,
        giftWrap: Boolean(item.giftWrap),
        quantity: newQty,
      })
    );
  };

  const handleRemove = () => {
    dispatch(
      removeFromCart({
        product: item.product,
        size: item.size,
        color: item.color,
        giftWrap: Boolean(item.giftWrap),
      })
    );
    toast.success("Item removed from cart");
  };

  return (
    <div className="flex gap-4 py-4">
      {/* Product image */}
      <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded bg-white">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h4
            className="text-sm font-semibold leading-snug text-[#1f1f1f]"
            style={{ fontFamily: "Cormorant Garamond, serif" }}
          >
            {item.name}
          </h4>
          <p className="mt-0.5 text-sm text-[#6b6b6b]">
            Rs. {item.price?.toLocaleString("en-IN")}
          </p>
          {item.size ? (
            <p className="mt-0.5 text-xs text-[#9a9a9a]">{item.size}</p>
          ) : null}
          {item.color ? (
            <p className="mt-0.5 text-xs text-[#9a9a9a]">Color: {item.color}</p>
          ) : null}
          {item.giftWrap ? (
            <p className="mt-0.5 text-xs text-[#9a9a9a]">Gift wrap selected</p>
          ) : null}
        </div>

        {/* Quantity + Remove */}
        <div className="mt-2 flex items-center gap-3">
          <div className="inline-flex items-center rounded border border-black/15">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center text-[#4a4a4a] transition hover:bg-black/5 disabled:opacity-30"
              onClick={() => handleQtyChange(-1)}
              disabled={item.quantity <= 1}
              aria-label="Decrease"
            >
              <FiMinus size={12} />
            </button>
            <span className="flex h-8 w-8 items-center justify-center text-xs font-semibold text-[#1f1f1f]">
              {item.quantity}
            </span>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center text-[#4a4a4a] transition hover:bg-black/5 disabled:opacity-30"
              onClick={() => handleQtyChange(1)}
              disabled={item.quantity >= (item.stock || 99)}
              aria-label="Increase"
            >
              <FiPlus size={12} />
            </button>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs font-medium text-[#6b6b6b] underline transition hover:text-red-600"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
