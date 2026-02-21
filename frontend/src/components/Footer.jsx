import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  FiInstagram,
  FiFacebook,
  FiYoutube,
  FiMapPin,
  FiPhone,
  FiGlobe,
} from "react-icons/fi";
import PolicyModal, {
  PrivacyPolicy,
  ShippingAndReturnsPolicy,
  TermsAndConditions,
} from "./PolicyModal.jsx";
import { openCartDrawer } from "../features/cart/cartSlice.js";
import "../componentStyles/Footer.css";

export default function Footer() {
  const dispatch = useDispatch();
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policyKey, setPolicyKey] = useState(null);

  const policy = useMemo(() => {
    if (policyKey === "shipping") {
      return {
        title: "Shipping & Return Policy",
        content: <ShippingAndReturnsPolicy />,
      };
    }
    if (policyKey === "privacy") {
      return { title: "Privacy Policy", content: <PrivacyPolicy /> };
    }
    if (policyKey === "terms") {
      return { title: "Terms of Service", content: <TermsAndConditions /> };
    }
    return { title: "", content: null };
  }, [policyKey]);

  const openPolicyModal = (key) => {
    setPolicyKey(key);
    setPolicyOpen(true);
  };

  const handleNavClick = () => {
    // Make navigation feel obvious (even if clicking the same route)
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[color:var(--brand-ink)]">
      {/* ── Top accent line ── */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-[color:var(--brand)] to-transparent" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* ── Logo + tagline ── */}
        <div className="flex flex-col items-center py-10 sm:py-12">
          <Link to="/" onClick={handleNavClick}>
            <img
              src="/images/logo.png"
              alt="Iragu For Her"
              className="h-20 sm:h-24 brightness-0 invert opacity-90 transition hover:opacity-100"
            />
          </Link>
          <p
            className="mt-3 text-center text-sm italic tracking-wide text-white/50"
            style={{ fontFamily: "Cormorant Garamond, serif" }}
          >
            Celebrating the art of handloom
          </p>
        </div>

        {/* ── Thin divider ── */}
        <div className="h-px bg-white/10" />

        {/* ── Main columns ── */}
        <div className="grid gap-10 py-10 sm:py-12 md:grid-cols-12">
          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="mt-5 space-y-3">
              <li>
                <Link
                  className="footer-link"
                  to="/account?tab=orders"
                  onClick={handleNavClick}
                >
                  Order Status
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/account" onClick={handleNavClick}>
                  My Account
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link"
                  onClick={() => dispatch(openCartDrawer())}
                >
                  Cart
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="md:col-span-3">
            <h4 className="footer-heading">Customer Service</h4>
            <ul className="mt-5 space-y-3">
              <li>
                <button
                  type="button"
                  className="footer-link"
                  onClick={() => openPolicyModal("shipping")}
                >
                  Shipping &amp; Return Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link"
                  onClick={() => openPolicyModal("privacy")}
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link"
                  onClick={() => openPolicyModal("terms")}
                >
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>

          {/* About */}
          <div className="md:col-span-3">
            <h4 className="footer-heading">About Us</h4>
            <p className="mt-5 text-[13px] leading-relaxed text-white/60">
              Iragu For Her is an online platform helping you celebrate the touch
              of intricate handloom collection. The collections are handpicked,
              curated and come in a host of patterns, hues and fine fabric.
            </p>
          </div>

          {/* Contact */}
          <div className="md:col-span-3">
            <h4 className="footer-heading">Contact Us</h4>
            <ul className="mt-5 space-y-4">
              <li className="flex items-start gap-3">
                <FiGlobe className="mt-0.5 shrink-0 text-[color:var(--brand)]" size={15} />
                <a
                  href="https://iraguforher.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] leading-relaxed text-white/60 visited:text-white/60 transition hover:text-white visited:hover:text-white"
                >
                  iraguforher.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <FiPhone className="mt-0.5 shrink-0 text-[color:var(--brand)]" size={15} />
                <a
                  href="tel:+919042991048"
                  className="text-[13px] leading-relaxed text-white/60 visited:text-white/60 transition hover:text-white visited:hover:text-white"
                >
                  +91 9042991048
                </a>
              </li>
              <li className="flex items-start gap-3">
                <FiMapPin className="mt-0.5 shrink-0 text-[color:var(--brand)]" size={15} />
                <span className="text-[13px] leading-relaxed text-white/60">
                  No. 78/53, ECR Road, Near SBI Bank,
                  <br />
                  Thiruvanmiyur, Chennai&#8209;600041.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Thin divider ── */}
        <div className="h-px bg-white/10" />

        {/* ── Bottom bar: socials + copyright ── */}
        <div className="flex flex-col items-center gap-4 py-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <a
              href="https://www.facebook.com/share/1HqgWfxaXZ/?mibextid=wwXIfr"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-[color:var(--brand)] hover:text-[color:var(--brand)]"
              aria-label="Facebook"
              target="_blank"
            >
              <FiFacebook size={15} />
            </a>
            <a
              href="https://www.instagram.com/iragu_for_her/"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-[color:var(--brand)] hover:text-[color:var(--brand)]"
              aria-label="Instagram"
              target="_blank"
            >
              <FiInstagram size={15} />
            </a>
            <a
              href="https://www.youtube.com/@iraguforher"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-[color:var(--brand)] hover:text-[color:var(--brand)]"
              aria-label="YouTube"
              target="_blank"
            >
              <FiYoutube size={15} />
            </a>
          </div>

          <p className="text-xs tracking-wide text-white/40">
            &copy; {new Date().getFullYear()} Iragu For Her. All rights
            reserved.
          </p>
        </div>
      </div>

      <PolicyModal
        isOpen={policyOpen}
        onClose={() => setPolicyOpen(false)}
        title={policy.title}
      >
        {policy.content}
      </PolicyModal>
    </footer>
  );
}
