import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiChevronLeft, FiChevronRight, FiX, FiZoomIn } from "react-icons/fi";
import { getImageUrl } from "../utils/imageHelper.js";

export default function ImageGallery({ images = [] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const imgElRef = useRef(null);
  const zoomAreaRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const suppressTapRef = useRef(false);
  const lbTouchStartRef = useRef({ x: 0, y: 0 });

  const safeImages = useMemo(
    () => images.map((img) => ({ ...img, url: getImageUrl(img.url) })),
    [images]
  );

  const activeImageIndex =
    safeImages.length > 0 ? Math.min(activeIdx, safeImages.length - 1) : 0;
  const active = safeImages[activeImageIndex] || safeImages[0];

  const resetZoom = () => {
    setZoom(1);
    if (imgElRef.current) imgElRef.current.style.transformOrigin = "50% 50%";
  };

  const goPrev = useCallback(() => {
    resetZoom();
    setActiveIdx((p) => (p - 1 + safeImages.length) % safeImages.length);
  }, [safeImages.length]);

  const goNext = useCallback(() => {
    resetZoom();
    setActiveIdx((p) => (p + 1) % safeImages.length);
  }, [safeImages.length]);

  const openLightbox = () => {
    resetZoom();
    setLightboxOpen(true);
  };

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    resetZoom();
  }, []);

  /* ── Keyboard ── */
  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen, closeLightbox, goNext, goPrev]);

  /* ── Non-passive wheel listener (needed to preventDefault) ── */
  useEffect(() => {
    const el = zoomAreaRef.current;
    if (!lightboxOpen || !el) return undefined;

    const onWheel = (e) => {
      e.preventDefault();
      const step = e.ctrlKey
        ? (e.deltaY < 0 ? 0.08 : -0.08)
        : (e.deltaY < 0 ? 0.3 : -0.3);
      setZoom((z) => Math.max(1, Math.min(5, Number((z + step).toFixed(2)))));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [lightboxOpen]);

  /* ── Pan: update transform-origin via ref (no re-render) ── */
  const handleMouseMove = useCallback((e) => {
    if (!zoomAreaRef.current || !imgElRef.current) return;
    const rect = zoomAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    imgElRef.current.style.transformOrigin = `${x}% ${y}%`;
  }, []);

  /* ── Click to toggle zoom ── */
  const handleImageClick = useCallback(() => {
    setZoom((z) => (z > 1 ? 1 : 2.5));
  }, []);

  /* ── Gallery swipe (main page) ── */
  const handleTouchStart = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
    suppressTapRef.current = false;
  };

  const handleTouchEnd = (e) => {
    if (safeImages.length <= 1) return;
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - touchStartRef.current.x;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(t.clientY - touchStartRef.current.y)) {
      suppressTapRef.current = true;
      dx < 0 ? goNext() : goPrev();
    }
  };

  /* ── Lightbox swipe (touch navigation) ── */
  const handleLbTouchStart = (e) => {
    const t = e.touches?.[0];
    if (t) lbTouchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleLbTouchEnd = (e) => {
    if (safeImages.length <= 1) return;
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - lbTouchStartRef.current.x;
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(t.clientY - lbTouchStartRef.current.y)) {
      dx < 0 ? goNext() : goPrev();
    }
  };

  if (!safeImages.length) return null;

  /* ─────────────── Lightbox ─────────────── */
  const lightbox = lightboxOpen ? (
    <div className="fixed inset-0 z-[200] flex flex-col" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/85" onClick={closeLightbox} />

      {/* Zoom area */}
      <div
        ref={zoomAreaRef}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
        onMouseMove={handleMouseMove}
        onTouchStart={handleLbTouchStart}
        onTouchEnd={handleLbTouchEnd}
        onClick={handleImageClick}
        style={{ cursor: zoom > 1 ? "crosshair" : "zoom-in" }}
      >
        <img
          ref={imgElRef}
          src={active.url}
          alt="Product enlarged"
          className="max-h-full max-w-full select-none object-contain"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "50% 50%",
            transition: "transform 0.25s ease-out",
          }}
          draggable={false}
        />

        {/* Zoom hint */}
        {zoom === 1 && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur-sm">
            <FiZoomIn size={13} />
            Scroll or click to zoom
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 flex items-center justify-center gap-5 pb-5 pt-2">
        {safeImages.length > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-105 active:scale-95"
            aria-label="Previous image"
          >
            <FiChevronLeft size={20} className="text-gray-700" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-105 active:scale-95"
          aria-label="Close preview"
        >
          <FiX size={20} className="text-gray-700" />
        </button>
        {safeImages.length > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-105 active:scale-95"
            aria-label="Next image"
          >
            <FiChevronRight size={20} className="text-gray-700" />
          </button>
        )}
      </div>
    </div>
  ) : null;

  /* ─────────────── Gallery (product page) ─────────────── */
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
