import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Play, Heart, Clock } from "lucide-react";
import { useUser } from "../../../context/UserContext";
import { usePlayer } from "../../../context/PlayerContext";
import ApiService from "../../../services/ApiService";
import { API_CONFIG } from "../../../config";
import toast from "react-hot-toast";
import { songDefaults, fmtDuration } from "../../../utils/songUtils";

const Bone = ({ w = "100%", h = 14, r = 6 }) => <div className="bone" style={{ width: w, height: h, borderRadius: r }} />;

export default function Favourites() {
  const [favourites,       setFavourites      ] = useState([]);
  const [localFavUpdated,  setLocalFavUpdated ] = useState(false);
  const [loading,          setLoading         ] = useState(true);
  const [error,            setError           ] = useState("");

  const { user } = useUser();
  const { setCurrentSongId, setQueueUpdated, favoritesUpdated: globalFavUpdated, setFavoritesUpdated: setGlobalFav } = usePlayer();
  const email = user?.email;

  useEffect(() => {
    if (!email) return;
    const fetch_ = async () => {
      try {
        setLoading(true); setError("");
        const res = await axios.get(`${API_CONFIG.AUTH_URL}/favourites/${email}`);
        const ids = res.data.favourites || [];
        if (!ids.length) { setFavourites([]); return; }
        const detailed = await Promise.all(ids.map(async id => {
          try { const s = await axios.get(`${API_CONFIG.MUSIC_URL}/songs/${id}`); return songDefaults({ id, ...s.data }); }
          catch { return null; }
        }));
        setFavourites(detailed.filter(Boolean));
      } catch { setError("Failed to load favourites."); }
      finally { setLoading(false); }
    };
    fetch_();
  }, [email, localFavUpdated, globalFavUpdated]);

  const playSong = async id => {
    if (!email) return;
    try {
      await axios.post(`${API_CONFIG.QUEUE_URL}/add`, { email, songIds: [id], album: false });
      setCurrentSongId(id); setQueueUpdated(p => !p);
    } catch {}
  };

  const removeFav = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.post(`${API_CONFIG.AUTH_URL}/favourites/remove`, { email, songIds: [id] });
      setLocalFavUpdated(p => !p); setGlobalFav(p => !p);
      toast.success("Removed");
    } catch { toast.error("Failed"); }
  };

  return (
    <div style={{ marginTop: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Heart size={16} style={{ color: "var(--accent)" }} fill="currentColor" />
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Favourites</h2>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{favourites.length} {favourites.length === 1 ? "song" : "songs"}</span>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 16, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", color: "#fca5a5", fontSize: 13 }}>{error}</div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 8 }}>
              <Bone w={20} h={12} /><Bone w={38} h={38} r={6} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                <Bone w="55%" h={12} /><Bone w="35%" h={10} />
              </div>
              <Bone w={30} h={11} />
            </div>
          ))}
        </div>
      ) : favourites.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", borderRadius: 12, textAlign: "center", border: "2px dashed var(--border)" }}>
          <Heart size={36} style={{ color: "var(--text-muted)", marginBottom: 12, opacity: .3 }} />
          <p style={{ fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px", fontFamily: "'Syne',sans-serif" }}>No Favourites Yet</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Tap the heart on any song to save it here.</p>
        </div>
      ) : (
        <div>
          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "28px 1fr auto 60px 28px", gap: 10, padding: "6px 12px", marginBottom: 4, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
            <span>#</span><span>Title</span><span style={{ display: "none" }}>Album</span>
            <span style={{ display: "flex", justifyContent: "center" }}><Clock size={11} /></span>
            <span />
          </div>
          {favourites.map((song, i) => (
            <FavRow key={song.id} rank={i + 1} song={song} onPlay={() => playSong(song.id)} onRemove={e => removeFav(song.id, e)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FavRow({ rank, song, onPlay, onRemove }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      whileHover={{ backgroundColor: "var(--bg-card)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onPlay}
      style={{ display: "grid", gridTemplateColumns: "28px 1fr auto 60px 28px", gap: 10, padding: "8px 12px", borderRadius: 8, cursor: "pointer", alignItems: "center", transition: "background .15s" }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textAlign: "center", position: "relative" }}>
        {hovered
          ? <Play size={12} style={{ color: "var(--accent)", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
          : rank
        }
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <img src={song.cover_url} alt={song.title} style={{ width: 38, height: 38, borderRadius: 6, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }} onError={e => e.target.src = "/default-album.jpg"} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{song.artist_name}</p>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{song.album_title}</p>
      <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", margin: 0 }}>{fmtDuration(song.duration_seconds)}</p>
      <button onClick={onRemove} style={{
        padding: 4, borderRadius: 6, border: "none", cursor: "pointer",
        background: "transparent", color: "var(--accent)", display: "flex",
        alignItems: "center", justifyContent: "center",
        opacity: hovered ? 1 : 0, transition: "opacity .15s",
      }}>
        <Heart size={14} fill="currentColor" />
      </button>
    </motion.div>
  );
}
