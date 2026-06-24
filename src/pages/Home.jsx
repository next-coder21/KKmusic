import React, { useEffect, useState, useMemo } from "react";
import http from "../services/http";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, ChevronRight } from "lucide-react";
import { FiHeadphones, FiClock, FiHeart } from "react-icons/fi";
import { useUser } from "../context/UserContext";
import { usePlayer } from "../context/PlayerContext";
import { songDefaults } from "../utils/songUtils";
import AlbumArt from "../components/common/AlbumArt";

/* ─── Skeleton pulse ─────────────────────────────────────── */
const Skeleton = ({ w = "100%", h = 16, r = 8, style = {} }) => (
  <div className="skel" style={{ width: w, height: h, borderRadius: r, background: "var(--skeleton-base, rgba(255,255,255,0.07))", ...style }} />
);

/* ─── Listening stats widget ────────────────────────────── */
function HomeStats({ email }) {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) { setLoading(false); return; }
    let alive = true;
    http.get("/auth/stats")
      .then(r => { if (alive) setStats(r.data); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [email]);

  if (!email) return null;

  const pills = loading
    ? [null, null, null]
    : [
        { icon: FiHeadphones, label: "Plays",    value: stats?.total_listens       ?? 0 },
        { icon: FiClock,      label: "Hours",    value: stats?.listening_time_hrs  != null ? `${Number(stats.listening_time_hrs).toFixed(1)}h` : "0h" },
        { icon: FiHeart,      label: "Favourites", value: stats?.favourites_count   ?? 0 },
      ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 }}
      style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}
      aria-label="Your listening stats"
    >
      {pills.map((pill, i) => (
        <div
          key={i}
          className="home-stat-pill"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 999,
            background: "var(--bg-card, rgba(255,255,255,0.04))",
            border: "1px solid var(--border, rgba(255,255,255,0.07))",
            minWidth: 110,
          }}
        >
          {loading ? (
            <div className="skel" style={{ width: 90, height: 14, borderRadius: 999 }} />
          ) : (
            <>
              <pill.icon size={14} aria-hidden="true" style={{ color: "#C8FF00", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary, #fff)" }}>{pill.value}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted, rgba(255,255,255,0.38))", textTransform: "uppercase", letterSpacing: "0.08em" }}>{pill.label}</span>
            </>
          )}
        </div>
      ))}
    </motion.div>
  );
}

/* ─── Artist row card ────────────────────────────────────── */
const ArtistCard = ({ artist, index, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.18 + index * 0.055 }}
    onClick={onClick}
    className="artist-row"
    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, cursor: "pointer", minWidth: 0, overflow: "hidden" }}
  >
    <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.1)" }}>
      {artist.image_url
        ? <img src={artist.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={artist.name} />
        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "rgba(255,255,255,0.25)" }}>♪</div>
      }
    </div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <p style={{ color: "var(--text-primary, #fff)", fontWeight: 600, fontSize: "0.8rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artist.name}</p>
      <p style={{ color: "var(--text-muted, rgba(255,255,255,0.4))", fontSize: "0.7rem", margin: "2px 0 0", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {artist.song_count ? `${artist.song_count} Tracks` : "Artist"}
      </p>
    </div>
  </motion.div>
);

/* ─── Highlight album card ───────────────────────────────── */
const HighlightCard = ({ song, index, onPlay }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.32 + index * 0.07 }}
    onClick={onPlay}
    className="highlight-card"
    style={{ cursor: "pointer", borderRadius: 14, overflow: "hidden", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
  >
    <div style={{ width: "100%", aspectRatio: "1 / 1", overflow: "hidden", position: "relative", background: "rgba(255,255,255,0.05)" }}>
      <AlbumArt src={song.cover_url} title={song.album_title || song.title} size="100%" radius="0" className="highlight-cover" />
      <div className="highlight-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.52)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0 }}>
        <div className="highlight-play-icon" style={{ width: 34, height: 34, borderRadius: "50%", background: "#C8FF00", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Play size={13} fill="#000" color="#000" />
        </div>
      </div>
    </div>
    <div style={{ padding: "8px 10px 10px" }}>
      <p style={{ color: "var(--text-primary, #fff)", fontWeight: 600, fontSize: "0.75rem", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</p>
      <p style={{ color: "var(--text-secondary, rgba(255,255,255,0.45))", fontSize: "0.65rem", margin: 0, fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.artist_name}</p>
    </div>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════
   MAIN HOME COMPONENT
══════════════════════════════════════════════════════════ */
export default function Home() {
  const { user }    = useUser();
  const { setCurrentSongId, setQueueUpdated, setUserStarted, setIsPlaying, favoritesUpdated } = usePlayer();
  const navigate    = useNavigate();
  const email       = user?.email;
  const firstName   = (user?.name || "").split(" ")[0] || "there";

  const [songs,      setSongs]      = useState([]);
  const [artists,    setArtists]    = useState([]);
  const [history,    setHistory]    = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeAd,   setActiveAd]   = useState(null);
  const [heroIdx,    setHeroIdx]    = useState(0);

  /* ─── Fetch all data ─────────────────────────────────── */
  useEffect(() => {
    let alive = true;
    const fetchAll = async () => {
      try {
        const [songsRes, artistsRes] = await Promise.all([
          http.get("/auth/music/songs"),
          http.get("/auth/music/artists"),
        ]);
        if (alive) { setSongs(songsRes.data || []); setArtists(artistsRes.data || []); }
      } catch {}

      if (email) {
        try { const h = await http.get("/auth/play-history"); if (alive) setHistory(h.data || []); } catch {}
        try {
          const favRes = await http.get("/auth/favourites");
          const ids = favRes.data.favourites || [];
          if (ids.length && alive) {
            const detailed = await Promise.all(
              ids.slice(0, 10).map(id =>
                http.get(`/auth/music/songs/${id}`)
                  .then(r => ({ id, ...r.data }))
                  .catch(() => null)
              )
            );
            if (alive) setFavourites(detailed.filter(Boolean));
          }
        } catch {}
      }
      if (alive) setLoading(false);
    };
    fetchAll();

    if (!sessionStorage.getItem("muve_ad_shown")) {
      http.get("/auth/ads/active")
        .then(res => { if (alive && res.data) setActiveAd(res.data); })
        .catch(() => {});
    }
    return () => { alive = false; };
  }, [email, favoritesUpdated]);

  const closeAd = () => {
    if (activeAd?.id) {
      http.post(`/auth/ads/${activeAd.id}/interaction`, { skipped: true }).catch(() => {});
    }
    setActiveAd(null);
    sessionStorage.setItem("muve_ad_shown", "true");
  };

  const handleAdCtaClick = () => {
    if (activeAd?.id) {
      http.post(`/auth/ads/${activeAd.id}/interaction`, { clicked: true }).catch(() => {});
    }
    closeAd();
  };

  const playSong = (id) => {
    if (!id || !email) return;
    setCurrentSongId(id);
    setUserStarted(true);
    setIsPlaying(true);
    http.post("/auth/queue/add", { songIds: [id], album: false })
      .then(() => setQueueUpdated(p => !p))
      .catch(() => {});
  };

  /* ─── Derived data ───────────────────────────────────── */
  const sortedSongs = useMemo(() => {
    const seen = new Set();
    return [...songs]
      .filter(s => { const id = s.id ?? s._id; if (seen.has(id)) return false; seen.add(id); return true; })
      .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
      .map(songDefaults);
  }, [songs]);

  const heroSongs    = sortedSongs.slice(0, 5);
  const heroSong     = heroSongs[heroIdx] || null;

  const radarArtists = useMemo(() =>
    [...artists].sort((a, b) => (parseInt(b.song_count) || 0) - (parseInt(a.song_count) || 0)).slice(0, 6),
    [artists]
  );

  const mixSongs = useMemo(() => {
    if (history.length > 0) {
      const seen = new Set();
      const unique = history.filter(s => { const id = s.id ?? s._id; if (seen.has(id)) return false; seen.add(id); return true; });
      return unique.slice(0, 10).map(songDefaults);
    }
    return sortedSongs.slice(0, 10);
  }, [history, sortedSongs]);

  /* ─── Auto-advance hero carousel ────────────────────── */
  useEffect(() => {
    if (loading || heroSongs.length === 0) return;
    const t = setInterval(() => setHeroIdx(p => (p + 1) % heroSongs.length), 4500);
    return () => clearInterval(t);
  }, [loading, heroSongs.length]);

  /* ─── Loading skeleton ───────────────────────────────── */
  if (loading) return (
    <div style={{ padding: 0, background: "var(--bg-root, #09090f)", minHeight: "100%" }}>
      <div style={{ marginBottom: 28 }}>
        <Skeleton w="220px" h={34} r={10} style={{ marginBottom: 10 }} />
        <Skeleton w="160px" h={14} r={6} />
      </div>
      <div className="home-main-grid" style={{ marginBottom: 36 }}>
        <Skeleton h={260} r={20} />
        <Skeleton h={260} r={20} />
        <Skeleton h={260} r={20} />
      </div>
      <Skeleton w="180px" h={18} r={8} style={{ marginBottom: 18 }} />
      <div className="highlights-grid">
        {[0,1,2,3].map(i => <Skeleton key={i} h={220} r={14} />)}
      </div>
      <style>{`
        @keyframes skel-pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
        .skel { animation: skel-pulse 1.6s ease-in-out infinite; }
        .home-main-grid { display:grid; grid-template-columns:4fr 2fr 2fr; gap:16px; }
        .highlights-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        @media (max-width:1100px) { .home-main-grid { grid-template-columns:4fr 2fr; } }
        @media (max-width:740px)  { .home-main-grid { grid-template-columns:1fr; } }
      `}</style>
    </div>
  );

  return (
    <div style={{ padding: 0, background: "var(--bg-root, #09090f)", minHeight: "100%" }}>

      {/* ══ AD MODAL ══════════════════════════════════════ */}
      <AnimatePresence>
        {activeAd && (
          <div onClick={closeAd} style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}>
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 32 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              style={{ background: "#0d0d18", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 22, maxWidth: 440, width: "90%", position: "relative", boxShadow: "0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(200,255,0,0.12)" }}
            >
              <div style={{ position: "absolute", top: 14, left: 18, background: "#C8FF00", color: "#000", fontSize: 9, fontWeight: 900, padding: "4px 10px", borderRadius: 20, letterSpacing: "0.14em", zIndex: 2 }}>SPONSORED</div>
              <button
                onClick={closeAd}
                style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2, transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              ><X size={15} /></button>

              {activeAd.banner_image_url && (
                <div style={{ width: "100%", height: 210, overflow: "hidden", borderRadius: "22px 22px 0 0" }}>
                  <img src={activeAd.banner_image_url} alt="Ad" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div style={{ padding: "20px 24px 24px" }}>
                <h2 style={{ fontSize: 19, fontWeight: 900, color: "#fff", margin: "0 0 14px", letterSpacing: "-0.03em", textTransform: "none" }}>{activeAd.title}</h2>
                {activeAd.target_url && (
                  <a
                    href={activeAd.target_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleAdCtaClick}
                    style={{ display: "block", textAlign: "center", padding: "12px", background: "#C8FF00", color: "#000", fontWeight: 900, borderRadius: 10, textDecoration: "none", fontSize: 13, letterSpacing: "0.06em", transition: "opacity 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >Learn More ↗</a>
                )}
                <button onClick={closeAd} aria-label="Dismiss ad" style={{ width: "100%", marginTop: 10, background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.1em" }}>
                  Dismiss ×
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ GREETING ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0 }}
        style={{ marginBottom: 28 }}
      >
        <h1 style={{ fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 800, color: "var(--text-primary, #fff)", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.1, textTransform: "none" }}>
          Hello, <span className="home-greeting-accent" style={{ fontWeight: 900 }}>{firstName}</span>!
        </h1>
        <p style={{ color: "var(--text-secondary, rgba(255,255,255,0.38))", fontSize: "0.85rem", marginTop: 7, fontWeight: 400 }}>
          What do you want to listen to today?
        </p>
      </motion.div>

      {/* ══ YOUR STATS ════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
      >
        <HomeStats email={email} />
      </motion.div>

      {/* ══ MAIN GRID: HERO + ARTISTS ══════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
      <div className="home-main-grid" style={{ marginBottom: 36 }}>

        {/* ── HERO CAROUSEL CARD ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="home-hero-card"
          style={{ borderRadius: 20, overflow: "hidden", position: "relative", minHeight: 220, background: "#1a1a1a", cursor: "pointer" }}
          onClick={() => playSong(heroSong?.id)}
        >
          {/* Album art — fills card, cross-dissolve */}
          <AnimatePresence>
            <motion.div
              key={`img-${heroSong?.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeInOut" }}
              style={{ position: "absolute", inset: 0, zIndex: 1 }}
            >
              <AlbumArt src={heroSong?.cover_url} title={heroSong?.album_title || heroSong?.title} size="100%" radius="0" />
            </motion.div>
          </AnimatePresence>

          {/* Gradient overlay — bottom-up */}
          <div className="home-hero-overlay" style={{ position: "absolute", inset: 0, zIndex: 2, background: "linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.4) 40%, transparent 75%)" }} />
          {/* Gradient overlay — diagonal */}
          <div style={{ position: "absolute", inset: 0, zIndex: 2, background: "linear-gradient(130deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.9) 100%)" }} />

          {/* NEW RELEASE badge — only if released within the last 30 days */}
          {heroSong?.release_date && (new Date() - new Date(heroSong.release_date)) / (1000 * 60 * 60 * 24) < 30 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              style={{ position: "absolute", top: 16, left: 16, zIndex: 4, background: "#C8FF00", color: "#000", fontSize: 9, fontWeight: 900, padding: "5px 13px", borderRadius: 20, letterSpacing: "0.15em" }}
            >
              ✦ NEW RELEASE
            </motion.div>
          )}

          {/* Carousel dots */}
          <div style={{ position: "absolute", top: 20, right: 16, zIndex: 4, display: "flex", gap: 5, alignItems: "center" }}>
            {heroSongs.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setHeroIdx(i); }}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width: i === heroIdx ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === heroIdx ? "#C8FF00" : "rgba(255,255,255,0.3)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.3s ease"
                }}
              />
            ))}
          </div>

          {/* Bottom info */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 22px 22px", zIndex: 4 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`info-${heroSong?.id}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.32 }}
              >
                <h2 style={{ color: "#fff", fontSize: "clamp(1.15rem,2.2vw,1.5rem)", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.02em", lineHeight: 1.2, textShadow: "0 2px 30px rgba(0,0,0,0.5)", textTransform: "none" }}>
                  {heroSong?.title}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.82rem", margin: "0 0 18px", fontWeight: 500 }}>
                  {heroSong?.artist_name}
                  <span style={{ marginLeft: 10, color: "#C8FF00", opacity: 0.8, fontSize: "0.72rem", fontWeight: 600 }}>#{heroIdx + 1} Trending</span>
                </p>
              </motion.div>
            </AnimatePresence>

            <button
              onClick={e => { e.stopPropagation(); playSong(heroSong?.id); }}
              className="hero-play-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", background: "#fff", color: "#000", border: "none", borderRadius: 30, fontWeight: 800, fontSize: 12, cursor: "pointer", letterSpacing: "0.05em" }}
            >
              <Play size={14} fill="currentColor" />
              Play
            </button>
          </div>
        </motion.div>

        {/* ── YOUR TOP ARTISTS ── */}
        <motion.div
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="home-side-card"
          style={{ background: "var(--bg-card, rgba(255,255,255,0.04))", borderRadius: 20, padding: "18px 14px 14px", border: "1px solid var(--border, rgba(255,255,255,0.07))", display: "flex", flexDirection: "column" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ color: "var(--text-primary, #fff)", fontWeight: 700, fontSize: "1rem", margin: 0, letterSpacing: "-0.01em", textTransform: "none" }}>Your Top Artists</h3>
            <button
              onClick={() => navigate("/artists")}
              className="see-more-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--text-muted, rgba(255,255,255,0.4))", fontSize: "0.75rem", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}
            >
              See More <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
            {radarArtists.length === 0 ? (
              <p style={{ color: "var(--text-muted, rgba(255,255,255,0.35))", fontSize: "12px", padding: "12px 0", textAlign: "center" }}>
                Play some songs to see your top artists
              </p>
            ) : radarArtists.map((artist, i) => (
              <ArtistCard key={artist.id} artist={artist} index={i} onClick={() => navigate("/artists")} />
            ))}
          </div>
        </motion.div>

        {/* ── FAVOURITES ── */}
        <motion.div
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="home-side-card"
          style={{ background: "var(--bg-card, rgba(255,255,255,0.04))", borderRadius: 20, padding: "18px 14px 14px", border: "1px solid var(--border, rgba(255,255,255,0.07))", display: "flex", flexDirection: "column", minHeight: 0 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ color: "var(--text-primary, #fff)", fontWeight: 700, fontSize: "1rem", margin: 0, letterSpacing: "-0.01em", textTransform: "none" }}>Favourites</h3>
            <button
              onClick={() => navigate("/favorites")}
              className="see-more-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--text-muted, rgba(255,255,255,0.4))", fontSize: "0.75rem", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}
            >
              See More <ChevronRight size={13} />
            </button>
          </div>

          <div className="fav-scroll">
            {favourites.length === 0 ? (
              <p style={{ color: "var(--text-muted, rgba(255,255,255,0.3))", fontSize: "0.75rem", margin: 0, padding: "8px 0" }}>No favourites yet</p>
            ) : favourites.map((song, i) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                onClick={() => playSong(song.id)}
                className="fav-row"
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 8px", borderRadius: 9, cursor: "pointer" }}
              >
                <AlbumArt src={song.cover_url} title={song.album_title || song.title} size={34} radius="7px" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ color: "var(--text-primary, #fff)", fontWeight: 600, fontSize: "0.75rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</p>
                  <p style={{ color: "var(--text-muted, rgba(255,255,255,0.4))", fontSize: "0.65rem", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.artist_name}</p>
                </div>
                <Play size={12} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      </motion.div>

      {/* ══ LISTENING HIGHLIGHTS ══════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.32 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ color: "var(--text-primary, #fff)", fontWeight: 700, fontSize: "1rem", margin: 0, letterSpacing: "-0.01em", textTransform: "none" }}>Listening Highlights</h3>
          <button
            onClick={() => navigate("/search")}
            className="see-more-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--text-muted, rgba(255,255,255,0.4))", fontSize: "0.75rem", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}
          >
            See More <ChevronRight size={13} />
          </button>
        </div>

        <div className="highlights-grid-wrap">
          {mixSongs.map((song, i) => (
            <div key={song.id} style={{ width: "100%" }}>
              <HighlightCard song={song} index={i} onPlay={() => playSong(song.id)} />
            </div>
          ))}
        </div>
      </motion.section>

      {/* ══ STYLES ════════════════════════════════════════ */}
      <style>{`
        @keyframes skel-pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
        .skel { background: var(--skeleton-base, rgba(255,255,255,0.07)); border-radius: 8px; animation: skel-pulse 1.6s ease-in-out infinite; }

        /* ── Layout grids ── */
        .home-main-grid {
          display: grid;
          grid-template-columns: 4fr 2fr 2fr;
          gap: 16px;
          align-items: stretch;
        }
        .fav-scroll {
          flex: 1;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(200,255,0,0.25) transparent;
          max-height: 320px;
        }
        .fav-scroll::-webkit-scrollbar { width: 3px; }
        .fav-scroll::-webkit-scrollbar-thumb { background: rgba(200,255,0,0.25); border-radius: 2px; }
        .fav-row { transition: background 0.18s; }
        .fav-row:hover { background: rgba(200,255,0,0.07) !important; }
        /* ── Highlights responsive grid ── */
        .highlights-grid-wrap {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 14px;
        }
        @media (max-width: 1200px) { .highlights-grid-wrap { grid-template-columns: repeat(5, 1fr); } }
        @media (max-width: 900px)  { .highlights-grid-wrap { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 640px)  { .highlights-grid-wrap { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 480px)  { .highlights-grid-wrap { grid-template-columns: repeat(2, 1fr); } }

        /* ── Hero play button ── */
        .hero-play-btn { transition: background 0.2s, transform 0.18s, box-shadow 0.2s; }
        .hero-play-btn:hover { background: #C8FF00 !important; transform: scale(1.05); box-shadow: 0 6px 24px rgba(200,255,0,0.4); }
        .hero-play-btn:active { transform: scale(0.96); }

        /* ── See More links ── */
        .see-more-btn { transition: color 0.18s; }
        .see-more-btn:hover { color: #C8FF00 !important; }

        /* ── Artist rows ── */
        .artist-row { transition: background 0.18s; border-radius: 10px; }
        .artist-row:hover { background: rgba(200,255,0,0.07) !important; }

        /* ── Highlight cards ── */
        .highlight-card { transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s; }
        .highlight-card:hover { transform: translateY(-6px); box-shadow: 0 18px 45px rgba(0,0,0,0.6); border-color: rgba(255,255,255,0.12) !important; }
        .highlight-card:hover .highlight-overlay { opacity: 1 !important; }
        .highlight-card:hover .highlight-cover { transform: scale(1.06); transition: transform 0.35s ease; }
        .highlight-overlay { transition: opacity 0.2s; }
        .highlight-play-icon { transform: scale(0.8); transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        .highlight-card:hover .highlight-play-icon { transform: scale(1) !important; }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .home-main-grid { grid-template-columns: 1fr 1fr; }
          .home-main-grid > :first-child { grid-column: 1 / -1; }
        }
        @media (max-width: 740px) {
          .home-main-grid { grid-template-columns: 1fr; }
        }

        /* Light theme overrides for home page */
        [data-theme="musikly"] .home-main-grid > *:last-child {
          background: rgba(0,0,0,0.03) !important;
          border-color: rgba(0,0,0,0.08) !important;
        }
        [data-theme="musikly"] .highlight-card {
          background: rgba(0,0,0,0.03) !important;
          border-color: rgba(0,0,0,0.08) !important;
        }
        [data-theme="musikly"] .highlight-card:hover {
          box-shadow: 0 18px 45px rgba(0,0,0,0.15) !important;
        }
        [data-theme="musikly"] .artist-row:hover { background: rgba(0,0,0,0.05) !important; }
        [data-theme="musikly"] .see-more-btn:hover { color: #4a7c00 !important; }
        [data-theme="musikly"] .hero-play-btn:hover { background: #C8FF00 !important; }
        [data-theme="musikly"] .home-stat-pill span:last-child { color: rgba(0,0,0,0.4) !important; }
        .home-stat-pill { transition: border-color 0.18s; }
        .home-stat-pill:hover { border-color: rgba(200,255,0,0.35) !important; }

        /* ── Task 1: Greeting accent ── */
        .home-greeting-accent { color: var(--accent, #C8FF00); }
        [data-theme="musikly"] .home-greeting-accent { color: #4a7c00 !important; }

        /* ── Task 3: Hero card light-theme ── */
        .home-hero-card { transition: box-shadow 0.3s ease; }
        [data-theme="musikly"] .home-hero-card {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%) !important;
          box-shadow: 0 8px 40px rgba(0,0,0,0.18);
        }
        [data-theme="musikly"] .home-hero-overlay {
          background: linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 50%, rgba(26,26,46,0.5) 100%) !important;
        }

        /* ── Task 4: Side cards depth and hover lift ── */
        .home-side-card { transition: box-shadow 0.25s ease, transform 0.25s ease; }
        .home-side-card:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(0,0,0,0.35); }
        [data-theme="musikly"] .home-side-card {
          background: #ffffff !important;
          border: 1px solid rgba(0,0,0,0.08) !important;
          box-shadow: 0 2px 16px rgba(0,0,0,0.07);
        }
        [data-theme="musikly"] .home-side-card:hover { box-shadow: 0 10px 32px rgba(0,0,0,0.13) !important; }

        /* ── Task 7: Stat pill icon light-theme ── */
        [data-theme="musikly"] .home-stat-pill svg { color: #4a7c00 !important; }
        [data-theme="musikly"] .home-stat-pill { background: rgba(74,124,0,0.08) !important; border-color: rgba(74,124,0,0.2) !important; }
      `}</style>
    </div>
  );
}
