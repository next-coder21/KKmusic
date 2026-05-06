<div align="center">

# KK-lisn

### Kanyakumari VBS Music Streaming Platform

*A full-featured, production-grade music streaming web app — built with React, Vite, and Tailwind CSS*

---

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-black?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion)
[![Howler.js](https://img.shields.io/badge/Howler.js-2.2-green?style=flat-square)](https://howlerjs.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

</div>

---

## What Is This?

KK-lisn is a **Christian music streaming platform** built to archive and stream songs from the Kanyakumari VBS (Vacation Bible School) events spanning 2020–2024. It's designed as a full-stack web product — complete with authentication, playlist management, synchronized lyrics, and a CMS-level admin panel — all served from a single React SPA.

This project was built entirely from scratch as a personal initiative to preserve and make accessible a meaningful music catalog.

> **License Notice:** This codebase is publicly visible for educational and portfolio reference only. It may not be copied, modified, distributed, or used in any project without explicit permission.

---

## Feature Overview

### For Users

| Feature | Description |
|---|---|
| **Music Player** | Full-featured bottom bar player with scrubber, buffering indicator, shuffle, loop, and queue |
| **Synchronized Lyrics** | LRC-format lyrics that scroll in real time with the song |
| **Search** | Instant search across songs, artists, and albums with history and debouncing |
| **Playlists** | Create, rename, and manage personal playlists |
| **Favorites** | Like songs and access them from a dedicated Favorites view |
| **Library** | Unified view of all playlists and liked songs |
| **Browse** | Explore music by Albums, Artists, and Genres |
| **Share** | Share song links via native share API or social copy |
| **Themes** | Two themes — *Musikly* (light, lime-accented) and *Dark* — persisted to localStorage |
| **Responsive UI** | Adaptive layouts for desktop (dockable player) and mobile (overlay player) |

### For Admins

| Feature | Description |
|---|---|
| **Dashboard** | Overview metrics at a glance |
| **Song Management** | Full CRUD for songs in the database |
| **Artist & Album Management** | Manage artist profiles and album entries |
| **User Management** | View and moderate registered users |
| **Lyrics Creator** | In-app LRC editor for adding synchronized lyrics |
| **Announcements & Ads** | Broadcast alerts and manage promotional content |
| **Reports** | View and action user-submitted content reports |
| **Separate Auth** | Admin login with isolated JWT token, independent of user sessions |

---

## Tech Stack

```
Frontend
├── React 19          — UI framework
├── Vite 6            — Build tool with HMR
├── Tailwind CSS 4    — Utility-first styling
├── Framer Motion 12  — Animations and transitions
├── React Router 7    — Client-side routing
├── Howler.js 2.2     — Audio engine (streaming, buffering, controls)
├── Axios 1.8         — HTTP client with auth interceptor
├── Lucide React      — Icon system
└── React Hot Toast   — Toast notification system

State Management
├── UserContext       — Auth state, session, profile
├── PlayerContext     — Queue, current song, playback controls
├── ThemeContext      — Theme switching
└── NotificationsContext — App-wide notification state

Backend (separate repo)
├── Node.js + Express — REST API
├── Render            — Hosting (kkmusicserver.onrender.com)
└── JWT + HttpOnly Cookies — Authentication strategy
```

---

## Architecture

```
src/
├── api/              # API configuration and mock data
├── components/
│   ├── Auth/         # Login and session handling
│   ├── Player/       # Audio player, lyrics panel, share modal
│   ├── Sidebar/      # Nav, topbar, mobile nav, profile editor
│   ├── common/       # ErrorBoundary, modals, loading skeletons
│   ├── music/        # Favorites and playlist components
│   └── searchbar/    # Search input and results
├── context/          # React Context providers (User, Player, Theme, Notifications)
├── pages/
│   ├── Home.jsx      # Trending, new releases, featured artists
│   ├── Search.jsx    # Real-time search page
│   ├── Library.jsx   # User library (playlists + favorites)
│   ├── Albums.jsx
│   ├── Artists.jsx
│   ├── Genres.jsx
│   ├── Settings/
│   └── Admin/        # Full admin CMS panel (12+ pages)
├── services/
│   ├── http.js       # Axios instance — attaches token, handles 401
│   └── ApiService.jsx
├── utils/
│   └── songUtils.js  # Duration formatting and song helpers
├── Router/
│   └── Common.jsx    # Main routing with protected routes and layout
├── config.js         # API base URL and endpoint constants
└── App.jsx           # Root component with all context providers
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A running instance of the backend API (see `.env.example`)

### Local Setup

```bash
# Clone the repository
git clone https://github.com/next-coder21/KK-lisn.git
cd KK-lisn

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL to your backend URL

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_WEBSITE_URL=https://muves.in
```

### Build for Production

```bash
npm run build
# Output in /dist — deploy to Vercel or any static host
```

---

## API Reference

The frontend communicates with the backend via these namespaced endpoints:

| Namespace | Purpose |
|---|---|
| `GET /auth/check-auth` | Validate current session |
| `GET /auth/search?q=` | Search songs, artists, albums |
| `GET /auth/music/songs` | Fetch song catalog |
| `GET /auth/music/songs/:id/lyrics` | Get LRC lyrics for a song |
| `GET /auth/music/stream/:id` | Stream audio (proxied through backend for token resolution) |
| `GET /auth/playlists` | List user playlists |
| `POST /auth/playlists` | Create a playlist |
| `GET /auth/playlists/:id/songs` | Songs within a playlist |
| `POST /admin/*` | Admin endpoints (require `admin_token` in Authorization header) |

> Audio streaming always goes through `/auth/music/stream/:id` — never direct Drive URLs — to allow server-side token resolution.

---

## Design Decisions

**Why Howler.js over the native `<audio>` element?**
Howler provides a consistent, cross-browser API for streaming audio with proper buffering events, which powers the visual buffering indicator in the player scrubber.

**Why React Context over Redux?**
The state topology here — auth, player, theme, notifications — maps cleanly to four isolated contexts with no deep cross-tree dependencies. Redux would be over-engineering for this scope.

**Why a separate admin token?**
Admin sessions carry elevated privileges. Keeping them in a separate localStorage key and separate auth flow means a regular user token can never escalate to admin endpoints, even if intercepted.

**Why Vercel for deployment?**
The `vercel.json` rewrites all routes to `index.html`, making React Router's client-side routing work correctly without a server — zero config needed.

---

## Screenshots

> *Player UI, lyrics sync, and admin panel screenshots can be added here.*

---

## Author

Built by **[@next-coder21](https://github.com/next-coder21)** — a personal project to archive and celebrate the music from Kanyakumari VBS 2020–2024.

---

<div align="center">

*"For educational and portfolio reference only — see license notice above."*

</div>
