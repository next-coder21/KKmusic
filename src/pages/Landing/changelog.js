export const CHANGELOG = [
  {
    version: "v0.1.0",
    date: "2026-06-25",
    headline: "Beta Launch — Android App + Production Infrastructure",
    badge: "Beta",
    changes: [
      { type: "added",   text: "Android app released (v0.1.0) — stream music, browse albums, manage playlists, and view synced lyrics on Android." },
      { type: "added",   text: "In-app APK update system — app checks for new versions on startup, downloads in the background with a live progress bar, and triggers the Android installer automatically." },
      { type: "added",   text: "Self-hosted cover art — album and song covers migrated from third-party CDN to the production server. Served from /covers/ with 7-day cache headers." },
      { type: "added",   text: "VBS 2026 Vanthu Paarungal album — all 20 songs live with cover art." },
      { type: "added",   text: "Admin AI Intelligence panel — 4 GROQ models (llama-3.3-70b, llama-3.1-8b, llama-4-scout-17b) running in parallel for platform health, growth outlook, content intelligence, and risk assessment. 6-hour cache with manual refresh." },
      { type: "added",   text: "Admin cover image upload — upload song and album covers directly from the admin panel via multipart form." },
      { type: "added",   text: "Full landing page suite — homepage with live stats, flip feature cards, trending songs, features page, changelog, and contact page." },
      { type: "added",   text: "Offline mode — Android app detects network state and allows browsing local songs without an internet connection." },
      { type: "fixed",   text: "Cover images not loading on Android native builds — switched from React Native Image to expo-image (Glide) which handles external URLs reliably." },
      { type: "fixed",   text: "Login timeout on mobile — .env.local was overriding the production API URL with a local dev machine address." },
      { type: "fixed",   text: "Muves logo replaced — CDN-hosted logo swapped for self-hosted /Muves.png, no more broken logo on the landing page." },
      { type: "fixed",   text: "AI Intelligence 401 errors — GROQ API key was missing from the production server environment." },
      { type: "changed", text: "Backend deployed to self-managed VPS — Nginx reverse proxy, PM2 process manager, SSL via Certbot, custom domain api.lijishwilson.in." },
      { type: "changed", text: "Web frontend deployed to lijishwilson.in/muves/ — self-hosted on VPS alongside backend, no third-party hosting." },
    ],
  },
  {
    version: "v0.0.1",
    date: "2026-06-07",
    headline: "Web Platform Foundation",
    changes: [
      { type: "added",   text: "Music streaming via Google Drive proxy — audio served server-side, raw URLs never exposed to clients." },
      { type: "added",   text: "User registration with security keyword and JWT auth via HttpOnly cookies." },
      { type: "added",   text: "Persistent bottom player bar with queue, shuffle, loop, and full-panel mode." },
      { type: "added",   text: "AI Lyrics Generator — Demucs source separation + Whisper transcription with word-level LRC timestamps." },
      { type: "added",   text: "Synced lyrics display in the player sidebar with scrolling highlight." },
      { type: "added",   text: "Full playlist CRUD — create, rename, delete, reorder tracks, public/private toggle." },
      { type: "added",   text: "Favourites, queue management, and play history — all stored server-side." },
      { type: "added",   text: "Debounced search across songs, artists, and albums with persistent history." },
      { type: "added",   text: "Artist follow/unfollow and album detail pages." },
      { type: "added",   text: "Admin dashboard with full CRUD for songs, artists, albums, users, ads, and announcements." },
      { type: "added",   text: "Ads system — banner ads with impression and click/skip tracking." },
      { type: "added",   text: "Dark theme (muves) and light theme (musikly) — full CSS variable theming." },
      { type: "added",   text: "6-tier rate limiting — separate limits for auth, admin, API, and contact endpoints." },
    ],
  },
];

export const LATEST = "v0.1.0";

export const TAG_STYLES = {
  added:   { bg: "var(--lp-primary-container)",         color: "var(--lp-on-primary-container)",   label: "Added"   },
  fixed:   { bg: "var(--lp-secondary-container)",       color: "var(--lp-on-secondary-container)", label: "Fixed"   },
  changed: { bg: "var(--lp-surface-container-highest)", color: "var(--lp-on-surface)",             label: "Changed" },
  removed: { bg: "var(--lp-tertiary-container)",        color: "var(--lp-on-tertiary-container)",  label: "Removed" },
};
