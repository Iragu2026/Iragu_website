import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import toast from "react-hot-toast";
import ProductCard from "../components/ProductCard.jsx";
import Loader from "../components/Loader.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { clearSearch, searchProducts } from "../features/search/searchSlice.js";

const SLUG_MAP = {
  kalamkari: { title: "Kalamkari Sarees", subCategory: "Kalamkari" },
  chettinad: { title: "Chettinad Sarees", subCategory: "Chettinad" },
  "mul-cotton": { title: "Mul Cotton Sarees", subCategory: "Mul Cotton" },
  "mul-cotton-printed": {
    title: "Mul Cotton Printed Sarees",
    subCategory: "Mul Cotton Printed",
  },
  linen: { title: "Linen Sarees", subCategory: "Linen" },
  mangalagiri: { title: "Mangalagiri Sarees", subCategory: "Mangalagiri" },
  chanderi: { title: "Chanderi Sarees", subCategory: "Chanderi" },
  "kota-cotton": { title: "Kota Cotton Sarees", subCategory: "Kota Cotton" },
  "hand-embroidery": {
    title: "Hand Embroidery Sarees",
    subCategory: "Hand Embroidery",
  },
  "casual-wear": { title: "Casual Wear Sarees", occasion: "Casual Wear" },
  "festive-wear": { title: "Festive Wear Sarees", occasion: "Festive Wear" },
  "office-wear": { title: "Office Wear Sarees", occasion: "Office Wear" },
};

function formatSlug(slug) {
  if (!slug) return "Collection";
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function SubCategoryPage() {
  const { subcategory } = useParams();
  const meta = SLUG_MAP[subcategory] || {};
  const title = meta.title || formatSlug(subcategory);
  usePageTitle(title);

  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get("page")) || 1;

  const { results, loading, error, totalPages, currentPage } = useSelector(
    (s) => s.search
  );

  const [sortBy, setSortBy] = useState("");
  const [inStock, setInStock] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [openSections, setOpenSections] = useState({
    availability: true,
    price: true,
  });
  const prevFiltersRef = useRef(null);
  const toggleSection = (key) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const normalizePriceInput = (value) => String(value || "").replace(/\D/g, "").slice(0, 6);

  const doFetch = useCallback(() => {
    const params = {
      category: "Saree",
      page: pageParam,
      limit: 9,
      sort: sortBy,
      priceGte: priceMin ? Number(priceMin) : 0,
      priceLte: priceMax ? Number(priceMax) : 0,
      inStock,
    };

    if (meta.subCategory) params.subCategory = meta.subCategory;
    if (meta.occasion) params.occasion = meta.occasion;

    dispatch(searchProducts(params));
  }, [
    dispatch,
    pageParam,
    sortBy,
    priceMin,
    priceMax,
    inStock,
    meta.subCategory,
    meta.occasion,
  ]);

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

  useEffect(() => {
    const currentFilters = JSON.stringify({
      sortBy,
      inStock,
      priceMin,
      priceMax,
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
  }, [sortBy, inStock, priceMin, priceMax, pageParam, searchParams, setSearchParams]);

  const goToPage = (p) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(p));
    setSearchParams(params);
  };

  const paginationButtons = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
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

    return (
      <div className="mt-10 flex items-center justify-center gap-1">
        <button
          onClick={() => goToPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="rounded px-3 py-1.5 text-sm text-[#4a4a4a] transition hover:bg-black/5 disabled:opacity-30"
        >
          Prev
        </button>
        {pages}
        <button
          onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="rounded px-3 py-1.5 text-sm text-[#4a4a4a] transition hover:bg-black/5 disabled:opacity-30"
        >
          Next
        </button>
      </div>
    );
  };

  const resetFilters = () => {
    setInStock(false);
    setPriceMin("");
    setPriceMax("");
  };

  const filterContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9a9a9a]">
          Filters
        </p>
        <button
          type="button"
          onClick={resetFilters}
          disabled={!(inStock || priceMin || priceMax)}
          className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear all
        </button>
      </div>

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
              <span className="mr-1 text-xs text-[#9a9a9a]">Rs</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                value={priceMin}
                onChange={(e) => setPriceMin(normalizePriceInput(e.target.value))}
                className="w-16 bg-transparent text-sm text-[#1f1f1f] outline-none"
               name="0" id="0" aria-label="0" />
            </div>
            <span className="text-xs text-[#9a9a9a]">to</span>
            <div className="flex items-center rounded border border-black/15 px-2 py-1.5">
              <span className="mr-1 text-xs text-[#9a9a9a]">Rs</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="99999"
                value={priceMax}
                onChange={(e) => setPriceMax(normalizePriceInput(e.target.value))}
                className="w-16 bg-transparent text-sm text-[#1f1f1f] outline-none"
               name="99999" id="99999" aria-label="99999" />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fbf7f0]">
      <div className="container-page pt-5 pb-2">
        <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-[#9a9a9a]">
          <Link to="/" className="transition hover:text-[color:var(--brand)]">
            Home
          </Link>
          <span>/</span>
          <Link
            to="/sarees"
            className="transition hover:text-[color:var(--brand)]"
          >
            Sarees
          </Link>
          <span>/</span>
          <span className="text-[#4a4a4a]">{title}</span>
        </nav>
      </div>

      <div className="border-b border-black/5 pb-8 pt-4 text-center">
        <h1
          className="text-3xl font-semibold italic tracking-wide text-[#1f1f1f] sm:text-4xl"
          style={{ fontFamily: "Cormorant Garamond, serif" }}
        >
          {title}
        </h1>
      </div>

      <div className="border-b border-black/5">
        <div className="container-page flex items-center justify-end py-3">
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

      <div className="container-page flex gap-8 py-8">
        <aside className="hidden w-52 shrink-0 lg:block">{filterContent}</aside>
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
                Check back soon or browse our full saree collection.
              </p>
              <Link
                to="/sarees"
                className="mt-6 inline-block rounded px-7 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:opacity-90"
                style={{ background: "var(--brand-ink)" }}
              >
                View All Sarees
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
