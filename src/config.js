/**
 * Frontend runtime config.
 *
 * Override via .env.local (dev) or your hosting env panel (prod):
 *   VITE_API_BASE_URL — base URL of the KKaudioBk backend
 *   VITE_WEBSITE_URL  — URL of the muveswb marketing site
 *
 * The fallback URLs below are safe production defaults so the app
 * still boots if env vars are missing, but every environment SHOULD
 * set these explicitly.
 */
const FALLBACK_API  = "https://kkmusicserver.onrender.com";
const FALLBACK_SITE = "https://muves.in";

const BASE_URL =
  (import.meta.env?.VITE_API_BASE_URL ?? FALLBACK_API).replace(/\/+$/, "");

export const API_CONFIG = {
  BASE_URL,
  AUTH_URL:   `${BASE_URL}/auth`,
  MUSIC_URL:  `${BASE_URL}/auth/music`,
  QUEUE_URL:  `${BASE_URL}/auth/queue`,
  STREAM_URL: `${BASE_URL}/auth/music/stream`,
  ADMIN_URL:  `${BASE_URL}/admin`,
};

export const WEBSITE_URL =
  import.meta.env?.VITE_WEBSITE_URL ?? FALLBACK_SITE;
