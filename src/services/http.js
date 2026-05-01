/**
 * Shared axios instance with:
 *  - withCredentials so HttpOnly cookies are sent (when backend supports it)
 *  - Authorization header from localStorage as fallback (legacy)
 *  - 401 interceptor: clears auth + bounces to /login on session expiry
 *
 * Use this instead of importing axios directly so every request gets
 * consistent auth handling.
 */
import axios from "axios";
import toast from "react-hot-toast";
import { API_CONFIG } from "../config";

const TOKEN_KEY = "token";
const AUTH_FLAG_KEY = "isAuthenticated";

const http = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

/* Attach Bearer token from localStorage (legacy fallback while backend
   migrates to HttpOnly cookies). */
http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* Global 401 handling — clear stale credentials and redirect once. */
let isRedirecting = false;
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;

    if (status === 401 && !isRedirecting) {
      // Don't bounce on /check-auth — that endpoint is *meant* to 401
      // when the user isn't logged in. Let UserContext handle it.
      const url = err.config?.url || "";
      const isAuthCheck = url.includes("/check-auth") || url.includes("/login");

      if (!isAuthCheck) {
        isRedirecting = true;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(AUTH_FLAG_KEY);
        toast.error("Session expired. Please sign in again.");
        // Small delay so the toast is visible before navigation
        setTimeout(() => {
          window.location.href = "/login";
          isRedirecting = false;
        }, 600);
      }
    }

    return Promise.reject(err);
  }
);

export default http;
