import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";
import { searchPreview, clearPreview } from "../features/search/searchSlice.js";
import { getProductImage } from "../utils/imageHelper.js";
import "../componentStyles/SearchOverlay.css";

const POPULAR_SEARCHES = [
  "Saree",
  "Cotton Saree",
  "Silk Saree",
  "Salwar",
  "Handloom",
  "Red Saree",
  "Blue Saree",
];

export default function SearchOverlay({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const [query, setQuery] = useState("");

  const { preview, previewLoading, previewCount } = useSelector(
    (s) => s.search
  );
  const closeOverlay = useCallback(() => {
    setQuery("");
    dispatch(clearPreview());
    onClose();
  }, [dispatch, onClose]);

  /* ── Focus input when overlay opens / reset when it closes ── */
  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(timer);
  }, [isOpen]);

  /* ── Debounced search-as-you-type ── */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      dispatch(clearPreview());
      return;
    }
    debounceRef.current = setTimeout(() => {
      dispatch(searchPreview(query.trim()));
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, dispatch]);

  /* ── Close on Escape ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") closeOverlay();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, closeOverlay]);

  /* ── Body scroll lock ── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* ── Helpers ── */
  const goToSearchPage = (term) => {
    const q = (term || query).trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    closeOverlay();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    goToSearchPage();
  };

  /* ── Derive suggestions ── */
  const suggestions = query.trim()
    ? [
        query.trim(),
        // unique categories from preview results
        ...preview
          .map((p) => p.category)
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i),
        // product names from preview
        ...preview.map((p) => p.name),
      ].filter((v, i, a) => a.indexOf(v) === i) // deduplicate
    : POPULAR_SEARCHES;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={closeOverlay} />

      {/* Panel */}
      <div className="search-overlay-panel absolute left-0 right-0 top-0 max-h-[85vh] overflow-y-auto bg-[#fbf7f0] shadow-xl">
        {/* ── Search input ── */}
        <form onSubmit={handleSubmit} className="border-b border-black/10">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
            <FiSearch size={20} className="flex-shrink-0 text-[#6b6b6b]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 bg-transparent text-base text-[#1f1f1f] placeholder-[#9a9a9a] outline-none"
              style={{ fontFamily: "Cormorant Garamond, serif" }}
             name="search-products" id="search-products" aria-label="Search products..." />
            <button
              type="button"
              onClick={closeOverlay}
              className="rounded-full p-1.5 transition hover:bg-black/5"
              aria-label="Close search"
            >
              <FiX size={20} className="text-[#6b6b6b]" />
            </button>
          </div>
        </form>

        {/* ── Content ── */}
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex flex-col gap-6 md:flex-row md:gap-10">
            {/* Left: Suggestions */}
            <div className="w-full shrink-0 md:w-44 lg:w-52">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#9a9a9a]">
                {query.trim() ? "Suggestions" : "Popular Searches"}
              </h3>
              <ul className="space-y-2">
                {suggestions.slice(0, 10).map((term, i) => (
                  <li key={`${term}-${i}`}>
                    <button
                      type="button"
                      onClick={() => goToSearchPage(term)}
                      className={`block text-left text-sm transition hover:text-[color:var(--brand)] ${
                        query.trim() &&
                        term.toLowerCase() === query.trim().toLowerCase()
                          ? "font-bold text-[#1f1f1f]"
                          : "text-[#4a4a4a]"
                      }`}
                    >
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Product preview */}
            <div className="flex-1">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#9a9a9a]">
                Products
              </h3>

              {previewLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[color:var(--brand)] border-t-transparent" />
                </div>
              ) : preview.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {preview.map((product) => {
                    const imgUrl = getProductImage(product);
                    const pid = product._id || "demo";
                    return (
                      <Link
                        key={pid}
                        to={`/product/${pid}`}
                        className="group block"
                        onClick={closeOverlay}
                      >
                        <div className="aspect-[2/3] overflow-hidden rounded-sm bg-white shadow-sm ring-1 ring-black/5 transition group-hover:shadow-md">
                          <img
                            src={imgUrl}
                            alt={product.name}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                        </div>
                        <div className="mt-2 text-center">
                          <p
                            className="line-clamp-2 text-xs font-medium leading-snug text-[#3a3a3a]"
                            style={{
                              fontFamily: "Cormorant Garamond, serif",
                            }}
                          >
                            {product.name}
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-[color:var(--brand)]">
                            Rs. {product.price?.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : query.trim() && !previewLoading ? (
                <p className="py-8 text-center text-sm text-[#9a9a9a]">
                  No products found for &ldquo;{query}&rdquo;
                </p>
              ) : null}

              {/* View All Results */}
              {query.trim() && previewCount > 0 && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => goToSearchPage()}
                    className="inline-block rounded px-8 py-3 text-xs font-bold uppercase tracking-[0.25em] text-white transition hover:opacity-90"
                    style={{ background: "var(--brand-ink)" }}
                  >
                    View all results
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
