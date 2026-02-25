import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Wraps a route so only authenticated users can access it.
 * If user is not logged in, redirects to /login?redirect=<current-path>.
 * If adminOnly is true, also checks user.role === "admin".
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, loading, user, authChecked } = useSelector((s) => s.user);
  const location = useLocation();

  // Wait for initial session bootstrap before deciding redirects.
  if (!authChecked || loading) return null;

  if (!isAuthenticated) {
    const redirectTo = location.pathname === "/" ? "" : location.pathname.slice(1);
    return (
      <Navigate
        to={redirectTo ? `/login?redirect=${redirectTo}` : "/login"}
        replace
      />
    );
  }

  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
