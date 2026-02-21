import axios from "axios";

const configuredBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

const axiosInstance = axios.create({
  // Production: set VITE_API_BASE_URL (e.g. https://api.example.com).
  // Local dev: keep empty and Vite proxy will forward /api requests.
  baseURL: configuredBaseUrl,
  withCredentials: true, // send cookies for JWT auth
  headers: { "Content-Type": "application/json" },
});

export default axiosInstance;
