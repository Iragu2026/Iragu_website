import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";

import CartItem from "./CartItem.jsx";
import {
  closeCartDrawer,
  setOrderNote,
  setGiftWrap,
} from "../features/cart/cartSlice.js";

export default function CartDrawer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems, isDrawerOpen, orderNote, giftWrap } = useSelector(
    (s) => s.cart
  );
  const { isAuthenticated } = useSelector((s) => s.user);
  const [noteOpen, setNoteOpen] = useState(false);

  const GIFT_WRAP_FLAT = 50;
  const subtotal = cartItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );
  const hasGiftWrap = Boolean(giftWrap) || cartItems.some((i) => Boolean(i.giftWrap));
  const checkoutTotal = subtotal + (hasGiftWrap ? GIFT_WRAP_FLAT : 0);

  const handleClose = () => dispatch(closeCartDrawer());

  const handleCheckout = () => {
    handleClose();
    if (!isAuthenticated) {
      navigate("/login?redirect=checkout");
    } else {
      navigate("/checkout");
    }
  };

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={handleClose}
      />

      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#fbf7f0] shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <h2
            className="text-lg font-semibold tracking-wide text-[#1f1f1f]"
            style={{ fontFamily: "Cormorant Garamond, serif" }}
          >
            Cart
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1.5 text-[#4a4a4a] transition hover:bg-black/5"
            aria-label="Close cart"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p
                className="text-base text-[#6b6b6b]"
                style={{ fontFamily: "Cormorant Garamond, serif" }}
              >
                Your cart is empty
              </p>
            </div>
          ) : (
            <div>
              <div className="border-b border-black/10 px-5 py-3">
                <p className="text-xs leading-relaxed text-[#6b6b6b]">
                  Flat Rs. 100 shipping for all Domestic Orders.
                </p>
              </div>

              <div className="divide-y divide-black/5 px-5">
                {cartItems.map((item, i) => (
                  <CartItem
                    key={`${item.product}_${item.size || ""}_${item.color || ""}_${i}`}
                    item={item}
                  />
                ))}
              </div>

              <div className="border-t border-black/10 px-5 py-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-sm font-medium"
                  style={{ color: "var(--brand)" }}
                  onClick={() => setNoteOpen((v) => !v)}
                >
                  <span>Add order note</span>
                  {noteOpen ? (
                    <FiChevronUp size={16} />
                  ) : (
                    <FiChevronDown size={16} />
                  )}
                </button>
                {noteOpen ? (
                  <textarea
                    rows={3}
                    value={orderNote}
                    onChange={(e) => dispatch(setOrderNote(e.target.value))}
                    placeholder="Special instructions for your order..."
                    className="mt-2 w-full resize-none rounded border border-black/15 bg-white px-3 py-2 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
                   name="special-instructions-for-your-order" id="special-instructions-for-your-order" aria-label="Special instructions for your order..." />
                ) : null}
              </div>

              <div className="px-5 py-2">
                <p className="text-xs leading-relaxed text-[#6b6b6b]">
                  Flat Rs. 100 shipping for all Domestic Orders.
                </p>
              </div>

              <div className="px-5 py-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#3a3a3a]">
                  <input
                    type="checkbox"
                    checked={giftWrap}
                    onChange={(e) => dispatch(setGiftWrap(e.target.checked))}
                    className="h-4 w-4 rounded border-black/20 accent-[color:var(--brand)]"
                   name="checkbox" id="checkbox" aria-label="input field" />
                  <span>Gift Wrap</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {cartItems.length > 0 ? (
          <div className="border-t border-black/10 px-5 py-4">
            <button
              type="button"
              onClick={handleCheckout}
              className="w-full rounded py-3.5 text-xs font-bold uppercase tracking-[0.25em] text-white transition hover:opacity-90"
              style={{ background: "var(--brand-ink)" }}
            >
              Checkouts Rs. {checkoutTotal.toLocaleString("en-IN")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
