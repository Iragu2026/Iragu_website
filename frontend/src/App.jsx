import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import SiteLayout from "./components/SiteLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import AboutUs from "./pages/AboutUs.jsx";
import NewArrivals from "./pages/NewArrivals.jsx";
import Sarees from "./pages/Sarees.jsx";
import Salwars from "./pages/Salwars.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import SearchResults from "./pages/SearchResults.jsx";
import SubCategoryPage from "./pages/SubCategoryPage.jsx";
import SalwarSubCategoryPage from "./pages/SalwarSubCategoryPage.jsx";
import Offers from "./pages/Offers.jsx";
import Checkout from "./pages/Checkout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Account from "./pages/Account.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminProductsSarees from "./pages/admin/AdminProductsSarees.jsx";
import AdminProductsSalwars from "./pages/admin/AdminProductsSalwars.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";
import AdminExchanges from "./pages/admin/AdminExchanges.jsx";
import { checkUserSession } from "./features/user/userSlice.js";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkUserSession());
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        {/* Public pages with SiteLayout (Navbar + Footer) */}
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/new-arrivals" element={<NewArrivals />} />
          <Route path="/sarees" element={<Sarees />} />
          <Route path="/sarees/:subcategory" element={<SubCategoryPage />} />
          <Route path="/salwars" element={<Salwars />} />
          <Route path="/salwars/:subcategory" element={<SalwarSubCategoryPage />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/search" element={<SearchResults />} />
        </Route>

        {/* Admin routes (protected, admin only) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="products/sarees" replace />} />
          <Route path="products/sarees" element={<AdminProductsSarees />} />
          <Route path="products/salwars" element={<AdminProductsSalwars />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="exchanges" element={<AdminExchanges />} />
        </Route>
        <Route
          path="/admin/dashboard"
          element={<Navigate to="/admin" replace />}
        />

        {/* User account (protected) */}
        <Route element={<SiteLayout />}>
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Auth pages (no navbar/footer) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/password/reset/:token" element={<ResetPassword />} />

        {/* Checkout (no navbar/footer, protected) */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/success"
          element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
