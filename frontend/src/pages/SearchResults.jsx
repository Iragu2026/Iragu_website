import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiChevronDown,
  FiChevronUp,
  FiFilter,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";

import ProductCard from "../components/ProductCard.jsx";
import Loader from "../components/Loader.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import {
  searchProducts,
  clearSearch,
} from "../features/search/searchSlice.js";

import "../pageStyles/SearchResults.css";

const CATEGORIES = ["Saree", "Salwar", "Shirt", "Pant"];

export default function SearchResults() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get("q") || "";
  const pageParam = Number(searchParams.get("page")) || 1;

  usePageTitle(keyword ? `Search: ${keyword}` : "Search");

  const {
    results,
    loading,
    error,
    productCount,
    totalPages,
    currentPage,
  } = useSelector((s) => s.search);

  /* ── Local filter state ── */
  const [sortBy, setSortBy] = useState("");
  const [inStock, setInStock] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const prevFiltersRef = useRef(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* ── Collapsible filter sections ── */
  const [openSections, setOpenSections] = useState({
    availability: true,
    price: true,
    category: true,
  });
  const toggleSection = (key) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  /* ── Fetch products when search params or filters change ── */
  const doSearch = useCallback(() => {
    dispatch(
      searchProducts({
        keyword,
        page: pageParam,
        limit: 9,
        sort: sortBy,
        category: selectedCategory,
        priceGte: priceMin ? Number(priceMin) : 0,
        priceLte: priceMax ? Number(priceMax) : 0,
        inStock,
      })
    );
  }, [
    dispatch,
    keyword,
    pageParam,
    sortBy,
    selectedCategory,
    priceMin,
    priceMax,
    inStock,
  ]);

  useEffect(() => {
    doSearch();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [doSearch]);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => dispatch(clearSearch());
  }, [dispatch]);

  /* ── Toast errors ── */
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  /* ── Page navigation ── */
  const goToPage = (p) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(p));
    setSearchParams(params);
  };

  /* ── Reset filters ── */
  const resetFilters = () => {
    setSortBy("");
    setInStock(false);
    setPriceMin("");
    setPriceMax("");
    setSelectedCategory("");
  };

  /* ── When a local filter changes, reset to page 1 ── */
  useEffect(() => {
    const currentFilters = JSON.stringify({
      sortBy,
      inStock,
      priceMin,
      priceMax,
      selectedCategory,
    });

    if (prevFiltersRef.current === null) {
      prevFiltersRef.current = currentFilters;
      return;
    }
    if (prevFiltersRef.current === currentFilters) return;

    prevFiltersRef.current = currentFilters;
    if (pageParam !== 1) {
      const params = new URLSearchParams(searchParams);
      params.set("page", "1");
      setSearchParams(params, { replace: true });
    }
  }, [sortBy, inStock, priceMin, priceMax, selectedCategory, pageParam, searchParams, setSearchParams]);

  /* ── Filter sidebar (shared between desktop & mobile) ── */
  const filterContent = (
    <div className="space-y-6">
      {/* Availability */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("availability")}
          className="flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wider text-[#1f1f1f]"
        >
          Availability
          {openSections.availability ? (
            <FiChevronUp size={16} />
          ) : (
            <FiChevronDown size={16} />
          )}
        </button>
        {openSections.availability && (
          <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm text-[#4a4a4a]">
            <div
              className={`relative h-5 w-9 rounded-full transition ${
                inStock ? "bg-[color:var(--brand)]" : "bg-black/15"
              }`}
              onClick={() => setInStock((v) => !v)}
            >
              <div
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  inStock ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </div>
            In stock only
          </label>
        )}
      </div>

      {/* Price */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("price")}
          className="flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wider text-[#1f1f1f]"
        >
          Price
          {openSections.price ? (
            <FiChevronUp size={16} />
          ) : (
            <FiChevronDown size={16} />
          )}
        </button>
        {openSections.price && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center rounded border border-black/15 px-2 py-1.5">
              <span className="mr-1 text-xs text-[#9a9a9a]">₹</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="price-input w-16 bg-transparent text-sm text-[#1f1f1f] outline-none"
               name="0" id="0" aria-label="0" />
            </div>
            <span className="text-xs text-[#9a9a9a]">to</span>
            <div className="flex items-center rounded border border-black/15 px-2 py-1.5">
              <span className="mr-1 text-xs text-[#9a9a9a]">₹</span>
              <input
                type="number"
                min="0"
                placeholder="99999"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="price-input w-16 bg-transparent text-sm text-[#1f1f1f] outline-none"
               name="99999" id="99999" aria-label="99999" />
            </div>
          </div>
        )}
      </div>

      {/* Category */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("category")}
          className="flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wider text-[#1f1f1f]"
        >
          Category
          {openSections.category ? (
            <FiChevronUp size={16} />
          ) : (
            <FiChevronDown size={16} />
          )}
        </button>
        {openSections.category && (
          <ul className="mt-3 space-y-2">
            {CATEGORIES.map((cat) => (
              <li key={cat}>
                <button
                  type="button"
                  onClick={() => setSelectedCategory((prev) => prev === cat ? "" : cat
                    )
                  }
                  className={`text-sm transition hover:text-[color:var(--brand)] ${
                    selectedCategory === cat
                      ? "font-semibold text-[color:var(--brand)]"
                      : "text-[#4a4a4a]"
                  }`}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Reset */}
      {(inStock || priceMin || priceMax || selectedCategory) && (
        <button
          type="button"
          onClick={resetFilters}
          className="text-xs font-medium text-red-500 underline transition hover:text-red-700"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  /* ── Pagination buttons ── */
  const paginationButtons = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    if (start > 1) {
      pages.push(
        <button key={1} onClick={() => goToPage(1)} className="pagination-btn">
          1
        </button>
      );
      if (start > 2)
        pages.push(
          <span key="s-ell" className="px-1 text-[#9a9a9a]">
            ...
          </span>
        );
    }
    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`flex h-9 min-w-9 items-center justify-center rounded text-sm font-medium transition ${
            i === currentPage
              ? "bg-[color:var(--brand-ink)] text-white"
              : "text-[#4a4a4a] hover:bg-black/5"
          }`}
        >
          {i}
        </button>
      );
    }
    if (end < totalPages) {
      if (end < totalPages - 1)
        pages.push(
          <span key="e-ell" className="px-1 text-[#9a9a9a]">
            ...
          </span>
        );
      pages.push(
        <button
          key={totalPages}
          onClick={() => goToPage(totalPages)}
          className="pagination-btn"
        >
          {totalPages}
        </button>
      );
    }
    return (
      <div className="mt-10 flex items-center justify-center gap-1">
        <button
          onClick={() => goToPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="rounded px-3 py-1.5 text-sm text-[#4a4a4a] transition hover:bg-black/5 disabled:opacity-30"
        >
          ← Prev
        </button>
        {pages}
        <button
          onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="rounded px-3 py-1.5 text-sm text-[#4a4a4a] transition hover:bg-black/5 disabled:opacity-30"
        >
          Next →
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fbf7f0]">
      {/* ── Header ── */}
      <div className="border-b border-black/5 py-10 text-center">
        <h1
          className="text-3xl font-semibold tracking-wide text-[#1f1f1f] sm:text-4xl"
          style={{ fontFamily: "Cormorant Garamond, serif" }}
        >
          Search
        </h1>
        {keyword && (
          <p className="mt-2 text-sm text-[#6b6b6b]">
            {productCount} {productCount === 1 ? "result" : "results"} for
            &ldquo;{keyword}&rdquo;
          </p>
        )}
      </div>

      {/* ── Sort bar + mobile filter toggle ── */}
      <div className="border-b border-black/5">
        <div className="container-page flex items-center justify-between py-3">
          {/* Mobile filter toggle */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-[#4a4a4a] lg:hidden"
          >
            <FiFilter size={15} />
            Filter
          </button>
          <div className="hidden lg:block" />

          {/* Sort dropdown */}
          <div className="relative flex min-w-0 items-center gap-1.5">
            <span className="hidden text-xs text-[#9a9a9a] sm:inline">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-[168px] appearance-none rounded border border-black/10 bg-white py-1.5 pl-3 pr-8 text-sm text-[#1f1f1f] outline-none transition focus:border-[color:var(--brand)] sm:w-auto"
             name="select-field" id="select-field" aria-label="select field">
              <option value="">Relevance</option>
              <option value="price_asc">Price, low to high</option>
              <option value="price_desc">Price, high to low</option>
              <option value="newest">Newest</option>
              <option value="ratings">Top rated</option>
            </select>
            <FiChevronDown
              size={14}
              className="pointer-events-none absolute right-2 text-[#9a9a9a]"
            />
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="container-page flex gap-8 py-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-52 shrink-0 lg:block">{filterContent}</aside>

        {/* Product grid */}
        <div className="flex-1">
          {loading ? (
            <Loader />
          ) : results.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-3">
                {results.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                  />
                ))}
              </div>
              {paginationButtons()}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <p
                className="text-xl text-[#6b6b6b]"
                style={{ fontFamily: "Cormorant Garamond, serif" }}
              >
                No products found
              </p>
              <p className="mt-2 text-sm text-[#9a9a9a]">
                Try a different search term or adjust your filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-[#fbf7f0] p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1f1f1f]">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-md p-2 hover:bg-black/5"
              >
                <FiX size={18} />
              </button>
            </div>
            {filterContent}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-8 w-full rounded py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:opacity-90"
              style={{ background: "var(--brand-ink)" }}
            >
              View results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
