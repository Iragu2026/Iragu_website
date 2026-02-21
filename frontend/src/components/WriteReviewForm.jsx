import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiUpload } from "react-icons/fi";
import toast from "react-hot-toast";
import InteractiveStarRating from "./InteractiveStarRating.jsx";
import { submitReview, clearReviewState } from "../features/products/productDetailSlice.js";

export default function WriteReviewForm({ productId, onCancel }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { reviewLoading, reviewSuccess, reviewError } = useSelector(
    (s) => s.productDetail
  );
  const { isAuthenticated } = useSelector((s) => s.user);

  const [starRating, setStarRating] = useState(0);
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : "");
  };

  // Close form when review submitted successfully
  useEffect(() => {
    if (reviewSuccess) {
      toast.success("Review submitted successfully!");
      onCancel?.();
      dispatch(clearReviewState());
    }
  }, [reviewSuccess, dispatch, onCancel]);

  // Show toast on review API error
  useEffect(() => {
    if (reviewError) {
      toast.error(reviewError);
    }
  }, [reviewError]);

  // Clean up review state on unmount
  useEffect(() => {
    return () => dispatch(clearReviewState());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!starRating) {
      toast.error("Please select a rating");
      return;
    }
    if (!content.trim()) {
      toast.error("Please write a review");
      return;
    }

    if (!isAuthenticated) {
      toast.error("Please login to submit a review.");
      const params = new URLSearchParams(location.search);
      params.set("review", "1");
      const returnTo = `${location.pathname}?${params.toString()}`;
      navigate(`/login?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }

    if (!productId) {
      toast.error("Missing product information. Please refresh and try again.");
      return;
    }

    dispatch(
      submitReview({
        rating: starRating,
        comment: content.trim(),
        productId,
      })
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-8 max-w-xl border-t border-black/10 pt-8"
    >
      <h3
        className="text-center text-xl font-semibold italic"
        style={{
          fontFamily: "Cormorant Garamond, serif",
          color: "var(--brand-ink)",
        }}
      >
        Write a review
      </h3>

      {/* API error */}
      {reviewError ? (
        <p className="mt-3 text-center text-sm text-red-600">{reviewError}</p>
      ) : null}

      {/* Rating */}
      <div className="mt-6 text-center">
        <p className="text-sm text-[#6b6b6b]">Rating</p>
        <div className="mt-2 flex justify-center">
          <InteractiveStarRating
            rating={starRating}
            setRating={setStarRating}
            size={26}
          />
        </div>
      </div>

      {/* Review Content */}
      <div className="mt-5">
        <p className="text-center text-sm text-[#6b6b6b]">Review content</p>
        <textarea
          rows={4}
          placeholder="Start writing here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-2 w-full resize-y rounded border border-black/15 bg-white px-4 py-2.5 text-sm text-[#1f1f1f] placeholder-[#9a9a9a] outline-none transition focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)]"
         name="start-writing-here" id="start-writing-here" aria-label="Start writing here..." />
      </div>

      {/* Picture/Video upload */}
      <div className="mt-5 text-center">
        <p className="text-sm text-[#6b6b6b]">Picture/Video (optional)</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mx-auto mt-2 flex h-24 w-24 flex-col items-center justify-center rounded border-2 border-dashed border-black/15 text-[#9a9a9a] transition hover:border-[color:var(--brand)] hover:text-[color:var(--brand)]"
        >
          <FiUpload size={28} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileChange}
         name="file" id="file" aria-label="input field"/>
        {fileName ? (
          <p className="mt-1 text-xs text-[#6b6b6b]">{fileName}</p>
        ) : null}
      </div>

      {/* Privacy note */}
      <p className="mt-4 text-center text-xs leading-relaxed text-[#9a9a9a]">
        How we use your data: We'll only contact you about the review you left,
        and only if necessary.
        <br />
        By submitting your review, you agree to our terms, privacy and content
        policies.
      </p>

      {/* Buttons */}
      <div className="mt-6 flex items-center justify-center gap-4 pb-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-[color:var(--brand-ink)] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-ink)] transition hover:bg-black/5"
        >
          Cancel review
        </button>
        <button
          type="submit"
          disabled={reviewLoading}
          className="rounded px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--brand-ink)" }}
        >
          {reviewLoading ? "Submitting…" : "Submit Review"}
        </button>
      </div>
    </form>
  );
}
