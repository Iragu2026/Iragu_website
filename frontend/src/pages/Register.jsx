import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiEye, FiEyeOff } from "react-icons/fi";
import toast from "react-hot-toast";
import { registerUser, clearUserError, clearRegisterSuccess } from "../features/user/userSlice.js";
import usePageTitle from "../hooks/usePageTitle.js";
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from "../utils/passwordPolicy.js";
import "../pageStyles/Auth.css";

export default function Register() {
  usePageTitle("Create Account");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const { loading, error, registerSuccess } = useSelector((s) => s.user);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // On successful registration: show toast, then redirect to login after 2s
  useEffect(() => {
    if (!registerSuccess) return;
    toast.success("Account created successfully");
    const t = setTimeout(() => {
      navigate(redirect !== "/" ? `/login?redirect=${redirect}` : "/login", {
        replace: true,
      });
      dispatch(clearRegisterSuccess());
    }, 2000);
    return () => clearTimeout(t);
  }, [registerSuccess, navigate, redirect, dispatch]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearUserError());
    }
  }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (name.trim().length < 4) {
      toast.error("Name must be at least 4 characters");
      return;
    }
    if (!isStrongPassword(password)) {
      toast.error(PASSWORD_POLICY_MESSAGE);
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    dispatch(registerUser({ name: name.trim(), email: email.trim(), password }));
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

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">
          Join Iragu For Her for an exclusive shopping experience
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
             name="reg-name" aria-label="Enter your full name" />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
             name="reg-email" aria-label="Enter your email" />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
             name="reg-password" aria-label="Create a strong password" />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>

          <div className="auth-field">
            <label htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
             name="reg-confirm" aria-label="Re-enter your password" />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <Link
            to={
              redirect !== "/"
                ? `/login?redirect=${redirect}`
                : "/login"
            }
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
