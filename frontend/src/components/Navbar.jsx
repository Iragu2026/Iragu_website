import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiMenu,
  FiSearch,
  FiShoppingBag,
  FiUser,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiLogOut,
  FiHeart,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { checkUserSession, logoutUser } from "../features/user/userSlice.js";
import { openCartDrawer, fetchCart } from "../features/cart/cartSlice.js";
import SearchOverlay from "./SearchOverlay.jsx";
import { getAvatarUrl } from "../utils/avatarHelper.js";
import "../componentStyles/Navbar.css";

/* ── Nav items with optional mega-dropdown ── */
const SAREES_DROPDOWN = {
  columns: [
    {
      heading: null,
      links: [{ label: "All Sarees", to: "/sarees" }],
    },
    {
      heading: "Shop by Fabric",
      links: [
        { label: "Kalamkari", to: "/sarees/kalamkari" },
        { label: "Chettinad", to: "/sarees/chettinad" },
        { label: "Mul Cotton", to: "/sarees/mul-cotton" },
        { label: "Mul Cotton Printed", to: "/sarees/mul-cotton-printed" },
        { label: "Linen", to: "/sarees/linen" },
        { label: "Mangalagiri", to: "/sarees/mangalagiri" },
        { label: "Chanderi", to: "/sarees/chanderi" },
        { label: "Kota Cotton", to: "/sarees/kota-cotton" },
        { label: "Hand Embroidery", to: "/sarees/hand-embroidery" },
      ],
    },
    {
      heading: "Shop by Occasion",
      links: [
        { label: "Casual Wear", to: "/sarees/casual-wear" },
        { label: "Festive Wear", to: "/sarees/festive-wear" },
        { label: "Office Wear", to: "/sarees/office-wear" },
      ],
    },
  ],
};

const SALWARS_DROPDOWN = {
  type: "salwars-hover",
  groups: [
    { label: "All Salwars", to: "/salwars", children: null },
    {
      label: "Suit Sets",
      to: "/salwars",
      children: [
        { label: "Cotton", to: "/salwars/cotton-suit-sets" },
        { label: "Handblock Printed Cotton", to: "/salwars/handblock-printed-cotton-suit-sets" },
        { label: "Kota Cotton", to: "/salwars/kota-cotton-suit-sets" },
        { label: "Silk Cotton", to: "/salwars/silk-cotton-suit-sets" },
        { label: "Kalamkari", to: "/salwars/kalamkari-suit-sets" },
        { label: "Chikankari", to: "/salwars/chikankari-suit-sets" },
        { label: "Festive Wear", to: "/salwars/festive-wear-suit-sets" },
      ],
    },
    {
      label: "Co-Ord Sets",
      to: "/salwars",
      children: [
        { label: "Cotton", to: "/salwars/cotton-coord-sets" },
        { label: "Kalamkari", to: "/salwars/kalamkari-coord-sets" },
        { label: "Chikankari", to: "/salwars/chikankari-coord-sets" },
        { label: "Ajrak", to: "/salwars/ajrak-coord-sets" },
      ],
    },
    {
      label: "Kurtas",
      to: "/salwars",
      children: [
        { label: "Cotton", to: "/salwars/cotton-kurtas" },
        { label: "Kalamkari", to: "/salwars/kalamkari-kurtas" },
        { label: "Chikankari", to: "/salwars/chikankari-kurtas" },
        { label: "Ajrak", to: "/salwars/ajrak-kurtas" },
      ],
    },
    {
      label: "Short Tops",
      to: "/salwars",
      children: [
        { label: "Cotton", to: "/salwars/cotton-short-tops" },
        { label: "Kalamkari", to: "/salwars/kalamkari-short-tops" },
        { label: "Ajrak", to: "/salwars/ajrak-short-tops" },
      ],
    },
    {
      label: "Duppattas",
      to: "/salwars",
      children: [
        { label: "Cotton", to: "/salwars/cotton-duppattas" },
        { label: "Kota Cotton", to: "/salwars/kota-cotton-duppattas" },
      ],
    },
    {
      label: "Stole",
      to: "/salwars",
      children: [
        { label: "Cotton", to: "/salwars/cotton-stoles" },
      ],
    },
  ],
};

const navItems = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "New Arrivals", to: "/new-arrivals" },
  { label: "Sarees", to: "/sarees", dropdown: SAREES_DROPDOWN },
  { label: "Salwars", to: "/salwars", dropdown: SALWARS_DROPDOWN },
  { label: "Offers", to: "/offers" },
];

function IconBtn({ label, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      className={`nav-icon-btn ${className}`}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const [mobileSubExpanded, setMobileSubExpanded] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const hideTimeoutRef = useRef(null);
  const userMenuRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, user } = useSelector((s) => s.user);
  const avatarUrl = getAvatarUrl(user);
  const { cartItems } = useSelector((s) => s.cart);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  // Load user session on first mount
  useEffect(() => {
    dispatch(checkUserSession());
  }, [dispatch]);

  // When authenticated, load cart
  useEffect(() => {
    if (isAuthenticated) dispatch(fetchCart());
  }, [isAuthenticated, dispatch]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  // Track scroll for sticky shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await dispatch(logoutUser());
    toast.success("Logged out successfully");
    navigate("/");
  };

  const linkClassName = useMemo(
    () => ({ isActive }) => `${isActive ? "navLink navLinkActive" : "navLink"} whitespace-nowrap`,
    []
  );

  /* ── Dropdown hover handlers ── */
  const showDropdown = (label) => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setActiveDropdown(label);
  };

  const scheduleHide = () => {
    hideTimeoutRef.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  const cancelHide = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  };

  /* ── Icon button helper ── */
  return (
    <header
      className={`sticky top-0 z-40 bg-[#fbf7f0]/95 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "shadow-[0_1px_12px_rgba(0,0,0,0.06)]" : ""
      }`}
    >
      {/* ═══ Top bar: hamburger · logo · icons ═══ */}
      <div className="border-b border-black/[0.04]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6">
          {/* Left: mobile hamburger / desktop spacer */}
          <div className="flex w-24 items-center md:hidden">
            <IconBtn label="Open menu" onClick={() => setMobileOpen(true)}>
              <FiMenu size={20} />
            </IconBtn>
          </div>
          <div className="hidden w-24 md:block" />

          {/* Center: logo */}
          <NavLink to="/" className="flex shrink-0 items-center justify-center">
            <div className="h-10 w-36 overflow-hidden sm:h-14 sm:w-56 md:h-16 md:w-64">
              <img
                src="/images/logo.png"
                alt="Iragu For Her"
                className="h-auto w-full -mt-[22%] object-contain"
                loading="eager"
              />
            </div>
          </NavLink>

          {/* Right: action icons */}
          <div className="flex w-24 items-center justify-end gap-0 md:gap-1">
            <IconBtn label="Search" onClick={() => setSearchOpen(true)}>
              <FiSearch size={18} />
            </IconBtn>

            {/* User icon + dropdown */}
            <div className="relative" ref={userMenuRef}>
              <IconBtn
                label={isAuthenticated ? user?.name : "Login"}
                onClick={() => {
                  if (isAuthenticated) {
                    setUserMenuOpen((v) => !v);
                  } else {
                    navigate("/login");
                  }
                }}
                className={isAuthenticated ? "nav-icon-btn--active" : ""}
              >
                {isAuthenticated ? (
                  <span className="inline-flex h-6 w-6 overflow-hidden rounded-full border border-black/10 bg-[#f6f2ea]">
                      <img
                      src={avatarUrl}
                      alt={user?.name || "Profile"}
                      className="h-full w-full object-cover"
                    />
                  </span>
                ) : (
                  <FiUser size={18} />
                )}
              </IconBtn>

              {/* User dropdown */}
              {isAuthenticated && userMenuOpen && (
                <div className="nav-user-dropdown">
                  <div className="border-b border-black/5 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-ink)] text-xs font-bold text-white">
                        <img
                          src={avatarUrl}
                          alt={user?.name || "Profile"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#1f1f1f]">
                          {user?.name}
                        </p>
                        <p className="truncate text-[11px] text-[#9a9a9a]">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="nav-user-dropdown__item"
                    >
                      <FiUser size={14} />
                      My Account
                    </Link>
                    {user?.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="nav-user-dropdown__item"
                      >
                        <FiHeart size={14} />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="nav-user-dropdown__item nav-user-dropdown__item--danger w-full"
                    >
                      <FiLogOut size={14} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cart */}
            <IconBtn label="Cart" onClick={() => dispatch(openCartDrawer())}>
              <FiShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="nav-cart-badge">{cartCount}</span>
              )}
            </IconBtn>
          </div>
        </div>
      </div>

      {/* ═══ Desktop navigation row ═══ */}
      <nav className="relative hidden md:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ul className="flex items-center justify-center gap-9 py-3">
            {navItems.map((item) => (
              <li
                key={item.to}
                className="relative"
                onMouseEnter={
                  item.dropdown ? () => showDropdown(item.label) : undefined
                }
                onMouseLeave={item.dropdown ? scheduleHide : undefined}
              >
                <NavLink
                  to={item.to}
                  className={linkClassName}
                  end={item.to === "/"}
                >
                  {item.label}
                </NavLink>

                {/* ── Simple compact dropdown ── */}
                {item.dropdown?.type === "simple" &&
                  activeDropdown === item.label && (
                    <div
                      className="mega-dropdown absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2"
                      onMouseEnter={cancelHide}
                      onMouseLeave={scheduleHide}
                    >
                      <div className="min-w-[240px] rounded-lg border border-black/[0.06] bg-white/95 backdrop-blur-lg py-4 px-5 shadow-xl">
                        <ul className="space-y-3">
                          {item.dropdown.links.map((link) => (
                            <li key={link.to}>
                              <Link
                                to={link.to}
                                onClick={() => setActiveDropdown(null)}
                                className="block text-sm text-[#4a4a4a] transition hover:text-[color:var(--brand)]"
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                {/* ── Two-panel hover dropdown (Salwars) ── */}
                {item.dropdown?.type === "salwars-hover" &&
                  activeDropdown === item.label && (
                    <div
                      className="mega-dropdown absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2"
                      onMouseEnter={cancelHide}
                      onMouseLeave={() => {
                        setHoveredGroup(null);
                        scheduleHide();
                      }}
                    >
                      <div className="salwars-dropdown-panel flex rounded-lg border border-black/[0.06] bg-white/95 backdrop-blur-lg shadow-xl">
                        {/* Left panel */}
                        <div className="salwars-left-panel w-[200px] border-r border-black/5 py-3">
                          {item.dropdown.groups.map((group) => (
                            <div
                              key={group.label}
                              className="relative"
                              onMouseEnter={() => group.children
                                  ? setHoveredGroup(group.label)
                                  : setHoveredGroup(null)
                              }
                            >
                              <Link
                                to={group.to}
                                onClick={() => {
                                  setActiveDropdown(null);
                                  setHoveredGroup(null);
                                }}
                                className={`flex items-center justify-between px-5 py-2.5 text-sm transition ${
                                  hoveredGroup === group.label
                                    ? "text-[color:var(--brand)] bg-black/[0.02]"
                                    : "text-[#4a4a4a] hover:text-[color:var(--brand)]"
                                }`}
                              >
                                {group.label}
                                {group.children && (
                                  <FiChevronDown
                                    size={13}
                                    className="ml-2 -rotate-90 text-[#9a9a9a]"
                                  />
                                )}
                              </Link>
                            </div>
                          ))}
                        </div>

                        {/* Right panel */}
                        {hoveredGroup &&
                          (() => {
                            const group = item.dropdown.groups.find(
                              (g) => g.label === hoveredGroup
                            );
                            if (!group?.children) return null;
                            return (
                              <div className="salwars-right-panel w-[220px] py-3">
                                {group.children.map((child) => (
                                  <Link
                                    key={child.to}
                                    to={child.to}
                                    onClick={() => {
                                      setActiveDropdown(null);
                                      setHoveredGroup(null);
                                    }}
                                    className="block px-5 py-2 text-sm text-[#4a4a4a] transition hover:text-[color:var(--brand)]"
                                  >
                                    {child.label}
                                  </Link>
                                ))}
                              </div>
                            );
                          })()}
                      </div>
                    </div>
                  )}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Mega dropdown (Sarees-style, full-width) ── */}
        {navItems.map(
          (item) => item.dropdown &&
            item.dropdown.type !== "simple" &&
            item.dropdown.type !== "salwars-hover" &&
            activeDropdown === item.label && (
              <div
                key={`dd-${item.label}`}
                className="mega-dropdown absolute left-0 right-0 top-full z-40 border-b border-black/[0.04] bg-[#fbf7f0]/95 backdrop-blur-lg shadow-xl"
                onMouseEnter={cancelHide}
                onMouseLeave={scheduleHide}
              >
                <div className="mx-auto flex max-w-5xl gap-12 px-8 py-8">
                  {item.dropdown.columns.map((col, ci) => (
                    <div key={ci} className="min-w-0">
                      {col.heading ? (
                        <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a9a9a]">
                          {col.heading}
                        </h4>
                      ) : null}
                      <ul className="space-y-2">
                        {col.links.map((link) => (
                          <li key={link.to}>
                            <Link
                              to={link.to}
                              onClick={() => setActiveDropdown(null)}
                              className="block text-sm text-[#4a4a4a] transition hover:text-[color:var(--brand)]"
                              style={{
                                fontFamily:
                                  col.heading === null
                                    ? "Cormorant Garamond, serif"
                                    : undefined,
                                fontWeight:
                                  col.heading === null ? 600 : undefined,
                                fontSize:
                                  col.heading === null ? "15px" : undefined,
                              }}
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )
        )}
      </nav>

      {/* ═══ Mobile drawer ═══ */}
      {mobileOpen ? createPortal((
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer */}
          <div className="mobile-drawer absolute left-0 top-0 h-dvh w-[86%] max-w-sm overflow-y-auto bg-[#fbf7f0] shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-black/[0.04] px-5 py-4">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3"
              >
                <img
                  src="/images/logo.png"
                  alt="Iragu For Her"
                  className="h-9 w-auto"
                />
              </Link>
              <button
                type="button"
                className="nav-icon-btn"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Nav links */}
            <div className="px-4 py-4">
              <ul className="flex flex-col gap-0.5">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <div className="flex items-center">
                      <NavLink
                        to={item.to}
                        end={item.to === "/"}
                        className={({ isActive }) => `flex-1 block rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                            isActive
                              ? "bg-[color:var(--brand)]/10 text-[color:var(--brand)]"
                              : "text-[#3a3a3a] hover:bg-black/[0.02] hover:text-[color:var(--brand)]"
                          }`
                        }
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.label}
                      </NavLink>
                      {item.dropdown && (
                        <button
                          type="button"
                          onClick={() => setMobileExpanded((prev) => prev === item.label ? null : item.label
                            )
                          }
                          className="rounded-lg p-2 text-[#6b6b6b] transition hover:bg-black/5"
                        >
                          {mobileExpanded === item.label ? (
                            <FiChevronUp size={16} />
                          ) : (
                            <FiChevronDown size={16} />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Expandable sub-menu */}
                    {item.dropdown && mobileExpanded === item.label && (
                      <div className="ml-4 mt-1 mb-2 space-y-3 border-l-2 border-[color:var(--brand)]/20 pl-4">
                        {item.dropdown.type === "simple" ? (
                          <ul className="space-y-1">
                            {item.dropdown.links.map((link) => (
                              <li key={link.to}>
                                <Link
                                  to={link.to}
                                  onClick={() => setMobileOpen(false)}
                                  className="block py-1 text-xs text-[#4a4a4a] transition hover:text-[color:var(--brand)]"
                                >
                                  {link.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : item.dropdown.type === "salwars-hover" ? (
                          <div className="space-y-1">
                            {item.dropdown.groups.map((group) => (
                              <div key={group.label}>
                                <div className="flex items-center">
                                  <Link
                                    to={group.to}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex-1 block py-1.5 text-xs font-medium text-[#4a4a4a] transition hover:text-[color:var(--brand)]"
                                  >
                                    {group.label}
                                  </Link>
                                  {group.children && (
                                    <button
                                      type="button"
                                      onClick={() => setMobileSubExpanded((prev) => prev === group.label
                                            ? null
                                            : group.label
                                        )
                                      }
                                      className="rounded p-1 text-[#6b6b6b] hover:bg-black/5"
                                    >
                                      {mobileSubExpanded === group.label ? (
                                        <FiChevronUp size={13} />
                                      ) : (
                                        <FiChevronDown size={13} />
                                      )}
                                    </button>
                                  )}
                                </div>
                                {group.children &&
                                  mobileSubExpanded === group.label && (
                                    <ul className="ml-3 mt-0.5 mb-1 space-y-0.5 border-l border-black/5 pl-3">
                                      {group.children.map((child) => (
                                        <li key={child.to}>
                                          <Link
                                            to={child.to}
                                            onClick={() => setMobileOpen(false)
                                            }
                                            className="block py-1 text-[11px] text-[#6b6b6b] transition hover:text-[color:var(--brand)]"
                                          >
                                            {child.label}
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          item.dropdown.columns.map((col, ci) => (
                            <div key={ci}>
                              {col.heading && (
                                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a9a9a]">
                                  {col.heading}
                                </p>
                              )}
                              <ul className="space-y-1">
                                {col.links.map((link) => (
                                  <li key={link.to}>
                                    <Link
                                      to={link.to}
                                      onClick={() => setMobileOpen(false)}
                                      className="block py-1 text-xs text-[#4a4a4a] transition hover:text-[color:var(--brand)]"
                                    >
                                      {link.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {/* ── Mobile auth section ── */}
              <div className="mt-5 border-t border-black/[0.06] pt-5">
                {isAuthenticated ? (
                  <>
                    <div className="mb-3 flex items-center gap-3 rounded-xl bg-[color:var(--brand-ink)]/5 px-4 py-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-ink)] text-sm font-bold text-white">
                        <img
                          src={avatarUrl}
                          alt={user?.name || "Profile"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#1f1f1f]">
                          {user?.name}
                        </p>
                        <p className="truncate text-[11px] text-[#9a9a9a]">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/account"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-[#3a3a3a] transition hover:bg-black/[0.02] hover:text-[color:var(--brand)]"
                    >
                      My Account
                    </Link>
                    {user?.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-[#3a3a3a] transition hover:bg-black/[0.02] hover:text-[color:var(--brand)]"
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-[#3a3a3a] transition hover:text-red-500"
                    >
                      <FiLogOut size={14} />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-[#3a3a3a] transition hover:text-[color:var(--brand)]"
                  >
                    <FiUser size={15} />
                    Login / Register
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ), document.body) : null}

      {/* Search overlay */}
      <SearchOverlay isOpen={searchOpen} onClose={closeSearch} />
    </header>
  );
}

