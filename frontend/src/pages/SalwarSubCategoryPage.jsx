import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
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

/* ─── Slug → { title, subCategory, fabric, occasion } mapping ─── */
const SLUG_MAP = {
  /* ── Suit Sets ── */
  "cotton-suit-sets":                    { title: "Cotton Suit Sets",                 subCategory: "Suit Set",  fabric: "Cotton",                   occasion: "" },
  "handblock-printed-cotton-suit-sets":  { title: "Handblock Printed Cotton Suit Sets", subCategory: "Suit Set", fabric: "Handblock Printed Cotton", occasion: "" },
  "kota-cotton-suit-sets":               { title: "Kota Cotton Suit Sets",            subCategory: "Suit Set",  fabric: "Kota Cotton",              occasion: "" },
  "silk-cotton-suit-sets":               { title: "Silk Cotton Suit Sets",            subCategory: "Suit Set",  fabric: "Silk Cotton",              occasion: "" },
  "kalamkari-suit-sets":                 { title: "Kalamkari Suit Sets",              subCategory: "Suit Set",  fabric: "Kalamkari",                occasion: "" },
  "chikankari-suit-sets":                { title: "Chikankari Suit Sets",             subCategory: "Suit Set",  fabric: "Chikankari",               occasion: "" },
  "festive-wear-suit-sets":              { title: "Festive Wear Suit Sets",           subCategory: "Suit Set",  fabric: "",                         occasion: "Festive Wear" },

  /* ── Co-Ord Sets ── */
  "cotton-coord-sets":                   { title: "Cotton Co-Ord Sets",               subCategory: "Coord Set", fabric: "Cotton",                   occasion: "" },
  "kalamkari-coord-sets":                { title: "Kalamkari Co-Ord Sets",            subCategory: "Coord Set", fabric: "Kalamkari",                occasion: "" },
  "chikankari-coord-sets":               { title: "Chikankari Co-Ord Sets",           subCategory: "Coord Set", fabric: "Chikankari",               occasion: "" },
  "ajrak-coord-sets":                    { title: "Ajrak Co-Ord Sets",                subCategory: "Coord Set", fabric: "Ajrak",                    occasion: "" },

  /* ── Kurtas ── */
  "cotton-kurtas":                       { title: "Cotton Kurtas",                    subCategory: "Kurta",     fabric: "Cotton",                   occasion: "" },
  "kalamkari-kurtas":                    { title: "Kalamkari Kurtas",                 subCategory: "Kurta",     fabric: "Kalamkari",                occasion: "" },
  "chikankari-kurtas":                   { title: "Chikankari Kurtas",                subCategory: "Kurta",     fabric: "Chikankari",               occasion: "" },
  "ajrak-kurtas":                        { title: "Ajrak Kurtas",                     subCategory: "Kurta",     fabric: "Ajrak",                    occasion: "" },

  /* ── Short Tops ── */
  "cotton-short-tops":                   { title: "Cotton Short Tops",                subCategory: "Short Top", fabric: "Cotton",                   occasion: "" },
  "kalamkari-short-tops":                { title: "Kalamkari Short Tops",             subCategory: "Short Top", fabric: "Kalamkari",                occasion: "" },
  "ajrak-short-tops":                    { title: "Ajrak Short Tops",                 subCategory: "Short Top", fabric: "Ajrak",                    occasion: "" },

  /* ── Duppattas ── */
  "cotton-duppattas":                    { title: "Cotton Duppattas",                 subCategory: "Duppatta",  fabric: "Cotton",                   occasion: "" },
  "kota-cotton-duppattas":               { title: "Kota Cotton Duppattas",            subCategory: "Duppatta",  fabric: "Kota Cotton",              occasion: "" },

  /* ── Stoles ── */
  "cotton-stoles":                       { title: "Cotton Stoles",                    subCategory: "Stole",     fabric: "Cotton",                   occasion: "" },
};

const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

function formatSlug(slug) {
  if (!slug) return "Collection";
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function SalwarSubCategoryPage() {
  const { subcategory } = useParams();
  const meta = SLUG_MAP[subcategory];
  const title = meta?.title || formatSlug(subcategory);
  usePageTitle(title);

  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get("page")) || 1;

  const {
    results,
    loading,
    error,
    totalPages,
    currentPage,
  } = useSelector((s) => s.search);

  /* ── Local filter state ── */
  const [sortBy, setSortBy] = useState("");
  const [inStock, setInStock] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const prevFiltersRef = useRef(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* ── Collapsible sections ── */
  const [openSections, setOpenSections] = useState({
    availability: true,
    price: true,
  });
  const toggleSection = (key) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  /* ── Fetch products ── */
  const doFetch = useCallback(() => {
    const params = {
      category: "Salwar",
      page: pageParam,
      limit: 9,
      sort: sortBy,
      priceGte: priceMin ? Number(priceMin) : 0,
      priceLte: priceMax ? Number(priceMax) : 0,
      inStock,
    };

    if (meta?.subCategory) params.subCategory = meta.subCategory;
    if (meta?.fabric) params.fabric = meta.fabric;
    if (meta?.occasion) params.occasion = meta.occasion;

    dispatch(searchProducts(params));
  }, [dispatch, pageParam, sortBy, priceMin, priceMax, inStock, meta]);

  useEffect(() => {
    doFetch();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [doFetch]);

  useEffect(() => {
    return () => dispatch(clearSearch());
  }, [dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const goToPage = (p) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(p));
    setSearchParams(params);
  };

  const resetFilters = () => {
    setSortBy("");
    setInStock(false);
    setPriceMin("");
    setPriceMax("");
    setSelectedSize("");
  };

  useEffect(() => {
    const currentFilters = JSON.stringify({
      sortBy,
      inStock,
      priceMin,
      priceMax,
      selectedSize,
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
  }, [sortBy, inStock, priceMin, priceMax, selectedSize, pageParam, searchParams, setSearchParams]);

  /* ── Filter sidebar ── */
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
          {openSections.availability ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
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
          {openSections.price ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
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

      {(inStock || priceMin || priceMax || selectedSize) && (
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

  /* ── Pagination ── */
  const paginationButtons = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible)
      start = Math.max(1, end - maxVisible + 1);

    if (start > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => goToPage(1)}
          className="flex h-9 min-w-9 items-center justify-center rounded text-sm font-medium text-[#4a4a4a] hover:bg-black/5"
        >
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
          className="flex h-9 min-w-9 items-center justify-center rounded text-sm font-medium text-[#4a4a4a] hover:bg-black/5"
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
      {/* ── Breadcrumb ── */}
      <div className="container-page pt-5 pb-2">
        <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-[#9a9a9a]">
          <Link to="/" className="transition hover:text-[color:var(--brand)]">
            Home
          </Link>
          <span>/</span>
          <Link to="/salwars" className="transition hover:text-[color:var(--brand)]">
            Salwars
          </Link>
          <span>/</span>
          <span className="text-[#4a4a4a]">{title}</span>
        </nav>
      </div>

      {/* ── Title ── */}
      <div className="border-b border-black/5 pb-8 pt-4 text-center">
        <h1
          className="text-3xl font-semibold italic tracking-wide text-[#1f1f1f] sm:text-4xl"
          style={{ fontFamily: "Cormorant Garamond, serif" }}
        >
          {title}
        </h1>
      </div>

      {/* ── Size selector ── */}
      <div className="border-b border-black/5 py-5">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedSize((prev) => (prev === size ? "" : size))
              }
              className={`flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold transition ${
                selectedSize === size
                  ? "border-[color:var(--brand-ink)] bg-[color:var(--brand-ink)] text-white"
                  : "border-black/20 text-[#4a4a4a] hover:border-[color:var(--brand)]"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        {selectedSize && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-black/5 px-3 py-1 text-xs text-[#4a4a4a]">
              Size: {selectedSize}
              <button
                type="button"
                onClick={() => setSelectedSize("")}
                className="ml-0.5 text-[#9a9a9a] hover:text-red-500"
              >
                <FiX size={12} />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* ── Sort bar ── */}
      <div className="border-b border-black/5">
        <div className="container-page flex items-center justify-between py-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-[#4a4a4a] lg:hidden"
          >
            <FiFilter size={15} />
            Filter
          </button>
          <div className="hidden lg:block" />

          <div className="relative flex min-w-0 items-center gap-1.5">
            <span className="hidden text-xs text-[#9a9a9a] sm:inline">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-[168px] appearance-none rounded border border-black/10 bg-white py-1.5 pl-3 pr-8 text-sm text-[#1f1f1f] outline-none transition focus:border-[color:var(--brand)] sm:w-auto"
             name="select-field" id="select-field" aria-label="select field">
              <option value="">Featured</option>
              <option value="price_asc">Price, low to high</option>
              <option value="price_desc">Price, high to low</option>
              <option value="newest">Date, new to old</option>
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
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-base text-red-500">{error}</p>
              <button
                type="button"
                onClick={doFetch}
                className="mt-4 rounded px-6 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:opacity-90"
                style={{ background: "var(--brand-ink)" }}
              >
                Retry
              </button>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-3">
                {results.map((product) => (
                  <ProductCard key={product._id} product={product} />
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
                Try adjusting your filters or check back later for new arrivals
              </p>
              <Link
                to="/salwars"
                className="mt-6 inline-block rounded px-7 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:opacity-90"
                style={{ background: "var(--brand-ink)" }}
              >
                View All Salwars
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-[#fbf7f0] p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2
                className="text-lg font-semibold text-[#1f1f1f]"
                style={{ fontFamily: "Cormorant Garamond, serif" }}
              >
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
