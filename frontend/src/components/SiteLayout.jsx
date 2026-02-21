import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import CartDrawer from "./CartDrawer.jsx";

export default function SiteLayout() {
  const location = useLocation();
  const routeKey = location.pathname + location.search;

  // Scroll to top on every route change (including query string changes)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [routeKey]);

  return (
    <div className="min-h-dvh bg-[#fbf7f0]">
      <Navbar />
      <main key={routeKey} className="page-fade-in">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
