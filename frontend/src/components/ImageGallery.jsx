import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiChevronLeft, FiChevronRight, FiMinus, FiPlus, FiX } from "react-icons/fi";
import { getImageUrl } from "../utils/imageHelper.js";

export default function ImageGallery({ images = [] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const suppressTapRef = useRef(false);

  // Ensure every image has a valid url
  const safeImages = useMemo(
    () => images.map((img) => ({
        ...img,
        url: getImageUrl(img.url),
      })),
    [images]
  );

  const activeImageIndex =
    safeImages.length > 0
      ? Math.min(activeIdx, safeImages.length - 1)
      : 0;
  const active = safeImages[activeImageIndex] || safeImages[0];

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") setActiveIdx((prev) => (prev + 1) % safeImages.length);
      if (e.key === "ArrowLeft") {
        setActiveIdx((prev) => (prev - 1 + safeImages.length) % safeImages.length);
      }
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))));
      if (e.key === "-") setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))));
    };
    window.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxOpen, safeImages.length]);

  const openLightbox = () => {
    setZoom(1);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setZoom(1);
  };

  const zoomIn = () => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))));
  const zoomOut = () => setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))));

  const goPrev = () => setActiveIdx((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  const goNext = () => setActiveIdx((prev) => (prev + 1) % safeImages.length);

  const handleTouchStart = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    suppressTapRef.current = false;
  };

  const handleTouchEnd = (event) => {
    if (safeImages.length <= 1) return;
    const touch = event.changedTouches?.[0];
    if (!touch) return;

    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX >= 40 && absX > absY) {
      suppressTapRef.current = true;
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  if (!safeImages.length) return null;

  const lightbox = lightboxOpen ? (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={closeLightbox} />

      <div
        className="relative mx-auto my-2 flex h-[calc(100dvh-1rem)] w-[min(1200px,96vw)] flex-col overflow-hidden rounded-xl border border-white/15 bg-[#0f1115] shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:my-4 sm:h-[calc(100dvh-2rem)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5 text-white sm:px-4 sm:py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
            Product Preview
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={zoomOut}
              className="rounded-full bg-white/10 p-1.5 transition hover:bg-white/20"
              aria-label="Zoom out"
            >
              <FiMinus size={15} />
            </button>
            <span className="min-w-11 text-center text-xs font-semibold">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              className="rounded-full bg-white/10 p-1.5 transition hover:bg-white/20"
              aria-label="Zoom in"
            >
              <FiPlus size={15} />
            </button>
            <button
              type="button"
              onClick={closeLightbox}
              className="ml-0.5 rounded-full bg-white/10 p-1.5 transition hover:bg-white/20"
              aria-label="Close image viewer"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>

        <div
          className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),rgba(255,255,255,0)_55%)] p-3 sm:p-6"
          onWheel={(e) => {
            e.stopPropagation();
            if (e.deltaY < 0) zoomIn();
            else zoomOut();
          }}
        >
          {safeImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25 sm:left-4"
                aria-label="Previous image"
              >
                <FiChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25 sm:right-4"
                aria-label="Next image"
              >
                <FiChevronRight size={22} />
              </button>
            </>
          )}
          <img
            src={active.url}
            alt="Product enlarged"
            className="max-h-full max-w-full rounded-md object-contain transition-transform duration-150"
            style={{ transform: `scale(${zoom})` }}
          />
        </div>

        {safeImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-t border-white/10 bg-black/20 px-3 py-2 sm:px-4 sm:py-3">
            {safeImages.map((img, i) => (
              <button
                key={img._id || i}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={[
                  "h-12 w-12 flex-shrink-0 overflow-hidden rounded border-2 transition sm:h-14 sm:w-14",
                  i === activeImageIndex
                    ? "border-white"
                    : "border-white/20 opacity-75 hover:opacity-100",
                ].join(" ")}
              >
                <img
                  src={img.url}
                  alt={`Preview ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="flex flex-col-reverse gap-4 sm:flex-row">
        {/* Thumbnails */}
        <div className="flex gap-2 sm:flex-col sm:gap-3">
          {safeImages.map((img, i) => (
            <button
              key={img._id || i}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={[
                "h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2 transition sm:h-20 sm:w-20",
                i === activeImageIndex
                  ? "border-[color:var(--brand)] ring-1 ring-[color:var(--brand)]"
                  : "border-transparent opacity-70 hover:opacity-100",
              ].join(" ")}
            >
              <img
                src={img.url}
                alt={`Thumbnail ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Main image */}
        <button
          type="button"
          onClick={() => {
            if (suppressTapRef.current) {
              suppressTapRef.current = false;
              return;
            }
            openLightbox();
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="group relative flex-1 overflow-hidden rounded bg-white text-left"
          aria-label="Open product image in full screen"
        >
          <img
            src={active.url}
            alt="Product"
            className="h-auto w-full object-contain transition duration-300 group-hover:scale-[1.02]"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">
            Click to zoom
          </span>
          {safeImages.length > 1 ? (
            <span className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white sm:hidden">
              Swipe
            </span>
          ) : null}
        </button>
      </div>

      {lightboxOpen && createPortal(lightbox, document.body)}
    </>
  );
}
