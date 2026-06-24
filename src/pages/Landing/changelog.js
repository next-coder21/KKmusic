export const CHANGELOG = [
  {
    version: "v1.0.0",
    date: "2026-06-07",
    headline: "Initial Launch — Muves is Live!",
    changes: [
      { type: "added",   text: "Music streaming via Google Drive proxy — audio served server-side, raw URLs never exposed." },
      { type: "added",   text: "User registration with security keyword and JWT auth via HTTP-only cookies with refresh token rotation." },
      { type: "added",   text: "Persistent bottom player bar with queue, shuffle, loop, and undock-to-full-panel mode." },
      { type: "added",   text: "AI Lyrics Generator — Groq Whisper transcription with two-pass hallucination filtering and word-level LRC timestamps." },
      { type: "added",   text: "Synced lyrics display in the player sidebar with scrolling highlight." },
      { type: "added",   text: "Full playlist CRUD — create, rename, delete, reorder tracks, public/private toggle." },
      { type: "added",   text: "Favourites, queue management, and play history — all stored server-side." },
      { type: "added",   text: "Debounced search across songs, artists, and albums with persistent search history." },
      { type: "added",   text: "Artist follow/unfollow and album detail pages." },
      { type: "added",   text: "Listening stats dashboard — total listens, hours, top genres, daily breakdown." },
      { type: "added",   text: "Session management — view and revoke active login sessions by device." },
      { type: "added",   text: "Admin dashboard with full song, artist, album, and user CRUD." },
      { type: "added",   text: "Admin announcement system with email delivery, scheduling, and in-app notifications." },
      { type: "added",   text: "Ads system — banner ads with impression and click/skip tracking." },
      { type: "added",   text: "Dark theme (muves) and light theme (musikly) via CSS variables." },
      { type: "added",   text: "Landing page with live platform stats, top-played chart, features overview, and changelog." },
      { type: "added",   text: "Mobile app under development — Android APK coming soon." },
    ],
  },
];

export const LATEST = "v1.0.0";

export const TAG_STYLES = {
  added:   { bg: "var(--lp-primary-container)",         color: "var(--lp-on-primary-container)",   label: "Added"   },
  fixed:   { bg: "var(--lp-secondary-container)",       color: "var(--lp-on-secondary-container)", label: "Fixed"   },
  changed: { bg: "var(--lp-surface-container-highest)", color: "var(--lp-on-surface)",             label: "Changed" },
  removed: { bg: "var(--lp-tertiary-container)",        color: "var(--lp-on-tertiary-container)",  label: "Removed" },
};
