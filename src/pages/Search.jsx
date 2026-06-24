import React, { useState, useEffect, useRef } from "react";
import http from "../services/http";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, Clock, X, Play, Music, MoreHorizontal } from "lucide-react";
import { FiFlag } from "react-icons/fi";
import { useUser } from "../context/UserContext";
import { usePlayer } from "../context/PlayerContext";
import toast from "react-hot-toast";
import { songDefaults, fmtDuration } from "../utils/songUtils";
import AlbumArt from "../components/common/AlbumArt";

function useDebounce(v, d) {
  const [dv, setDv] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setDv(v), d);
    return () => clearTimeout(t);
  }, [v, d]);
  return dv;
}

const Bone = ({ w = "100%", h = 14, r = 6 }) => <div className="bone" style={{ width: w, height: h, borderRadius: r }} />;

/* ── REPORT MODAL ───────────────────────────────────────────── */
const REPORT_REASONS = ["Explicit", "Copyright", "Offensive", "Spam", "Other"];

function ReportModal({ song, onClose }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = async (reason) => {
    setSelected(reason);
    try {
      await http.post("/auth/reports", { song_id: song?.id, reason });
      toast.success(`Reported as "${reason}"`);
    } catch (err) {
      if (err?.response?.status === 404) {
        toast.error("Reporting is not yet available");
      } else {
        toast.error("Failed to submit report");
      }
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9000,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
        }}
      >
        <motion.div
          initial={{ scale: 0.94, y: 16, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.94, y: 16, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: "var(--bg-player, #0d0d18)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 18,
            padding: "28px 28px 24px",
            width: "min(92vw, 360px)",
            boxShadow: "0 32px 64px rgba(0,0,0,0.7)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FiFlag size={16} style={{ color: "#ef4444" }} aria-hidden="true" />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-primary, #fff)" }}>
                Report Song
              </h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close report modal"
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4, borderRadius: 6, display: "flex", transition: "color 0.15s" }}
              className="report-close-btn"
            >
              <X size={16} />
            </button>
          </div>

          {song && (
            <p style={{ margin: "0 0 18px", fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {song.title} · {song.artist_name}
            </p>
          )}

          {/* Reason buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {REPORT_REASONS.map(reason => (
              <button
                key={reason}
                onClick={() => handleSelect(reason)}
                className="report-reason-btn"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  padding: "11px 16px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text-primary, #fff)",
                  fontFamily: "inherit",
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                {reason}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="report-cancel-btn"
            style={{
              width: "100%",
              marginTop: 16,
              background: "none",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "10px",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.4)",
              fontFamily: "inherit",
              transition: "border-color 0.15s, color 0.15s",
            }}
          >
            Cancel
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── SONG ROW with kebab menu ─────────────────────────────── */
function SongRowWithMenu({ song, onPlay, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <>
      <div
        onClick={onPlay}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer", transition: "background .12s", position: "relative" }}
        className="song-row-with-menu"
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        {children}
        {/* Kebab trigger */}
        <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="song-kebab-btn"
            aria-label="More options"
            title="More options"
            style={{
              background: "none", border: "none", cursor: "pointer", padding: "4px 5px",
              borderRadius: 6, color: "var(--text-muted)", display: "flex", alignItems: "center",
              opacity: 0, transition: "opacity 0.15s",
            }}
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute", right: 0, bottom: "calc(100% + 4px)", zIndex: 100,
                background: "var(--bg-player, #0d0d18)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                padding: 4,
                minWidth: 160,
                boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
              }}
            >
              <button
                onClick={() => { setMenuOpen(false); setReportOpen(true); }}
                style={{
                  width: "100%", background: "none", border: "none", cursor: "pointer",
                  padding: "9px 12px", borderRadius: 7, textAlign: "left",
                  fontSize: 12, fontWeight: 700, color: "#ef4444",
                  display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit",
                  transition: "background 0.12s",
                }}
                className="report-menu-item"
              >
                <FiFlag size={13} aria-hidden="true" /> Report Song
              </button>
            </div>
          )}
        </div>
      </div>
      {reportOpen && <ReportModal song={song} onClose={() => setReportOpen(false)} />}
    </>
  );
}

export default function Search() {
  const [query, setQuery]     = useState("");
  const dq                    = useDebounce(query, 450);
  const [results, setResults] = useState({ songs: [], artists: [], albums: [] });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);
  const { user } = useUser();
  const { setCurrentSongId, setQueueUpdated, setUserStarted, setIsPlaying } = usePlayer();

  useEffect(() => {
    const save = localStorage.getItem("kk-save-search-history") !== "false";
    if (save) setHistory(JSON.parse(localStorage.getItem("kk-search-history") || "[]"));
  }, []);

  useEffect(() => {
    if (!dq.trim()) { setResults({ songs: [], artists: [], albums: [] }); return; }
    const controller = new AbortController();
    const go = async () => {
      setLoading(true);
      try {
        const res = await http.get(`/auth/search?q=${encodeURIComponent(dq)}`, { signal: controller.signal });
        setResults({ songs: res.data.songs || [], artists: res.data.artists || [], albums: res.data.albums || [] });
      } catch (err) {
        if (controller.signal.aborted) return;
        try {
          const all = await http.get("/auth/music/songs", { signal: controller.signal });
          const filtered = all.data.filter(s =>
            s.title?.toLowerCase().includes(dq.toLowerCase()) ||
            s.artist_name?.toLowerCase().includes(dq.toLowerCase())
          );
          setResults({ songs: filtered, artists: [], albums: [] });
        } catch {}
      } finally { if (!controller.signal.aborted) setLoading(false); }

      if (controller.signal.aborted) return;
      const save = localStorage.getItem("kk-save-search-history") !== "false";
      if (save) {
        setHistory(prev => {
          const nh = [dq, ...prev.filter(h => h !== dq)].slice(0, 10);
          localStorage.setItem("kk-search-history", JSON.stringify(nh));
          return nh;
        });
      }
    };
    go();
    return () => controller.abort();
  }, [dq]);

  const removeHistory = (item, e) => {
    e.stopPropagation();
    const nh = history.filter(h => h !== item);
    setHistory(nh);
    localStorage.setItem("kk-search-history", JSON.stringify(nh));
  };

  const playSong = (id) => {
    if (!user?.email) return toast.error("Please login");
    setCurrentSongId(id);
    setUserStarted(true);
    setIsPlaying(true);
    http.post("/auth/queue/add", { songIds: [id], album: false })
      .then(() => setQueueUpdated(p => !p))
      .catch(() => {});
  };

  const playArtist = async (artistId) => {
    if (!user?.email) return toast.error("Please login");
    try {
      let songs = results.songs.filter(s => s.artist_id === artistId);
      if (!songs.length) {
        const res = await http.get("/auth/music/songs", { params: { artist_id: artistId } });
        songs = res.data || [];
      }
      if (!songs.length) return toast.error("No songs for this artist");
      setCurrentSongId(songs[0].id);
      setUserStarted(true);
      setIsPlaying(true);
      http.post("/auth/queue/add", { songIds: songs.map(s => s.id), album: true })
        .then(() => setQueueUpdated(p => !p))
        .catch(() => {});
    } catch { toast.error("Could not play artist"); }
  };

  const playAlbumSearch = async (albumId) => {
    if (!user?.email) return toast.error("Please login");
    try {
      const res = await http.get(`/auth/music/albums/${albumId}/songs`);
      const songs = res.data || [];
      if (!songs.length) return toast.error("No songs in this album");
      setCurrentSongId(songs[0].id);
      setUserStarted(true);
      setIsPlaying(true);
      http.post("/auth/queue/add", { songIds: songs.map(s => s.id), album: true })
        .then(() => setQueueUpdated(p => !p))
        .catch(() => {});
    } catch { toast.error("Could not play album"); }
  };

  const hasResults = results.songs.length > 0 || results.artists.length > 0 || results.albums.length > 0;

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif" }}>
      <style>{`
        .bone {
          background: var(--skeleton-base, rgba(255,255,255,0.05));
          background: linear-gradient(90deg,
            var(--skeleton-base, rgba(255,255,255,0.05)) 25%,
            var(--skeleton-shine, rgba(255,255,255,0.10)) 50%,
            var(--skeleton-base, rgba(255,255,255,0.05)) 75%
          );
          background-size: 400px 100%;
          animation: shimmer 1.4s infinite linear;
          border-radius: 6px;
        }
        .song-row-with-menu:hover .song-kebab-btn,
        .song-row-with-menu:focus-within .song-kebab-btn { opacity: 1 !important; }
        .song-kebab-btn:hover { background: var(--bg-card-hover) !important; color: var(--text-primary) !important; }
        .song-kebab-btn:focus-visible { outline: 2px solid #C8FF00; outline-offset: 2px; opacity: 1 !important; }
        .report-menu-item:hover { background: rgba(239,68,68,0.1) !important; }
        .report-reason-btn:hover { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.16) !important; }
        .report-cancel-btn:hover { border-color: rgba(255,255,255,0.2) !important; color: rgba(255,255,255,0.65) !important; }
        .report-close-btn:hover { color: rgba(255,255,255,0.8) !important; }
        [data-theme="musikly"] .report-reason-btn { background: rgba(0,0,0,0.04) !important; border-color: rgba(0,0,0,0.09) !important; color: #111118 !important; }
        [data-theme="musikly"] .report-reason-btn:hover { background: rgba(0,0,0,0.08) !important; }
      `}</style>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 16px" }}>Search</h1>

      {/* Search input */}
      <div style={{ position: "relative", maxWidth: 520, marginBottom: 24 }}>
        <SearchIcon size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input
          ref={inputRef} type="text" value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Artists, songs, albums…"
          style={{
            width: "100%", padding: "11px 40px 11px 42px",
            borderRadius: 10, background: "var(--bg-card)",
            border: "1px solid var(--border)", color: "var(--text-primary)",
            fontSize: 14, fontFamily: "'Outfit',sans-serif", outline: "none",
            transition: "border-color .15s",
          }}
          onFocus={e => e.target.style.borderColor = "var(--accent)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />
        {query && (
          <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="Clear search" style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", display: "flex",
          }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* No query — show history only */}
      {!query && history.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Recent searches</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {history.map((item, i) => (
              <div key={i} onClick={() => setQuery(item)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, cursor: "pointer", transition: "background .12s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Clock size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item}</span>
                </div>
                <button onClick={e => removeHistory(item, e)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4, borderRadius: 4 }}
                  onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                ><X size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {query && loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px" }}>
              <Bone w={40} h={40} r={6} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                <Bone w="55%" h={12} /><Bone w="35%" h={10} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {query && !loading && !hasResults && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
          <Music size={40} style={{ marginBottom: 12, opacity: .3 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px" }}>No results for "{query}"</p>
          <p style={{ fontSize: 13, margin: 0 }}>Try different keywords</p>
        </div>
      )}

      {/* Results */}
      {query && !loading && hasResults && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {results.songs.length > 0 && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                {/* Top result */}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Top result</p>
                  {(() => {
                    const s = songDefaults(results.songs[0]);
                    return (
                      <div onClick={() => playSong(s.id)}
                        style={{ padding: 16, borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border)", cursor: "pointer", position: "relative", transition: "border-color .15s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.querySelector(".play-btn").style.opacity = "1"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.querySelector(".play-btn").style.opacity = "0"; }}
                      >
                        <AlbumArt src={s.cover_url} title={s.album_title || s.title} size={60} radius="8px" style={{ marginBottom: 10, border: "1px solid var(--border)" }} />
                        <p style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px", fontFamily: "'Syne',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ background: "var(--bg-card-hover)", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-secondary)" }}>Song</span>
                          {s.artist_name}
                        </p>
                        <button className="play-btn" onClick={e => { e.stopPropagation(); playSong(s.id); }} style={{
                          position: "absolute", bottom: 14, right: 14, width: 36, height: 36, borderRadius: "50%",
                          background: "var(--accent)", border: "none", cursor: "pointer", opacity: 0, transition: "opacity .15s",
                          display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px var(--accent-glow)",
                        }}>
                          <Play size={14} style={{ color: "#fff", transform: "translateX(1px)" }} />
                        </button>
                      </div>
                    );
                  })()}
                </div>
                {/* Songs list */}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Songs</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {results.songs.slice(0, 4).map(raw => {
                      const s = songDefaults(raw);
                      return (
                        <SongRowWithMenu key={s.id} song={s} onPlay={() => playSong(s.id)}>
                          <AlbumArt src={s.cover_url} title={s.album_title || s.title} size={38} radius="6px" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</p>
                            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{s.artist_name}</p>
                          </div>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{fmtDuration(s.duration_seconds)}</span>
                        </SongRowWithMenu>
                      );
                    })}
                  </div>
                </div>
              </div>

              {results.songs.length > 4 && (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>More Songs</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {results.songs.slice(4).map(raw => {
                      const s = songDefaults(raw);
                      return (
                        <SongRowWithMenu key={s.id} song={s} onPlay={() => playSong(s.id)}>
                          <AlbumArt src={s.cover_url} title={s.album_title || s.title} size={34} radius="5px" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</p>
                            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{s.artist_name}</p>
                          </div>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtDuration(s.duration_seconds)}</span>
                        </SongRowWithMenu>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {results.artists.length > 0 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Artists</p>
              <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 6 }} className="scrollbar-hide">
                {results.artists.map(a => (
                  <div key={a.id} onClick={() => playArtist(a.id)} style={{ flexShrink: 0, width: 88, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <div style={{ width: 68, height: 68, borderRadius: "50%", overflow: "hidden", border: "1px solid var(--border)" }}>
                      <img src={a.image_url || "/default-avatar.png"} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.src = "/default-avatar.png"} />
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", padding: "0 4px" }}>{a.name}</p>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>Artist</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.albums.length > 0 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Albums</p>
              <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 6 }} className="scrollbar-hide">
                {results.albums.map(al => (
                  <div key={al.id} onClick={() => playAlbumSearch(al.id)} style={{ flexShrink: 0, width: 130, cursor: "pointer" }}>
                    <AlbumArt src={al.cover_url} title={al.title} size={130} radius="8px" style={{ border: "1px solid var(--border)", marginBottom: 8 }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{al.title}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>{al.artist_name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
