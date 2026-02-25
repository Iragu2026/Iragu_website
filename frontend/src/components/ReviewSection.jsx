import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import StarRating from "./StarRating.jsx";
import WriteReviewForm from "./WriteReviewForm.jsx";
import "../componentStyles/ProductDetail.css";

export default function ReviewSection({
  productId,
  productName = "",
  ratings = 0,
  numOfReviews = 0,
  breakdown = [],
  reviews = [],
  allowWriteReview = true,
}) {
  const { user, isAuthenticated } = useSelector((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = user?._id || user?.id || null;

  const sortedReviews = useMemo(() => {
    const list = Array.isArray(reviews) ? [...reviews] : [];
    // newest first if createdAt exists
    list.sort((a, b) => {
      const ad = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bd = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bd - ad;
    });
    return list;
  }, [reviews]);

  const totalReviews =
    breakdown.reduce((sum, b) => sum + (b.count || 0), 0) ||
    sortedReviews.length ||
    numOfReviews;

  const hasReviewed = useMemo(() => {
    if (!isAuthenticated || !userId) return false;
    return sortedReviews.some((r) => {
      const reviewUserId =
        typeof r?.user === "string" ? r.user : r?.user?._id || r?.user;
      return reviewUserId && String(reviewUserId) === String(userId);
    });
  }, [sortedReviews, isAuthenticated, userId]);

  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 9; // 3x3 grid
  const totalPages = Math.max(1, Math.ceil(sortedReviews.length / perPage));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const shouldAutoOpenForm =
    allowWriteReview &&
    isAuthenticated &&
    searchParams.get("review") === "1" &&
    !hasReviewed;
  const isFormOpen = !hasReviewed && (showForm || shouldAutoOpenForm);

  // Auto-open review form after login redirect (?review=1)
  useEffect(() => {
    if (!allowWriteReview) return;
    const wantsReview = searchParams.get("review") === "1";
    if (!wantsReview) return;

    // If not logged in, keep the flag; login redirect will bring them back
    if (!isAuthenticated) return;

    const params = new URLSearchParams(searchParams);
    params.delete("review");
    setSearchParams(params, { replace: true });
  }, [allowWriteReview, searchParams, setSearchParams, isAuthenticated]);

  const pageReviews = sortedReviews.slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <section className="py-10">
      {/* Rating summary */}
      <div className="flex flex-col items-center gap-8 border-b border-black/10 pb-8 md:flex-row md:items-center md:justify-between">
        {/* Left: overall */}
        <div className="flex w-full items-center justify-center gap-4 md:w-auto md:justify-start">
          <div className="text-center md:text-left">
            <StarRating rating={ratings} size={18} />
            <div className="mt-1 text-sm text-[#6b6b6b]">
              {ratings.toFixed(2)} out of 5
            </div>
            <div className="mt-0.5 text-xs text-[#9a9a9a]">
              Based on {totalReviews.toLocaleString("en-IN")} reviews
            </div>
          </div>
        </div>

        {/* Center: breakdown bars */}
        <div className="flex-1 space-y-1.5 md:max-w-sm">
          {breakdown.map((b) => {
            const pct = totalReviews ? (b.count / totalReviews) * 100 : 0;
            return (
              <div key={b.stars} className="flex items-center gap-2 text-xs">
                <StarRating rating={b.stars} size={12} />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
                  <div
                    className="h-full rounded-full bg-[#1f1f1f]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-[#6b6b6b]">
                  {b.count.toLocaleString("en-IN")}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: write review / cancel button */}
        {allowWriteReview ? (
          <button
            type="button"
            className={[
              "rounded px-6 py-2.5 text-xs font-semibold uppercase tracking-wider transition",
              isFormOpen
                ? "border border-[color:var(--brand-ink)] text-[color:var(--brand-ink)] hover:bg-black/5"
                : "bg-[#1f1f1f] text-white hover:bg-[#3a3a3a]",
              hasReviewed ? "cursor-not-allowed opacity-50" : "",
            ].join(" ")}
            onClick={() => {
              if (!isAuthenticated) {
                const params = new URLSearchParams(location.search);
                params.set("review", "1");
                const returnTo = `${location.pathname}?${params.toString()}`;
                navigate(`/login?redirect=${encodeURIComponent(returnTo)}`);
                return;
              }
              if (hasReviewed) return;
              setShowForm(!isFormOpen);
            }}
            disabled={hasReviewed}
          >
            {hasReviewed
              ? "Review submitted"
              : isFormOpen
                ? "Cancel review"
                : "Write Product Review"}
          </button>
        ) : null}
      </div>

      {/* Write review form (toggled) */}
      {allowWriteReview && isFormOpen ? (
        <WriteReviewForm
          productId={productId}
          onCancel={() => setShowForm(false)}
        />
      ) : null}

      {/* Individual reviews */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pageReviews.map((r, idx) => {
          const name = r?.name || "Anonymous";
          const initial = name?.[0]?.toUpperCase?.() || "?";
          return (
          <div
            key={r?._id || `${productId || "product"}-rev-${(safePage - 1) * perPage + idx}`}
            className="rounded-md border border-black/5 bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--brand)] text-sm font-bold text-white">
                {initial}
              </div>
              <div>
                <div className="text-sm font-semibold text-[#1f1f1f]">
                  {name}
                </div>
                <StarRating rating={Number(r?.rating || 0)} size={12} />
              </div>
            </div>
            {r?.comment ? (
              <p className="mt-3 text-sm leading-relaxed text-[#6b6b6b]">
                {r.comment}
              </p>
            ) : null}
            {productName ? (
              <div className="mt-3 text-xs text-[#9a9a9a]">{productName}</div>
            ) : null}
          </div>
        )})}
      </div>

      {/* Review cards pagination (ONLY the grid) */}
      {sortedReviews.length > perPage ? (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="rounded border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#1f1f1f] transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6b6b6b]">
            Page {safePage} of {totalPages}
          </div>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="rounded border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#1f1f1f] transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
