import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiShare2, FiCheck } from "react-icons/fi";
import {
  GiWashingMachine,
  GiCardboardBox,
} from "react-icons/gi";
import { FiAlertCircle } from "react-icons/fi";

import ImageGallery from "../components/ImageGallery.jsx";
import QuantitySelector from "../components/QuantitySelector.jsx";
import SizeSelector from "../components/SizeSelector.jsx";
import Accordion from "../components/Accordion.jsx";
import TrustBadges from "../components/TrustBadges.jsx";
import StarRating from "../components/StarRating.jsx";
import ReviewSection from "../components/ReviewSection.jsx";
import ProductSection from "../components/ProductSection.jsx";
import RevealOnScroll from "../components/RevealOnScroll.jsx";
import FeatureStrip from "../components/FeatureStrip.jsx";
import Loader from "../components/Loader.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import usePageTitle from "../hooks/usePageTitle.js";

import { fetchProductDetail, clearProductDetail } from "../features/products/productDetailSlice.js";
import toast from "react-hot-toast";
import { addToCart, openCartDrawer } from "../features/cart/cartSlice.js";
import axiosInstance from "../utils/axiosInstance.js";
import { getImageUrl } from "../utils/imageHelper.js";

import "../pageStyles/ProductDetail.css";
import "../componentStyles/ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const {
    product: apiProduct,
    loading,
    error,
  } = useSelector((s) => s.productDetail);

  // Fetch product from API on mount, clear on unmount
  useEffect(() => {
    dispatch(fetchProductDetail(id));
    return () => dispatch(clearProductDetail());
  }, [dispatch, id]);

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  // Toast on product fetch error
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const product = apiProduct || {};
  // Sizes – only show for Salwar / products with sizes (not Saree)
  const showSizes =
    product.category && product.category !== "Saree" &&
    product.sizes && product.sizes.length > 0;
  const sizes = showSizes ? product.sizes : [];

  // Colors from API
  const colors = product.colors && product.colors.length > 0 ? product.colors : [];
  const colorImages = useMemo(
    () => (Array.isArray(product.colorImages) ? product.colorImages : []),
    [product.colorImages]
  );
  const displayColors =
    colors.length > 0
      ? colors
      : colorImages.map((entry) => ({ name: entry.colorName, hex: "" }));

  usePageTitle(product.name || "Product");

  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [giftWrap, setGiftWrap] = useState(false);

  const images = useMemo(() => {
    const selected = String(selectedColor || "").trim().toLowerCase();
    if (selected && colorImages.length > 0) {
      const entry = colorImages.find(
        (ci) => String(ci?.colorName || "").trim().toLowerCase() === selected
      );
      if (entry?.images?.length) {
        return entry.images.map((img) => ({
          ...img,
          url: getImageUrl(img.url),
        }));
      }
    }
    if (!selected && colorImages.length > 0 && Array.isArray(colorImages[0]?.images)) {
      return colorImages[0].images.map((img) => ({
        ...img,
        url: getImageUrl(img.url),
      }));
    }
    if (product.images && product.images.length > 0) {
      return product.images.map((img) => ({
        ...img,
        url: getImageUrl(img.url),
      }));
    }
    return [];
  }, [selectedColor, colorImages, product.images]);

  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    async function loadRelated() {
      if (!product?._id || !product?.category) {
        setRelatedProducts([]);
        return;
      }
      try {
        const { data } = await axiosInstance.get("/api/v1/products", {
          params: {
            category: product.category,
            limit: 8,
          },
        });
        const mapped = (data.products || [])
          .filter((p) => p._id !== product._id)
          .slice(0, 8)
          .map((p) => ({
            _id: p._id,
            id: p._id,
            name: p.name,
            price: p.price,
            image: getImageUrl(p.images?.[0]?.url || ""),
            ratings: p.ratings ?? 0,
            numOfReviews: p.numOfReviews ?? 0,
          }));
        setRelatedProducts(mapped);
      } catch {
        setRelatedProducts([]);
      }
    }

    loadRelated();
  }, [product?._id, product?.category]);

  // Reset local state when product changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setQty(1);
    setSelectedSize("");
    setSelectedColor("");
    setGiftWrap(false);
  }, [id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const navigate = useNavigate();

  const handleAddToCart = () => {
    if (displayColors.length > 0 && !selectedColor) {
      toast.error("Please choose a colour before adding to cart.");
      return;
    }
    if (showSizes && !selectedSize) {
      toast.error("Please choose a size before adding to cart.");
      return;
    }

    const item = {
      product: product._id,
      name: product.name,
      price: product.price,
      image: images[0]?.url,
      stock: product.stock,
      quantity: qty,
      giftWrap: Boolean(giftWrap),
    };
    if (selectedColor) item.color = selectedColor;
    if (showSizes && selectedSize) item.size = selectedSize;
    dispatch(addToCart(item));
    toast.success(`${product.name} added to cart`);
    dispatch(openCartDrawer());
  };

  const handleBuyNow = () => {
    if (displayColors.length > 0 && !selectedColor) {
      toast.error("Please choose a colour before buying now.");
      return;
    }
    if (showSizes && !selectedSize) {
      toast.error("Please choose a size before buying now.");
      return;
    }

    const item = {
      product: product._id,
      name: product.name,
      price: product.price,
      image: images[0]?.url,
      stock: product.stock,
      quantity: qty,
      giftWrap: Boolean(giftWrap),
    };
    if (selectedColor) item.color = selectedColor;
    if (showSizes && selectedSize) item.size = selectedSize;
    dispatch(addToCart(item));
    navigate("/checkout");
  };

  const handleShareProduct = async () => {
    const shareUrl =
      typeof window !== "undefined" ? window.location.href : "";

    if (!shareUrl) {
      toast.error("Unable to copy link right now.");
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement("input");
        input.value = shareUrl;
        input.setAttribute("readonly", "");
        input.style.position = "absolute";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link. Please try again.");
    }
  };

  // ── Loading state ──
  if (loading) return <Loader />;

  // ── Error state ──
  if (error && !apiProduct) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => dispatch(fetchProductDetail(id))}
      />
    );
  }

  // ── Reviews & rating breakdown (REAL product = real reviews only) ──
  const reviews = apiProduct?.reviews || [];
  const breakdown = computeBreakdown(reviews);

  if (!apiProduct) {
    return <ErrorMessage message="Product not found" onRetry={() => dispatch(fetchProductDetail(id))} />;
  }

  return (
    <div className="bg-[#fbf7f0]">
      {/* ──── Product top section ──── */}
      <section className="pdp-container py-6 sm:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Left: Image gallery */}
          <div className="w-full lg:w-[55%]">
            <ImageGallery images={images} />
          </div>

          {/* Right: Product info */}
          <div className="w-full lg:w-[45%]">
            {/* Title */}
            <h1 className="pdp-title">{product.name}</h1>

            {/* Price + rating */}
            <div className="mt-3 flex items-center gap-4">
              <span className="pdp-price">
                Rs. {product.price?.toLocaleString("en-IN")}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-[#6b6b6b]">
                <StarRating rating={product.ratings || 0} size={14} />
                ({(product.ratings || 0).toFixed(1)})
              </span>
            </div>

            <div className="my-6 h-px bg-black/10" />

            {/* Quantity + Stock status */}
            <div className="flex flex-wrap items-center gap-4">
              <QuantitySelector qty={qty} setQty={setQty} max={product.stock ?? 10} />

              {/* Stock badge */}
              {product.stock != null && (
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      product.stock > 0 ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {product.stock > 0 ? (
                    <span className="text-sm font-medium text-green-700">
                      In Stock
                      <span className="ml-1 font-normal text-[#6b6b6b]">
                        — {product.stock} {product.stock === 1 ? "piece" : "pieces"} available
                      </span>
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-red-600">Out of Stock</span>
                  )}
                </div>
              )}
            </div>

            {/* Gift wrap */}
            <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm text-[#3a3a3a]">
              <input
                type="checkbox"
                checked={giftWrap}
                onChange={(e) => setGiftWrap(e.target.checked)}
                className="h-4 w-4 rounded border-black/20 accent-[color:var(--brand)]"
               name="checkbox" id="checkbox" aria-label="input field" />
              <span>🎁</span>
              <span className="font-semibold">Gift Wrap</span>
            </label>

            <div className="my-6 h-px bg-black/10" />

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock != null && product.stock <= 0}
                className={`w-full rounded border-1.5 py-3.5 text-xs font-semibold uppercase tracking-[0.25em] transition ${
                  product.stock != null && product.stock <= 0
                    ? "cursor-not-allowed border-black/15 text-black/30"
                    : "border-[color:var(--brand-ink)] text-[color:var(--brand-ink)] hover:bg-[color:var(--brand-ink)] hover:text-white"
                }`}
              >
                {product.stock != null && product.stock <= 0 ? "Sold Out" : "Add to Cart"}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={product.stock != null && product.stock <= 0}
                className={`w-full rounded py-3.5 text-xs font-bold uppercase tracking-[0.25em] text-white transition ${
                  product.stock != null && product.stock <= 0
                    ? "cursor-not-allowed opacity-40"
                    : "hover:opacity-90"
                }`}
                style={{ background: "var(--brand-ink)" }}
              >
                Buy It Now
              </button>
            </div>

            <div className="my-6 h-px bg-black/10" />

            {/* Size selector – only for products with sizes (e.g. Salwar) */}
            {showSizes && (
              <SizeSelector
                sizes={sizes}
                selected={selectedSize}
                onSelect={setSelectedSize}
              />
            )}

            {/* Colors */}
            {displayColors.length > 0 && (
              <div className={showSizes ? "mt-4" : ""}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#1f1f1f]">Choose Colour</h3>
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                      selectedColor ? "text-[color:var(--brand-ink)]" : "text-red-500"
                    }`}
                  >
                    {selectedColor ? selectedColor : "Required"}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {displayColors.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      className={`group flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
                        selectedColor === c.name
                          ? "border-[color:var(--brand-ink)] bg-[color:var(--brand-ink)]/8 text-[color:var(--brand-ink)] shadow-sm"
                          : "border-black/10 bg-white text-[#4a4a4a] hover:border-[color:var(--brand)] hover:bg-black/[0.02]"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="inline-block h-4 w-4 rounded-full border border-black/15 shadow-inner"
                          style={{ backgroundColor: c.hex || "#d9d9d9" }}
                        />
                        <span className="truncate">{c.name}</span>
                      </span>
                      {selectedColor === c.name ? (
                        <FiCheck size={14} className="shrink-0" />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fabric / Length & Description */}
            <div className="mt-6">
              {product.category === "Saree" ? (
                <>
                  <h3 className="text-sm font-bold text-[#1f1f1f]">
                    Saree Description
                  </h3>
                  {(product.fabric || product.length) && (
                    <div className="mt-2 space-y-2 rounded-lg border border-black/10 bg-black/[0.02] p-4">
                      {product.fabric && (
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                            Fabric
                          </p>
                          <p className="text-sm text-[#1f1f1f] text-right">
                            {product.fabric}
                          </p>
                        </div>
                      )}
                      {product.length && (
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                            Length
                          </p>
                          <p className="text-sm text-[#1f1f1f] text-right">
                            {product.length}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="mt-3 text-sm text-[#6b6b6b]">
                    {product.description}
                  </p>
                </>
              ) : (
                <>
                  {product.fabric && (
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-[#1f1f1f]">Fabric</h3>
                      <p className="mt-1 text-sm text-[#6b6b6b]">{product.fabric}</p>
                    </div>
                  )}
                  <h3 className="text-sm font-bold text-[#1f1f1f]">
                    {product.fabric ? "Description" : "Fabric Description"}
                  </h3>
                  <p className="mt-2 text-sm text-[#6b6b6b]">
                    {product.description}
                  </p>
                </>
              )}
            </div>

            <div className="my-6 h-px bg-black/10" />

            {/* Trust badges */}
            <TrustBadges />

            <div className="my-4 h-px bg-black/10" />

            {/* Accordions */}
            <Accordion
              icon={<GiWashingMachine size={18} />}
              title="Wash care"
              defaultOpen
            >
              <p>{product.washCare || "Gentle hand wash recommended."}</p>
            </Accordion>

            <Accordion
              icon={<GiCardboardBox size={18} />}
              title="Shipping & Delivery"
            >
              <p>{product.shippingInfo || "Orders are usually shipped within 1 to 3 business days."}</p>
            </Accordion>

            <Accordion
              icon={<FiAlertCircle size={18} />}
              title="Disclaimer"
              defaultOpen
            >
              <p>{product.disclaimer || "Actual product color may vary slightly due to display settings."}</p>
            </Accordion>

            {/* Share */}
            <button
              type="button"
              onClick={handleShareProduct}
              className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6b6b6b] transition hover:text-[color:var(--brand-ink)]"
              aria-label="Copy product link"
            >
              <span>Share</span>
              <FiShare2 size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ──── Related Products ──── */}
      {relatedProducts.length > 0 && (
        <RevealOnScroll>
          <div className="border-t border-black/5">
            <ProductSection
              title="Related Products"
              products={relatedProducts}
              hideCta
            />
          </div>
        </RevealOnScroll>
      )}

      {/* ──── Reviews ──── */}
      <RevealOnScroll>
        <div className="border-t border-black/5">
          <div className="pdp-container">
            <ReviewSection
              productId={product._id}
              ratings={product.ratings || 0}
              numOfReviews={product.numOfReviews || 0}
              breakdown={breakdown}
              reviews={reviews}
              productName={product.name}
              allowWriteReview={false}
            />
          </div>
        </div>
      </RevealOnScroll>

      {/* ──── Feature strip ──── */}
      <RevealOnScroll>
        <FeatureStrip />
      </RevealOnScroll>
    </div>
  );
}

/**
 * Build a 5-star breakdown array from raw reviews.
 */
function computeBreakdown(reviews) {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    counts[star]++;
  });
  return [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: counts[s] }));
}

