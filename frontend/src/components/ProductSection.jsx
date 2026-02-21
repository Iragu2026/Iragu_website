import React, { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard.jsx";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Navigation } from "swiper/modules";
import "swiper/css/navigation";

export default function ProductSection({
  title,
  products,
  ctaLabel = "View All",
  hideCta = false,
  ctaTo = "",
}) {
  const items = (products || []).slice(0, 8);
  const hasItems = items.length > 0;
  const [navState, setNavState] = useState({ isBeginning: true, isEnd: false });
  const [desktopTwoPageMode, setDesktopTwoPageMode] = useState(false);
  const navIdRaw = useId();
  const navId = useMemo(() => navIdRaw.replace(/[^a-zA-Z0-9_-]/g, ""), [navIdRaw]);
  const prevClass = useMemo(() => `ps-prev-${navId}`, [navId]);
  const nextClass = useMemo(() => `ps-next-${navId}`, [navId]);

  const breakpoints = useMemo(
    () => ({
      420: { slidesPerView: 1.4, slidesPerGroup: 1 },
      640: { slidesPerView: 2, slidesPerGroup: 2, spaceBetween: 22 },
      768: { slidesPerView: 3, slidesPerGroup: 3, spaceBetween: 26 },
      1024: { slidesPerView: 4, slidesPerGroup: 4, spaceBetween: 30 },
    }),
    []
  );

  const canShowPrev = !navState.isBeginning;
  const canShowNext = desktopTwoPageMode ? navState.isBeginning && !navState.isEnd : !navState.isEnd;

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const apply = () => setDesktopTwoPageMode(Boolean(mql.matches));
    apply();
    if (typeof mql.addEventListener !== "function") return;
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  return (
    <section className="sectionWrap">
      <div className="container-page">
        <h2 className="sectionTitle">{title}</h2>

        {hasItems ? (
          <div className="group/section relative mt-8">
            <Swiper
              modules={[Navigation]}
              spaceBetween={22}
              slidesPerView={1.05}
              slidesPerGroup={1}
              breakpoints={breakpoints}
              navigation={{
                prevEl: `.${prevClass}`,
                nextEl: `.${nextClass}`,
                disabledClass: "opacity-0 pointer-events-none",
              }}
              onSwiper={(swiper) => {
                setNavState({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onInit={(swiper) => {
                setNavState({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onSlideChange={(swiper) => {
                setNavState({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
            >
              {items.map((p) => (
                <SwiperSlide key={p.id}>
                  <ProductCard product={p} />
                </SwiperSlide>
              ))}
            </Swiper>

            <button
              type="button"
              aria-label="Previous products"
              className={[
                prevClass,
                "absolute left-2 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/95 p-2 shadow-md ring-1 ring-black/10 backdrop-blur transition hover:bg-white",
                canShowPrev
                  ? "md:opacity-0 md:pointer-events-none md:group-hover/section:opacity-100 md:group-hover/section:pointer-events-auto"
                  : "opacity-0 pointer-events-none",
              ].join(" ")}
            >
              <FiChevronLeft className="text-[#2e2e2e]" size={18} />
            </button>

            <button
              type="button"
              aria-label="Next products"
              className={[
                nextClass,
                "absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/95 p-2 shadow-md ring-1 ring-black/10 backdrop-blur transition hover:bg-white",
                canShowNext
                  ? "md:opacity-0 md:pointer-events-none md:group-hover/section:opacity-100 md:group-hover/section:pointer-events-auto"
                  : "opacity-0 pointer-events-none",
              ].join(" ")}
            >
              <FiChevronRight className="text-[#2e2e2e]" size={18} />
            </button>
          </div>
        ) : (
          <div className="mt-8 rounded border border-black/10 bg-white/60 px-4 py-8 text-center">
            <p className="text-sm text-[#6b6b6b]">No products available.</p>
          </div>
        )}

        {!hideCta && hasItems && (
          <div className="mt-10 flex justify-center">
            {ctaTo ? (
              <Link to={ctaTo} className="btn-primary">
                <span className="btn-primary__text">{ctaLabel}</span>
              </Link>
            ) : (
              <button type="button" className="btn-primary">
                <span className="btn-primary__text">{ctaLabel}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
