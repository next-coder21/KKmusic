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
  timeout: 30000, // 30 s — prevents requests hanging on dead/slow backend
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

/* Global 401 handling — attempt silent token refresh once, then redirect. */
let isRefreshing = false;
let isRedirecting = false;

function clearAuthAndRedirect() {
  if (isRedirecting) return;
  isRedirecting = true;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(AUTH_FLAG_KEY);
  toast.error("Session expired. Please sign in again.");
  setTimeout(() => {
    window.location.href = "/login";
    isRedirecting = false;
  }, 600);
}

http.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status;
    const url = err.config?.url || "";

    // Skip refresh logic for auth endpoints to avoid loops
    const isAuthEndpoint =
      url.includes("/check-auth") ||
      url.includes("/login") ||
      url.includes("/register") ||
      url.includes("/refresh");

    if (status === 401 && !isAuthEndpoint && !err.config?._retried) {
      if (isRefreshing) {
        // Another refresh is in flight — just reject
        return Promise.reject(err);
      }
      isRefreshing = true;
      try {
        await http.post("/auth/refresh", {}, { _retried: true });
        isRefreshing = false;
        // Retry the original request exactly once
        return http({ ...err.config, _retried: true });
      } catch {
        isRefreshing = false;
        clearAuthAndRedirect();
      }
    } else if (status === 401 && !isAuthEndpoint) {
      clearAuthAndRedirect();
    }

    return Promise.reject(err);
  }
);

export default http;
