import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import "../componentStyles/HeroSlider.css";

export default function HeroSlider({ banners = [] }) {
  if (!banners.length) return null;

  return (
    <section className="heroSlider">
      <div className="heroSlider__frame">
        <Swiper
          modules={[Autoplay, Pagination, EffectFade]}
          autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          pagination={{ clickable: true, el: ".heroSlider__pagination" }}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={900}
          loop={banners.length > 1}
          className="heroSlider__swiper"
        >
          {banners.map((b) => (
            <SwiperSlide key={b.id}>
              <div className="heroSlider__media">
                <img
                  src={b.image}
                  alt={b.alt}
                  className="heroSlider__image"
                  loading="eager"
                />
                <div className="heroSlider__veil" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="heroSlider__bottom">
          <div className="heroSlider__pagination" />
        </div>
      </div>
    </section>
  );
}

