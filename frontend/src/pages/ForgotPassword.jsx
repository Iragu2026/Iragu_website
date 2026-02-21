import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  forgotPassword,
  clearUserError,
  clearForgotPasswordMessage,
} from "../features/user/userSlice.js";
import usePageTitle from "../hooks/usePageTitle.js";
import "../pageStyles/Auth.css";

export default function ForgotPassword() {
  usePageTitle("Forgot Password");
  const dispatch = useDispatch();

  const { forgotPasswordLoading, forgotPasswordMessage, error } = useSelector(
    (s) => s.user
  );

  const [email, setEmail] = useState("");

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearUserError());
    }
  }, [error, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(clearForgotPasswordMessage());
      dispatch(clearUserError());
    };
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    dispatch(forgotPassword(email.trim()));
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <Link to="/">
            <div className="auth-logo-wrapper">
              <img src="/images/logo.png" alt="Iragu For Her" />
            </div>
          </Link>
        </div>

        <h1 className="auth-title">Forgot Password</h1>
        <p className="auth-subtitle">
          Enter your email and we'll send you a link to reset your password
        </p>

        {forgotPasswordMessage && (
          <div className="auth-success-box">
            <p>{forgotPasswordMessage}</p>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="forgot-email">Email Address</label>
            <input
              id="forgot-email"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
             name="forgot-email" aria-label="Enter your registered email" />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={forgotPasswordLoading}
          >
            {forgotPasswordLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="auth-footer">
          Remember your password?{" "}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
