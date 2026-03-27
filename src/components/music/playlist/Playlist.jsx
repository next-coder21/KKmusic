import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, Clock, Music } from "lucide-react";
import { useUser } from "../../../context/UserContext";
import { usePlayer } from "../../../context/PlayerContext";
import ApiService from "../../../services/ApiService";
import { API_CONFIG } from "../../../config";
import { songDefaults, fmtDuration } from "../../../utils/songUtils";
import Ace from "../../../assets/Ace.png";

const Bone = ({ w = "100%", h = 14, r = 6 }) => <div className="bone" style={{ width: w, height: h, borderRadius: r }} />;

export default function Playlist() {
  const [songs,       setSongs      ] = useState([]);
  const [openedAlbum, setOpenedAlbum] = useState(null);
  const [loading,     setLoading    ] = useState(true);
  const { user } = useUser();
  const { setCurrentSongId, setQueueUpdated } = usePlayer();
  const email = user?.email;

  useEffect(() => {
    axios.get(`${API_CONFIG.MUSIC_URL}/songs`)
      .then(r => setSongs(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const albums = songs.reduce((acc, s) => {
    const a = s.album_title || "Various";
    if (!acc[a]) acc[a] = [];
    acc[a].push(s);
    return acc;
  }, {});

  const playSong = async id => {
    if (!email) return;
    try {
      await axios.post(`${API_CONFIG.QUEUE_URL}/add`, { email, songIds: [id], album: false });
      setCurrentSongId(id); setQueueUpdated(p => !p);
    } catch {}
  };

  const playAlbum = async album => {
    if (!email) return;
    try {
      await axios.post(`${API_CONFIG.QUEUE_URL}/add`, { email, songIds: albums[album].map(s => s.id), album: true });
      setCurrentSongId(albums[album][0].id); setQueueUpdated(p => !p);
    } catch {}
  };

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Albums</h2>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{Object.keys(albums).length} albums</span>
      </div>

      {loading ? (
        <div style={{ display: "flex", gap: 16, overflow: "hidden" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ flexShrink: 0, width: 140, display: "flex", flexDirection: "column", gap: 8 }}>
              <Bone h={140} r={10} /><Bone w="70%" h={12} /><Bone w="50%" h={10} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }} className="scrollbar-hide">
          {Object.entries(albums).map(([album, tracks]) => (
            <motion.div key={album} whileHover={{ y: -4 }} style={{ flexShrink: 0, width: 140, cursor: "pointer" }}>
              <div style={{ position: "relative", width: 140, height: 140, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", marginBottom: 8, boxShadow: "0 4px 16px var(--shadow)" }}
                onClick={() => setOpenedAlbum(album)}
              >
                <img src={tracks[0]?.cover_url || Ace} alt={album} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s" }}
                  onMouseEnter={e => e.target.style.transform = "scale(1.06)"}
                  onMouseLeave={e => e.target.style.transform = "scale(1)"}
                />
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(0,0,0,.4)",
                  opacity: 0, transition: "opacity .2s",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "0"}
                >
                  <button onClick={e => { e.stopPropagation(); playAlbum(album); }} style={{
                    width: 36, height: 36, borderRadius: "50%", background: "var(--accent)",
                    border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 12px var(--accent-glow)",
                  }}>
                    <Play size={15} style={{ color: "#fff", transform: "translateX(1px)" }} />
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{album}</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "3px 0 0" }}>{tracks.length} {tracks.length === 1 ? "track" : "tracks"}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Album side panel */}
      <AnimatePresence>
        {openedAlbum && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,.7)", backdropFilter: "blur(6px)" }}
              onClick={() => setOpenedAlbum(null)}
            />
            <motion.div initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 50, width: "min(420px,100vw)", background: "var(--bg-sidebar)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", boxShadow: "-16px 0 48px var(--shadow)" }}
            >
              {/* Header */}
              <div style={{ padding: "28px 20px 16px", background: "linear-gradient(to bottom,var(--bg-card),var(--bg-sidebar))", borderBottom: "1px solid var(--border)", flexShrink: 0, position: "relative" }}>
                <button onClick={() => setOpenedAlbum(null)} style={{ position: "absolute", top: 12, right: 12, padding: 6, borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}>
                  <X size={16} />
                </button>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-end", marginTop: 8 }}>
                  <img src={albums[openedAlbum]?.[0]?.cover_url || Ace} alt={openedAlbum}
                    style={{ width: 96, height: 96, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)", boxShadow: "0 8px 24px var(--shadow)" }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--accent)", margin: "0 0 6px" }}>Album</p>
                    <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px", lineHeight: 1.2 }}>{openedAlbum}</h2>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px" }}>
                      {albums[openedAlbum]?.[0]?.artist_name || "Unknown Artist"} · {albums[openedAlbum].length} songs
                    </p>
                    <button onClick={() => playAlbum(openedAlbum)} style={{
                      display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", borderRadius: 20,
                      background: "var(--accent)", border: "none", cursor: "pointer", color: "#fff",
                      fontWeight: 700, fontSize: 12, fontFamily: "'Outfit',sans-serif",
                      boxShadow: "0 3px 12px var(--accent-glow)",
                    }}>
                      <Play size={13} style={{ transform: "translateX(1px)" }} /> Play Album
                    </button>
                  </div>
                </div>
              </div>

              {/* Tracks */}
              <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 48px", gap: 8, padding: "6px 12px", borderBottom: "1px solid var(--border)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-muted)", marginBottom: 4 }}>
                  <span>#</span><span>Title</span><span style={{ textAlign: "center" }}><Clock size={10} /></span>
                </div>
                {albums[openedAlbum]?.map((raw, i) => {
                  const t = songDefaults(raw);
                  return (
                    <motion.div key={t.id} whileHover={{ backgroundColor: "var(--bg-card)" }} onClick={() => playSong(t.id)}
                      style={{ display: "grid", gridTemplateColumns: "24px 1fr 48px", gap: 8, padding: "9px 12px", borderRadius: 8, cursor: "pointer", alignItems: "center", transition: "background .12s" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", fontWeight: 600 }}>{i + 1}</span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{t.artist_name}</p>
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>{fmtDuration(t.duration_seconds)}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
