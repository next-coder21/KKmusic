import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Search as SearchIcon, Clock, X, Play, Music } from "lucide-react";
import { useUser } from "../context/UserContext";
import { usePlayer } from "../context/PlayerContext";
import ApiService from "../services/ApiService";
import { API_CONFIG } from "../config";
import toast from "react-hot-toast";
import { songDefaults, fmtDuration } from "../utils/songUtils";

function useDebounce(v, d) {
  const [dv, setDv] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setDv(v), d);
    return () => clearTimeout(t);
  }, [v, d]);
  return dv;
}

const Bone = ({ w = "100%", h = 14, r = 6 }) => <div className="bone" style={{ width: w, height: h, borderRadius: r }} />;

const GENRE_CARDS = [
  { label: "Pop",         cls: "genre-dance"     },
  { label: "Electronic",  cls: "genre-electro"   },
  { label: "Alternative", cls: "genre-alt"       },
  { label: "Hip Hop",     cls: "genre-hiphop"    },
  { label: "Classical",   cls: "genre-classical" },
  { label: "Rap",         cls: "genre-rap"       },
];

export default function Search() {
  const [query, setQuery]     = useState("");
  const dq                    = useDebounce(query, 450);
  const [results, setResults] = useState({ songs: [], artists: [], albums: [] });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);
  const { user } = useUser();
  const { setCurrentSongId, setQueueUpdated } = usePlayer();

  useEffect(() => {
    const save = localStorage.getItem("kk-save-search-history") !== "false";
    if (save) setHistory(JSON.parse(localStorage.getItem("kk-search-history") || "[]"));
  }, []);

  useEffect(() => {
    if (!dq.trim()) { setResults({ songs: [], artists: [], albums: [] }); return; }
    const go = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${ApiService.getBaseUrl()}/search?q=${encodeURIComponent(dq)}`, { withCredentials: true });
        setResults({ songs: res.data.songs || [], artists: res.data.artists || [], albums: res.data.albums || [] });
      } catch {
        try {
          const all = await axios.get(`${API_CONFIG.MUSIC_URL}/songs`);
          const filtered = all.data.filter(s =>
            s.title?.toLowerCase().includes(dq.toLowerCase()) ||
            s.artist_name?.toLowerCase().includes(dq.toLowerCase())
          );
          setResults({ songs: filtered, artists: [], albums: [] });
        } catch {}
      } finally { setLoading(false); }

      const save = localStorage.getItem("kk-save-search-history") !== "false";
      if (save) {
        const nh = [dq, ...history.filter(h => h !== dq)].slice(0, 10);
        setHistory(nh);
        localStorage.setItem("kk-search-history", JSON.stringify(nh));
      }
    };
    go();
  }, [dq]);

  const removeHistory = (item, e) => {
    e.stopPropagation();
    const nh = history.filter(h => h !== item);
    setHistory(nh);
    localStorage.setItem("kk-search-history", JSON.stringify(nh));
  };

  const playSong = async (id) => {
    if (!user?.email) return toast.error("Please login");
    try {
      await axios.post(`${ApiService.getBaseUrl()}/queue/add`, { email: user.email, songIds: [id], album: false });
      setCurrentSongId(id);
      setQueueUpdated(p => !p);
    } catch { toast.error("Could not play song"); }
  };

  const hasResults = results.songs.length > 0 || results.artists.length > 0 || results.albums.length > 0;

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif" }}>
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
          <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", display: "flex",
          }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* No query — show history + genres */}
      {!query && (
        <div>
          {history.length > 0 && (
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
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Browse by genre</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10 }}>
            {GENRE_CARDS.map(g => (
              <motion.div key={g.label} whileHover={{ scale: 1.03 }} whileTap={{ scale: .97 }}
                className={g.cls}
                style={{ borderRadius: 10, padding: "18px 14px", cursor: "pointer", border: "1px solid rgba(255,255,255,.06)", minHeight: 64, display: "flex", alignItems: "flex-end" }}
                onClick={() => setQuery(g.label)}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.9)", margin: 0 }}>{g.label}</p>
              </motion.div>
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
                        <img src={s.cover_url} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", marginBottom: 10, border: "1px solid var(--border)" }} onError={e => e.target.src = "/default-album.jpg"} />
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
                        <div key={s.id} onClick={() => playSong(s.id)}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer", transition: "background .12s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <img src={s.cover_url} alt="" style={{ width: 38, height: 38, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} onError={e => e.target.src = "/default-album.jpg"} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</p>
                            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{s.artist_name}</p>
                          </div>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{fmtDuration(s.duration_seconds)}</span>
                        </div>
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
                        <div key={s.id} onClick={() => playSong(s.id)}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 8, cursor: "pointer", transition: "background .12s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <img src={s.cover_url} alt="" style={{ width: 34, height: 34, borderRadius: 5, objectFit: "cover", flexShrink: 0 }} onError={e => e.target.src = "/default-album.jpg"} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</p>
                            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{s.artist_name}</p>
                          </div>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtDuration(s.duration_seconds)}</span>
                        </div>
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
                  <div key={a.id} style={{ flexShrink: 0, width: 88, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
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
                  <div key={al.id} style={{ flexShrink: 0, width: 130 }}>
                    <div style={{ width: 130, height: 130, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", marginBottom: 8 }}>
                      <img src={al.cover_url} alt={al.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.src = "/default-album.jpg"} />
                    </div>
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
