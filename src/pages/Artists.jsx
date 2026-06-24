/**
 * Artists page  —  /artists
 *
 * Design spec:
 *  - Circular avatars, lime glow ring + scale on hover
 *  - Radial aura behind each circle (intensifies on hover)
 *  - Framer Motion whileHover on every card
 *  - Responsive grid: 6 col > 1200 px, 4 col tablet, 3 col mobile
 *  - Stats strip: artist count, total tracks, most-popular artist
 *  - Circular skeleton loaders while fetching
 *  - Empty state with Mic2 icon when search yields nothing
 *  - Click: add all artist songs to queue and start playback
 *  - Full CSS variable usage; musikly contrast overrides live in index.css
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic2, Search, Play, TrendingUp } from "lucide-react";
import { FiCheck, FiPlus, FiUserX } from "react-icons/fi";
import http from "../services/http";
import { usePlayer } from "../context/PlayerContext";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

const SORTS = ["A–Z", "Z–A", "Most Tracks"];

/* ─────────────────────────────────────────────────────────────
   CIRCULAR SKELETON CARD
   Uses .artists-skeleton-circle + .artists-skeleton-line
   defined in index.css — resolves --skeleton-base/shine per theme.
───────────────────────────────────────────────────────────── */
function ArtistSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0" }}>
      {/* Circle */}
      <div
        className="artists-skeleton-circle"
        style={{ width: 130, height: 130, flexShrink: 0 }}
      />
      {/* Name line */}
      <div
        className="artists-skeleton-line"
        style={{ height: 13, width: "70%", maxWidth: 90 }}
      />
      {/* Badge line */}
      <div
        className="artists-skeleton-line"
        style={{ height: 10, width: "45%", maxWidth: 60 }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ARTIST CARD
   Self-contained so Framer Motion layout animation works cleanly.
   The aura div sits behind the avatar via z-index layering.
───────────────────────────────────────────────────────────── */
function FollowButton({ artistId, theme, isFollowing }) {
  const [localFollowing, setLocalFollowing] = useState(isFollowing);
  const [hovered, setHovered] = useState(false);

  const accentColor  = theme === "musikly" ? "#4a7c00" : "#C8FF00";
  const accentText   = theme === "musikly" ? "#fff"    : "#000";

  const handleClick = async (e) => {
    e.stopPropagation();
    const wasFollowing = localFollowing;
    // Optimistic update
    setLocalFollowing(!wasFollowing);
    try {
      if (wasFollowing) {
        await http.delete(`/auth/artists/${artistId}/follow`);
      } else {
        await http.post(`/auth/artists/${artistId}/follow`);
      }
    } catch {
      // Revert on error
      setLocalFollowing(wasFollowing);
    }
  };

  if (localFollowing) {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={hovered ? "Unfollow" : "Following"}
        aria-label={hovered ? `Unfollow ${artistId}` : `Following ${artistId}`}
        className="artist-follow-btn artist-follow-btn--following"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "5px 13px",
          borderRadius: 999,
          fontSize: 10,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          cursor: "pointer",
          border: "none",
          background: hovered ? "rgba(239,68,68,0.12)" : accentColor,
          color: hovered ? "#ef4444" : accentText,
          transition: "background 0.18s, color 0.18s",
          fontFamily: "inherit",
        }}
      >
        {hovered
          ? <><FiUserX size={11} aria-hidden="true" /> UNFOLLOW</>
          : <><FiCheck size={11} aria-hidden="true" /> FOLLOWING</>
        }
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Follow"
      aria-label={`Follow ${artistId}`}
      className="artist-follow-btn"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 13px",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        cursor: "pointer",
        background: "transparent",
        color: accentColor,
        border: `1.5px solid ${accentColor}`,
        transition: "background 0.18s, color 0.18s, box-shadow 0.18s",
        fontFamily: "inherit",
        boxShadow: hovered ? `0 0 10px ${accentColor}44` : "none",
      }}
    >
      <FiPlus size={11} aria-hidden="true" /> FOLLOW
    </button>
  );
}

function ArtistCard({ artist, index, onPlay, theme, isFollowing }) {
  const [hovered, setHovered] = useState(false);

  // Lime is unreadable on musikly (#f5f6fa); use dark-green accent instead.
  const limeColor = theme === "musikly" ? "#4a7c00" : "#C8FF00";
  const limeRing  = theme === "musikly"
    ? "0 0 0 3px #4a7c00"
    : "0 0 0 3px #C8FF00";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.28, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onPlay}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "12px 8px 16px",
        cursor: "pointer",
        borderRadius: 16,
        background: hovered
          ? "var(--bg-card-hover, rgba(255,255,255,0.06))"
          : "transparent",
        transition: "background 0.2s ease",
        position: "relative",
      }}
    >
      {/* Radial aura glow — sits below avatar */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -60%)",
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: hovered
            ? "radial-gradient(circle, rgba(200,255,0,0.22) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(200,255,0,0.07) 0%, transparent 65%)",
          transition: "background 0.3s ease",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Avatar wrapper — enforces circle + overflow clip */}
      <div
        style={{
          position: "relative",
          width: 130,
          height: 130,
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        {/* Circle image or fallback */}
        <motion.div
          animate={{
            scale: hovered ? 1.06 : 1,
            boxShadow: hovered
              ? `${limeRing}, 0 8px 32px rgba(0,0,0,0.45)`
              : "0 2px 12px rgba(0,0,0,0.3)",
          }}
          transition={{ type: "spring", stiffness: 340, damping: 24 }}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            overflow: "hidden",
            background: "var(--bg-card, rgba(255,255,255,0.05))",
          }}
        >
          {artist.image_url ? (
            <img
              src={artist.image_url}
              alt={artist.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "filter 0.3s ease",
                filter: hovered ? "none" : "grayscale(20%)",
              }}
              onError={e => { e.target.style.display = "none"; }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Mic2
                size={40}
                style={{ color: "var(--text-muted, rgba(255,255,255,0.3))" }}
              />
            </div>
          )}
        </motion.div>

        {/* Play overlay — visible on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.38)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: limeColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 20px ${limeColor}88`,
                }}
              >
                <Play size={18} fill="#000" color="#000" style={{ marginLeft: 2 }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Artist name */}
      <p
        className={
          hovered
            ? "artists-card-name artists-card-name--hovered"
            : "artists-card-name"
        }
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%",
          color: hovered
            ? limeColor
            : "var(--text-primary, #ffffff)",
          transition: "color 0.18s ease",
          zIndex: 1,
          position: "relative",
        }}
      >
        {artist.name}
      </p>

      {/* Track count badge */}
      <span
        className="artists-track-badge"
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          padding: "3px 10px",
          borderRadius: 999,
          background: "var(--bg-card, rgba(255,255,255,0.06))",
          border: "1px solid var(--border, rgba(255,255,255,0.08))",
          color: "var(--text-secondary, rgba(255,255,255,0.55))",
          zIndex: 1,
          position: "relative",
        }}
      >
        {artist.song_count || 0} tracks
      </span>

      {/* Follow button */}
      <div style={{ zIndex: 1, position: "relative" }}>
        <FollowButton artistId={artist.id} theme={theme} isFollowing={isFollowing} />
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE COMPONENT
───────────────────────────────────────────────────────────── */
export default function Artists() {
  const { setCurrentSongId, setQueueUpdated, setUserStarted, setIsPlaying } =
    usePlayer();
  const { user } = useUser();
  const { theme } = useTheme();
  const email = user?.email;

  const [artists, setArtists]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort]           = useState("Most Tracks");
  const [followedIds, setFollowedIds] = useState(new Set());

  /* ── Fetch followed artist IDs (once per page load) ── */
  useEffect(() => {
    if (!user?.email) return;
    http.get("/auth/following/artists")
      .then(r => {
        const ids = (r.data || []).map(a => a.id ?? a.artist_id);
        setFollowedIds(new Set(ids));
      })
      .catch(() => {});
  }, [user?.email]);

  /* ── Fetch artists ── */
  useEffect(() => {
    http.get("/auth/music/artists")
      .then(r => setArtists(r.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  /* ── Derived data ── */
  const totalTracks = useMemo(
    () => artists.reduce((acc, a) => acc + (parseInt(a.song_count) || 0), 0),
    [artists]
  );

  const mostPopular = useMemo(() => {
    if (!artists.length) return null;
    return [...artists].sort(
      (a, b) => (parseInt(b.song_count) || 0) - (parseInt(a.song_count) || 0)
    )[0];
  }, [artists]);

  const filtered = useMemo(() => {
    let list = artists.filter(a =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (sort === "A–Z")
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "Z–A")
      list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    else
      list = [...list].sort(
        (a, b) => (parseInt(b.song_count) || 0) - (parseInt(a.song_count) || 0)
      );
    return list;
  }, [artists, searchTerm, sort]);

  /* ── Queue handler ── */
  const playSongsByArtist = async artistId => {
    if (!email) return;
    try {
      const res = await http.get("/auth/music/songs", { params: { artist_id: artistId } });
      const artistSongs = res.data || [];
      if (!artistSongs.length) return;
      setCurrentSongId(artistSongs[0].id);
      setUserStarted(true);
      setIsPlaying(true);
      http.post("/auth/queue/add", { songIds: artistSongs.map(s => s.id), album: true })
        .then(() => setQueueUpdated(p => !p))
        .catch(() => {});
    } catch (err) {
      console.error("playSongsByArtist:", err);
    }
  };

  /* ── Sort button accent ── */
  const sortActiveBg    = theme === "musikly" ? "#4a7c00" : "#C8FF00";
  const sortActiveTxt   = theme === "musikly" ? "#ffffff" : "#000000";
  const sortIdleBg      = "var(--bg-input, rgba(255,255,255,0.07))";
  const sortIdleTxt     = "var(--text-secondary, rgba(255,255,255,0.6))";
  const sortIdleBorder  = "var(--border, rgba(255,255,255,0.08))";

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", minHeight: "80vh" }}>

      {/* ══════════════════════════════
          PAGE HEADER
      ══════════════════════════════ */}
      <div style={{ marginBottom: 36 }}>

        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 10,
          }}
        >
          <Mic2
            size={13}
            className="artists-eyebrow"
            style={{ color: "var(--accent, #C8FF00)", flexShrink: 0 }}
          />
          <span
            className="artists-eyebrow"
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              color: "var(--accent, #C8FF00)",
            }}
          >
            Artist Roster
          </span>
        </div>

        {/* Heading row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 8,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: "var(--text-primary, #ffffff)",
            }}
          >
            Dis&shy;cover{" "}
            <span
              className="artists-accent-span"
              style={{
                color: "var(--accent, #C8FF00)",
                textShadow: "0 0 28px rgba(200,255,0,0.35)",
              }}
            >
              Artists
            </span>
          </h1>

          {/* Subtitle */}
          {!loading && (
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-secondary, rgba(255,255,255,0.55))",
                letterSpacing: "0.01em",
              }}
            >
              {artists.length} artists &middot; {totalTracks} tracks
            </p>
          )}
        </div>

        {/* Search + Sort controls */}
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 28,
          }}
        >
          {/* Search input */}
          <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 280 }}>
            <Search
              size={13}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted, rgba(255,255,255,0.35))",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search artists..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="artists-search-input"
              style={{
                width: "100%",
                background: "var(--bg-input, rgba(255,255,255,0.07))",
                border: "1px solid var(--border, rgba(255,255,255,0.08))",
                borderRadius: 10,
                padding: "9px 14px 9px 34px",
                color: "var(--text-primary, #ffffff)",
                fontSize: 12,
                fontWeight: 500,
                fontFamily: "inherit",
                outline: "none",
                transition: "border-color 0.18s ease, background 0.18s ease",
              }}
              onFocus={e => {
                e.target.style.borderColor = "rgba(200,255,0,0.4)";
                e.target.style.background =
                  "var(--bg-card-hover, rgba(255,255,255,0.10))";
              }}
              onBlur={e => {
                e.target.style.borderColor =
                  "var(--border, rgba(255,255,255,0.08))";
                e.target.style.background =
                  "var(--bg-input, rgba(255,255,255,0.07))";
              }}
            />
          </div>

          {/* Sort pills */}
          <div style={{ display: "flex", gap: 6 }}>
            {SORTS.map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={sort === s ? "artists-sort-btn--active" : undefined}
                style={{
                  padding: "8px 14px",
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  cursor: "pointer",
                  borderRadius: 8,
                  border: sort === s ? "none" : `1px solid ${sortIdleBorder}`,
                  background: sort === s ? sortActiveBg : sortIdleBg,
                  color: sort === s ? sortActiveTxt : sortIdleTxt,
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        {!loading && (
          <div
            style={{
              display: "flex",
              gap: 0,
              paddingTop: 20,
              borderTop: "1px solid var(--border, rgba(255,255,255,0.08))",
              flexWrap: "wrap",
            }}
          >
            {/* Artists count */}
            <div style={{ flex: "0 0 auto", paddingRight: 40 }}>
              <p
                className="artists-stat-value"
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 900,
                  color: "var(--text-primary, #ffffff)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                {artists.length}
              </p>
              <p
                className="artists-stat-label"
                style={{
                  margin: "4px 0 0",
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: "var(--text-muted, rgba(255,255,255,0.35))",
                }}
              >
                Artists
              </p>
            </div>

            {/* Divider */}
            <div
              style={{
                width: 1,
                alignSelf: "stretch",
                background: "var(--border, rgba(255,255,255,0.08))",
                margin: "0 32px",
                flexShrink: 0,
              }}
            />

            {/* Total tracks */}
            <div style={{ flex: "0 0 auto", paddingRight: 40 }}>
              <p
                className="artists-stat-value"
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 900,
                  color: "var(--text-primary, #ffffff)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                {totalTracks}
              </p>
              <p
                className="artists-stat-label"
                style={{
                  margin: "4px 0 0",
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: "var(--text-muted, rgba(255,255,255,0.35))",
                }}
              >
                Total Tracks
              </p>
            </div>

            {/* Divider */}
            {mostPopular && (
              <div
                style={{
                  width: 1,
                  alignSelf: "stretch",
                  background: "var(--border, rgba(255,255,255,0.08))",
                  margin: "0 32px",
                  flexShrink: 0,
                }}
              />
            )}

            {/* Most popular */}
            {mostPopular && (
              <div style={{ flex: "0 0 auto", display: "flex", alignItems: "flex-start", gap: 8 }}>
                <TrendingUp
                  size={14}
                  style={{
                    color: "var(--accent, #C8FF00)",
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <p
                    className="artists-most-popular-val"
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 800,
                      color: "var(--accent, #C8FF00)",
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                      maxWidth: 160,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {mostPopular.name}
                  </p>
                  <p
                    className="artists-stat-label"
                    style={{
                      margin: "4px 0 0",
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: "var(--text-muted, rgba(255,255,255,0.35))",
                    }}
                  >
                    Most Popular
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════
          GRID / SKELETON / EMPTY STATE
      ══════════════════════════════ */}
      {loading ? (
        /* Skeleton grid — circular pulses */
        <div className="artists-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <ArtistSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            textAlign: "center",
            padding: "80px 24px",
            border: "1px solid var(--border, rgba(255,255,255,0.08))",
            borderRadius: 18,
            background: "var(--bg-card, rgba(255,255,255,0.03))",
          }}
        >
          <Mic2
            size={52}
            style={{
              color: "var(--text-muted, rgba(255,255,255,0.2))",
              marginBottom: 20,
              display: "inline-block",
            }}
          />
          <h2
            className="artists-empty-heading"
            style={{
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              margin: "0 0 10px",
              fontSize: 18,
              color: "var(--text-primary, #ffffff)",
            }}
          >
            No Artists Found
          </h2>
          <p
            className="artists-empty-body"
            style={{
              fontWeight: 500,
              fontSize: 12,
              color: "var(--text-secondary, rgba(255,255,255,0.5))",
              margin: 0,
            }}
          >
            Try a different search term
          </p>
        </motion.div>
      ) : (
        /* Artist grid */
        <AnimatePresence mode="popLayout">
          <motion.div
            key={sort + searchTerm}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="artists-grid"
          >
            {filtered.map((ar, i) => (
              <ArtistCard
                key={ar.id}
                artist={ar}
                index={i}
                onPlay={() => playSongsByArtist(ar.id)}
                theme={theme}
                isFollowing={followedIds.has(ar.id)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
