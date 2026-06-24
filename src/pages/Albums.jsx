import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Disc, Search, Play, LayoutGrid, Shuffle, Headphones } from "lucide-react";
import http from "../services/http";
import { usePlayer } from "../context/PlayerContext";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";
import AlbumArt from "../components/common/AlbumArt";

/* ─────────────────────────────────────────────────────────────
   SKELETON CARD
   Uses .album-skeleton-bone (index.css) which resolves
   --skeleton-base / --skeleton-shine per theme. Card wrapper
   uses --bg-card and --border so it is visible on both dark
   (rgba(255,255,255,0.03)) and light (rgba(0,0,0,0.03)) roots.
───────────────────────────────────────────────────────────── */
function AlbumSkeleton() {
  return (
    <div
      style={{
        background: "var(--bg-card, rgba(255,255,255,0.04))",
        border: "1px solid var(--border, rgba(255,255,255,0.07))",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {/* art placeholder */}
      <div
        className="album-skeleton-bone"
        style={{ width: "100%", aspectRatio: "1/1", borderRadius: 0 }}
      />
      {/* text lines */}
      <div style={{ padding: "12px 14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="album-skeleton-bone" style={{ height: 13, width: "75%" }} />
        <div className="album-skeleton-bone" style={{ height: 10, width: "50%" }} />
        <div className="album-skeleton-bone" style={{ height: 9,  width: "35%" }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ALBUM CARD
───────────────────────────────────────────────────────────── */
function AlbumCard({ album, index, onPlay, hovered, onLeave, onEnter, theme }) {
  const isHovered = hovered === album.id;
  const count = parseInt(album.song_count) || 0;

  // Lime (#C8FF00) is unreadable on the light musikly background.
  // Use the dark-green accent (#4a7c00) for hover state in that theme.
  const hoveredAccentColor = theme === "musikly" ? "#4a7c00" : "#C8FF00";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.28, ease: "easeOut" }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onPlay}
      style={{
        background: isHovered
          ? "var(--bg-card-hover, rgba(255,255,255,0.07))"
          : "var(--bg-card, rgba(255,255,255,0.04))",
        border: isHovered
          ? "1px solid rgba(200,255,0,0.25)"
          : "1px solid var(--border, rgba(255,255,255,0.07))",
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        transform: isHovered ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
        boxShadow: isHovered
          ? "0 12px 40px rgba(200,255,0,0.15), 0 4px 16px rgba(0,0,0,0.5)"
          : "0 2px 8px rgba(0,0,0,0.3)",
        transition:
          "transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease, background 0.18s ease, border-color 0.18s ease",
      }}
    >
      {/* ── Art ── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1/1",
          overflow: "hidden",
          background: "var(--bg-card, rgba(255,255,255,0.04))",
          borderRadius: "14px 14px 0 0",
        }}
      >
        <AlbumArt
          src={album.cover_url}
          title={album.title}
          size="100%"
          radius="0"
          style={{ transform: isHovered ? "scale(1.06)" : "scale(1)", transition: "transform 0.35s ease" }}
        />

        {/* play overlay — fades in on hover */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.52)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#C8FF00",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: isHovered ? "scale(1)" : "scale(0.7)",
              transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
              boxShadow: "0 0 24px rgba(200,255,0,0.5)",
            }}
          >
            <Play size={18} fill="#000" color="#000" style={{ marginLeft: 3 }} />
          </div>
        </div>
      </div>

      {/* ── Info ── */}
      <div style={{ padding: "12px 14px 14px" }}>
        {/* Album title — uses --text-primary (white on dark, #111118 on light) */}
        <p
          style={{
            margin: "0 0 3px",
            fontSize: "0.82rem",
            fontWeight: 700,
            color: "var(--text-primary, #ffffff)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            letterSpacing: "-0.01em",
          }}
        >
          {album.title}
        </p>

        {/* Artist — uses --text-secondary */}
        <p
          style={{
            margin: "0 0 6px",
            fontSize: "0.72rem",
            fontWeight: 500,
            color: "var(--text-secondary, rgba(255,255,255,0.5))",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {album.artist_name || "Unknown Artist"}
        </p>

        {/* Track count — .album-card-track-count gets a musikly override
            to rgba(0,0,0,0.52) (~5.8:1 on the light card bg).
            Inline color only applies when hovered (accent) so the CSS
            class covers the idle state across all themes. */}
        <span
          className="album-card-track-count"
          style={{
            display: "inline-block",
            fontSize: "0.65rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: isHovered
              ? hoveredAccentColor
              : "var(--text-muted, rgba(255,255,255,0.3))",
            transition: "color 0.18s ease",
          }}
        >
          {count} {count === 1 ? "track" : "tracks"}
        </span>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────── */
function EmptyState({ isSearch, accentTextColor = "#C8FF00" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        textAlign: "center",
        background: "var(--bg-card, rgba(255,255,255,0.02))",
        border: "1px solid var(--border, rgba(255,255,255,0.06))",
        borderRadius: 18,
        gap: 12,
      }}
    >
      <div
        className="albums-empty-icon-ring"
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: accentTextColor === "#4a7c00" ? "rgba(74,124,0,0.08)" : "rgba(200,255,0,0.07)",
          border: `1.5px solid ${accentTextColor === "#4a7c00" ? "rgba(74,124,0,0.20)" : "rgba(200,255,0,0.15)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 4,
        }}
      >
        <Disc size={32} color={accentTextColor} style={{ opacity: 0.6 }} />
      </div>
      <h3
        style={{
          margin: 0,
          fontSize: "1.1rem",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          color: "var(--text-primary, #ffffff)",
        }}
      >
        {isSearch ? "No Matches Found" : "No Albums Yet"}
      </h3>
      {/* .albums-empty-body overridden in musikly to rgba(0,0,0,0.52) */}
      <p
        className="albums-empty-body"
        style={{
          margin: 0,
          fontSize: "0.75rem",
          fontWeight: 500,
          color: "var(--text-muted, rgba(255,255,255,0.38))",
        }}
      >
        {isSearch
          ? "Try a different search term or clear the filter."
          : "Albums will appear here once they are added to the library."}
      </p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MIX SONG CARD SKELETON
   140px wide horizontal-scroll card skeleton while Personal Mix loads.
───────────────────────────────────────────────────────────── */
function MixCardSkeleton() {
  return (
    <div
      style={{
        width: 140,
        flexShrink: 0,
        borderRadius: 10,
        overflow: "hidden",
        background: "var(--bg-card, rgba(255,255,255,0.04))",
        border: "1px solid var(--border, rgba(255,255,255,0.07))",
      }}
    >
      {/* art placeholder — 60% height ratio via padding trick */}
      <div style={{ position: "relative", paddingTop: "60%" }}>
        <div
          className="album-skeleton-bone"
          style={{ position: "absolute", inset: 0, borderRadius: 0 }}
        />
      </div>
      {/* text lines */}
      <div style={{ padding: "10px 10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="album-skeleton-bone" style={{ height: 11, width: "75%" }} />
        <div className="album-skeleton-bone" style={{ height: 9,  width: "50%" }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MIX SONG CARD
   Compact 140px card for the horizontal Personal Mix strip.
───────────────────────────────────────────────────────────── */
function MixSongCard({ song, onPlay, theme }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onPlay}
      style={{
        width: 140,
        flexShrink: 0,
        scrollSnapAlign: "start",
        borderRadius: 10,
        overflow: "hidden",
        cursor: "pointer",
        background: hovered
          ? "var(--bg-card-hover, rgba(255,255,255,0.07))"
          : "var(--bg-card, rgba(255,255,255,0.04))",
        border: hovered
          ? "1px solid rgba(200,255,0,0.30)"
          : "1px solid var(--border, rgba(255,255,255,0.07))",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 8px 28px rgba(200,255,0,0.18), 0 2px 8px rgba(0,0,0,0.4)"
          : "0 2px 6px rgba(0,0,0,0.25)",
        transition:
          "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease, background 0.18s ease, border-color 0.18s ease",
      }}
    >
      {/* ── Art (60% height ratio) ── */}
      <div
        style={{
          position: "relative",
          paddingTop: "60%",
          overflow: "hidden",
          background: "var(--bg-card, rgba(255,255,255,0.04))",
        }}
      >
        <AlbumArt
          src={song.cover_url || song.album_cover}
          title={song.album_title || song.title}
          size="100%"
          radius="0"
          style={{ position: "absolute", inset: 0, transform: hovered ? "scale(1.06)" : "scale(1)", transition: "transform 0.35s ease" }}
        />
        {/* play overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.52)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#C8FF00",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: hovered ? "scale(1)" : "scale(0.7)",
              transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
              boxShadow: "0 0 18px rgba(200,255,0,0.55)",
            }}
          >
            <Play size={14} fill="#000" color="#000" style={{ marginLeft: 2 }} />
          </div>
        </div>
      </div>

      {/* ── Info ── */}
      <div
        style={{
          padding: "10px 10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "var(--text-primary, #ffffff)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            letterSpacing: "-0.01em",
          }}
        >
          {song.title}
        </p>
        {/* .mix-card-artist overridden in musikly to rgba(0,0,0,0.52) */}
        <p
          className="mix-card-artist"
          style={{
            margin: 0,
            fontSize: "0.65rem",
            fontWeight: 500,
            color: "var(--text-secondary, rgba(255,255,255,0.5))",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {song.artist_name || "Unknown Artist"}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PERSONAL MIX SECTION
   Fetches play history + favourites, deduplicates, pads with
   catalog if fewer than 5 tracks, caps at 20. Renders a
   horizontal snap-scroll strip of MixSongCards.
───────────────────────────────────────────────────────────── */
function PersonalMix({ user, theme, accentTextColor }) {
  const { setCurrentSongId, setQueueUpdated, setUserStarted, setIsPlaying } = usePlayer();

  const [mixTracks, setMixTracks] = useState([]);
  const [mixLoading, setMixLoading] = useState(true);
  // hoveredPlayAll tracks hover state for the Play All button
  const [hoveredPlayAll, setHoveredPlayAll] = useState(false);

  const MAX_TRACKS = 20;
  const MIN_TRACKS = 5;

  useEffect(() => {
    let cancelled = false;

    const buildMix = async () => {
      setMixLoading(true);
      try {
        const combined = [];

        if (user?.email) {
          // 1. Fetch play history (returns array of song objects)
          try {
            const histRes = await http.get("/auth/play-history");
            const histSongs = histRes.data || [];
            for (const s of histSongs) {
              if (s && s.id) combined.push(s);
            }
          } catch {
            // history unavailable — continue
          }

          // 2. Fetch favourites (returns { favourites: [id, ...] })
          try {
            const favRes = await http.get("/auth/favourites");
            const favIds = favRes.data?.favourites || [];
            // Fetch song detail for each fav id not already in combined
            const existingIds = new Set(combined.map((s) => String(s.id)));
            const newFavIds = favIds.filter((id) => !existingIds.has(String(id)));
            const favDetails = await Promise.all(
              newFavIds.map(async (id) => {
                try {
                  const r = await http.get(`/auth/music/songs/${id}`);
                  return { id, ...r.data };
                } catch {
                  return null;
                }
              })
            );
            for (const s of favDetails) {
              if (s) combined.push(s);
            }
          } catch {
            // favourites unavailable — continue
          }
        }

        // 3. Deduplicate by id (keep first occurrence)
        const seen = new Set();
        const deduped = [];
        for (const s of combined) {
          const key = String(s.id);
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(s);
          }
        }

        // 4. If fewer than MIN_TRACKS, pad with catalog top songs by play_count
        if (deduped.length < MIN_TRACKS) {
          try {
            const catRes = await http.get("/auth/music/songs");
            const catalog = (catRes.data || [])
              .slice() // avoid mutating original
              .sort((a, b) => (parseInt(b.play_count) || 0) - (parseInt(a.play_count) || 0));
            for (const s of catalog) {
              if (deduped.length >= MAX_TRACKS) break;
              const key = String(s.id);
              if (!seen.has(key)) {
                seen.add(key);
                deduped.push(s);
              }
            }
          } catch {
            // catalog unavailable — show whatever we have
          }
        }

        if (!cancelled) {
          setMixTracks(deduped.slice(0, MAX_TRACKS));
        }
      } finally {
        if (!cancelled) setMixLoading(false);
      }
    };

    buildMix();
    return () => { cancelled = true; };
  }, [user?.email]);

  /* ── Queue helpers ── */
  const queueAndPlay = (startSongId) => {
    if (!user?.email) { toast.error("Please login to play music"); return; }
    if (mixTracks.length === 0) return;
    setCurrentSongId(startSongId);
    setUserStarted(true);
    setIsPlaying(true);
    http.post("/auth/queue/add", { songIds: mixTracks.map((s) => s.id) })
      .then(() => setQueueUpdated((p) => !p))
      .catch(() => toast.error("Failed to start Personal Mix"));
  };

  const playAll = () => {
    if (mixTracks.length === 0) return;
    queueAndPlay(mixTracks[0].id);
  };

  /* ── Play All button style (theme-aware) ── */
  const playAllBg    = theme === "musikly" ? "#4a7c00" : "#C8FF00";
  const playAllColor = theme === "musikly" ? "#ffffff" : "#000000";

  /* ── Render ── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{
        marginTop: 56,
        paddingTop: 40,
        borderTop: "1px solid var(--border, rgba(255,255,255,0.08))",
      }}
    >
      {/* ── Section header ── */}
      <div style={{ marginBottom: 20 }}>
        {/* eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Shuffle size={12} color={accentTextColor} style={{ opacity: 0.8 }} />
          {/* .mix-section-eyebrow overridden in musikly to #4a7c00 */}
          <span
            className="mix-section-eyebrow"
            style={{
              fontSize: "0.65rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              color: accentTextColor,
              opacity: 0.8,
            }}
          >
            Personal Mix
          </span>
        </div>

        {/* heading row: title + badge + Play All */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(1.2rem, 2.5vw, 1.4rem)",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "var(--text-primary, #ffffff)",
            }}
          >
            Your Personal Mix
          </h2>

          {/* Auto-generated badge */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              border: `1px solid ${accentTextColor}`,
              color: accentTextColor,
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.10em",
              padding: "3px 8px",
              borderRadius: 20,
              textTransform: "uppercase",
              opacity: 0.85,
              lineHeight: 1,
            }}
          >
            Auto-generated
          </span>

          {/* Play All button — pushed to right */}
          {!mixLoading && mixTracks.length > 0 && (
            <button
              className="mix-play-all-btn"
              onMouseEnter={() => setHoveredPlayAll(true)}
              onMouseLeave={() => setHoveredPlayAll(false)}
              onClick={playAll}
              style={{
                marginLeft: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: playAllBg,
                color: playAllColor,
                fontSize: "0.7rem",
                fontWeight: 800,
                padding: "8px 18px",
                borderRadius: 20,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                cursor: "pointer",
                border: "none",
                outline: "none",
                fontFamily: "inherit",
                transform: hoveredPlayAll ? "scale(1.03)" : "scale(1)",
                filter: hoveredPlayAll ? "brightness(1.10)" : "brightness(1)",
                transition: "transform 0.18s ease, filter 0.18s ease",
              }}
            >
              <Play size={11} fill={playAllColor} color={playAllColor} style={{ marginLeft: 1 }} />
              Play All
            </button>
          )}
        </div>
      </div>

      {/* ── Strip: loading / empty / tracks ── */}
      {mixLoading ? (
        /* Skeleton strip */
        <div
          style={{
            display: "flex",
            gap: 12,
            overflowX: "hidden",
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <MixCardSkeleton key={i} />
          ))}
        </div>
      ) : mixTracks.length === 0 ? (
        /* Empty state */
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 10,
            minHeight: 160,
            background: "var(--bg-card, rgba(255,255,255,0.02))",
            border: "1px solid var(--border, rgba(255,255,255,0.06))",
            borderRadius: 14,
          }}
        >
          <Headphones
            size={32}
            color={accentTextColor}
            style={{ opacity: 0.5 }}
          />
          {/* .mix-empty-text overridden in musikly to rgba(0,0,0,0.52) */}
          <p
            className="mix-empty-text"
            style={{
              margin: 0,
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--text-muted, rgba(255,255,255,0.38))",
              textAlign: "center",
            }}
          >
            Start listening to build your mix
          </p>
        </div>
      ) : (
        /* Horizontal scroll strip */
        <div
          className="scrollbar-hide"
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            overflowY: "hidden",
            scrollSnapType: "x mandatory",
            paddingBottom: 6,
            /* Firefox scrollbar hide */
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {mixTracks.map((song) => (
            <MixSongCard
              key={song.id}
              song={song}
              theme={theme}
              onPlay={() => queueAndPlay(song.id)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function Albums() {
  const { user } = useUser();
  const { theme } = useTheme();
  const { setCurrentSongId, setQueueUpdated, setUserStarted, setIsPlaying } =
    usePlayer();
  const email = user?.email;

  const [albums, setAlbums]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [hovered, setHovered]       = useState(null);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const r = await http.get("/auth/music/albums");
        setAlbums(r.data || []);
      } catch (error) {
        console.error("Failed to fetch albums:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);

  const filteredAlbums = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return albums;
    return albums.filter(
      (al) =>
        al.title.toLowerCase().includes(term) ||
        (al.artist_name || "").toLowerCase().includes(term)
    );
  }, [albums, searchTerm]);

  const totalTracks = useMemo(
    () => albums.reduce((acc, al) => acc + (parseInt(al.song_count) || 0), 0),
    [albums]
  );

  const playAlbum = async (albumId) => {
    if (!email) {
      toast.error("Please login to play music");
      return;
    }
    try {
      const res = await http.get(`/auth/music/albums/${albumId}/songs`);
      const albumSongs = res.data || [];

      if (albumSongs.length === 0) {
        toast.error("This album has no tracks");
        return;
      }

      setCurrentSongId(albumSongs[0].id);
      setUserStarted(true);
      setIsPlaying(true);
      toast.success(`Playing: ${albums.find((a) => a.id === albumId)?.title}`);
      http.post("/auth/queue/add", { songIds: albumSongs.map((s) => s.id), album: true })
        .then(() => setQueueUpdated((p) => !p))
        .catch(() => {});
    } catch {
      toast.error("Failed to play album");
    }
  };

  // Lime (#C8FF00) on the light musikly background (#f5f6fa) yields ~1.5:1
  // contrast — invisible. Use #4a7c00 (dark green) for accent text in that theme.
  const accentTextColor = theme === "musikly" ? "#4a7c00" : "#C8FF00";

  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        minHeight: "80vh",
        color: "var(--text-primary, #ffffff)",
        padding: "4px 0",
      }}
    >
      {/* ─────────── PAGE HEADER ─────────── */}
      <div style={{ marginBottom: 36 }}>

        {/* eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <LayoutGrid size={12} color={accentTextColor} style={{ opacity: 0.8 }} />
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              color: accentTextColor,
              opacity: 0.8,
            }}
          >
            Discovery Hub
          </span>
        </div>

        {/* heading + search row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 4.5vw, 3.4rem)",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: "var(--text-primary, #ffffff)",
            }}
          >
            All{" "}
            {/* .albums-accent-span overridden to #4a7c00 in musikly theme */}
            <span
              className="albums-accent-span"
              style={{
                color: accentTextColor,
                textShadow: theme === "musikly" ? "none" : "0 0 32px rgba(200,255,0,0.35)",
              }}
            >
              Albums
            </span>
          </h1>

          {/* theme-aware search input */}
          <div style={{ position: "relative", minWidth: 260 }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted, rgba(255,255,255,0.35))",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search albums or artists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="albums-search-input"
              style={{
                width: "100%",
                background: "var(--bg-input, rgba(255,255,255,0.06))",
                border: "1px solid var(--border, rgba(255,255,255,0.1))",
                borderRadius: 10,
                padding: "11px 16px 11px 40px",
                color: "var(--text-primary, #ffffff)",
                fontSize: "0.8rem",
                fontWeight: 500,
                fontFamily: "inherit",
                outline: "none",
                transition: "border-color 0.18s ease, background 0.18s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(200,255,0,0.45)";
                e.target.style.background  = "var(--bg-card-hover, rgba(255,255,255,0.09))";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border, rgba(255,255,255,0.1))";
                e.target.style.background  = "var(--bg-input, rgba(255,255,255,0.06))";
              }}
            />
          </div>
        </div>

        {/* stats strip — rendered only after data loads */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: "flex",
              gap: 32,
              marginTop: 22,
              paddingTop: 18,
              borderTop: "1px solid var(--border, rgba(255,255,255,0.08))",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900, color: "var(--text-primary, #ffffff)", lineHeight: 1 }}>
                {albums.length}
              </p>
              {/* .albums-stat-label overridden in musikly to rgba(0,0,0,0.52) */}
              <p className="albums-stat-label" style={{ margin: "3px 0 0", fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--text-muted, rgba(255,255,255,0.35))" }}>
                Albums
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900, color: "var(--text-primary, #ffffff)", lineHeight: 1 }}>
                {totalTracks}
              </p>
              <p className="albums-stat-label" style={{ margin: "3px 0 0", fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--text-muted, rgba(255,255,255,0.35))" }}>
                Total Tracks
              </p>
            </div>
            {searchTerm && (
              <div>
                <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900, color: accentTextColor, lineHeight: 1 }}>
                  {filteredAlbums.length}
                </p>
                <p className="albums-stat-label" style={{ margin: "3px 0 0", fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--text-muted, rgba(255,255,255,0.35))" }}>
                  Results
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ─────────── GRID / LOADING / EMPTY ─────────── */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 185px), 1fr))",
            gap: 20,
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <AlbumSkeleton key={i} />
          ))}
        </div>
      ) : filteredAlbums.length === 0 ? (
        <EmptyState isSearch={searchTerm.length > 0} accentTextColor={accentTextColor} />
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={searchTerm}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 185px), 1fr))",
              gap: 20,
            }}
          >
            {filteredAlbums.map((al, i) => (
              <AlbumCard
                key={al.id}
                album={al}
                index={i}
                onPlay={() => playAlbum(al.id)}
                hovered={hovered}
                onEnter={() => setHovered(al.id)}
                onLeave={() => setHovered(null)}
                theme={theme}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ─────────── PERSONAL MIX ─────────── */}
      <PersonalMix
        user={user}
        theme={theme}
        accentTextColor={accentTextColor}
      />
    </div>
  );
}
