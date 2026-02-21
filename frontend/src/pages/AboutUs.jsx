import React from "react";
import { Link } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle.js";

export default function AboutUs() {
  usePageTitle("About Us");

  return (
    <div className="min-h-screen bg-[#fbf7f0]">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-3xl px-6 pt-6 pb-2">
        <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-[#9a9a9a]">
          <Link to="/" className="transition hover:text-[color:var(--brand)]">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#4a4a4a]">About Us</span>
        </nav>
      </div>

      {/* Content */}
      <article className="mx-auto max-w-3xl px-6 pt-6 pb-20">
        {/* Title */}
        <h1
          className="text-center text-3xl font-semibold italic tracking-wide text-[#1f1f1f] sm:text-4xl"
          style={{ fontFamily: "Cormorant Garamond, serif" }}
        >
          Iragu for Her
        </h1>

        <div className="mx-auto mt-6 mb-10 h-px w-16 bg-[color:var(--brand)]" />

        {/* Body */}
        <div
          className="space-y-6 text-[15px] leading-relaxed text-[#4a4a4a]"
          style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "18px" }}
        >
          <p>
            Iragu for Her was born from a simple yet powerful dream — to make
            every woman feel confident, comfortable, and beautiful in what they
            wear.
          </p>

          <p>
            We believe fashion is not just about clothing. It is about
            expression, identity, and self-confidence. Every collection at Iragu
            for Her is thoughtfully curated to blend comfort, quality, trend, and
            affordability — because style should be accessible to everyone.
          </p>

          <p>
            Our journey began with a vision to build something meaningful from
            humble beginnings — a brand rooted in hard work, trust, and genuine
            care for people. We understand real families, real needs, and real
            value.
          </p>

          <p>
            From everyday essentials to special occasion outfits, each piece is
            selected with attention to fabric, fit, and finish — ensuring that
            our customers experience both elegance and ease.
          </p>

          <div className="my-10 h-px bg-black/5" />

          <p className="text-center text-lg text-[#1f1f1f]">
            At Iragu for Her, we don't just sell fashion.
          </p>

          <div className="flex flex-col items-center gap-1 text-center">
            <span
              className="text-xl font-semibold italic text-[color:var(--brand-ink)]"
              style={{ fontFamily: "Cormorant Garamond, serif" }}
            >
              We build relationships.
            </span>
            <span
              className="text-xl font-semibold italic text-[color:var(--brand-ink)]"
              style={{ fontFamily: "Cormorant Garamond, serif" }}
            >
              We create confidence.
            </span>
            <span
              className="text-xl font-semibold italic text-[color:var(--brand-ink)]"
              style={{ fontFamily: "Cormorant Garamond, serif" }}
            >
              We celebrate womanhood.
            </span>
          </div>

          <div className="my-10 h-px bg-black/5" />

          <p className="text-center text-[#6b6b6b]">
            Thank you for being a part of our journey.
          </p>
        </div>
      </article>
    </div>
  );
}
