import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic2, Search, Play, Music2, TrendingUp, ChevronRight } from "lucide-react";
import axios from "axios";
import ApiService from "../services/ApiService";
import { API_CONFIG } from "../config";
import { usePlayer } from "../context/PlayerContext";
import { useUser } from "../context/UserContext";

const BASE = API_CONFIG.AUTH_URL;

const SORTS = ["A–Z", "Z–A", "Most Tracks"];

function ArtistSkeleton() {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "2px solid rgba(255,255,255,0.06)" }}>
      <div style={{ background: "rgba(255,255,255,0.06)", height: 180 }} className="bone" />
      <div style={{ padding: "14px 16px" }}>
        <div className="bone" style={{ height: 12, width: "70%", marginBottom: 8, background: "rgba(255,255,255,0.06)" }} />
        <div className="bone" style={{ height: 8, width: "40%", background: "rgba(255,255,255,0.04)" }} />
      </div>
    </div>
  );
}

export default function Artists() {
  const { setCurrentSongId, setQueueUpdated, setUserStarted, setIsPlaying } = usePlayer();
  const { user } = useUser();
  const email = user?.email;
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState("Most Tracks");
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    axios.get(`${BASE}/music/artists`)
      .then(r => setArtists(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = artists.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (sort === "A–Z") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "Z–A") list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    else list = [...list].sort((a, b) => (parseInt(b.song_count) || 0) - (parseInt(a.song_count) || 0));
    return list;
  }, [artists, searchTerm, sort]);

  const playSongsByArtist = async (artistId) => {
    if (!email) return;
    try {
      const allSongs = await axios.get(`${BASE}/music/songs`);
      const artistSongs = (allSongs.data || []).filter(s => s.artist_id === artistId);
      if (!artistSongs.length) return;
      await axios.post(`${API_CONFIG.QUEUE_URL}/add`, {
        email,
        songIds: artistSongs.map(s => s.id),
        album: true,
      });
      setCurrentSongId(artistSongs[0].id);
      setUserStarted(true);
      setIsPlaying(true);
      setQueueUpdated(p => !p);
    } catch {}
  };

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", minHeight: "80vh", color: "#000" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 4, height: 4, background: "#000", borderRadius: "50%" }} />
          <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.25em", color: "rgba(0,0,0,0.4)" }}>Artist Roster</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <h1 style={{
            margin: 0, fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 900,
            textTransform: "uppercase", letterSpacing: "-0.05em", lineHeight: 1,
            color: "#000"
          }}>
            Discovery <span style={{ color: "#CCFF00", WebkitTextStroke: "1px #000" }}>Artists</span>
          </h1>

          {/* Search + Sort */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(0,0,0,0.4)" }} />
              <input
                type="text"
                placeholder="Find an artist..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  background: "#fff",
                  border: "2.5px solid #000",
                  padding: "10px 14px 10px 34px",
                  color: "#000", fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                  outline: "none", width: 220, textTransform: "uppercase",
                  letterSpacing: "0.04em", transition: "all 0.2s"
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {SORTS.map(s => (
                <button key={s} onClick={() => setSort(s)} style={{
                  padding: "9px 12px", fontSize: 9, fontWeight: 900, fontFamily: "inherit",
                  textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer",
                  background: sort === s ? "#CCFF00" : "#fff",
                  color: "#000",
                  border: "2.5px solid #000",
                  boxShadow: sort === s ? "2px 2px 0 #000" : "none",
                  transform: sort === s ? "translate(-2px, -2px)" : "none",
                  transition: "all 0.15s"
                }}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        {!loading && (
          <div style={{ display: "flex", gap: 32, marginTop: 24, paddingTop: 20, borderTop: "2.5px solid #000" }}>
            <div>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#000", lineHeight: 1 }}>{artists.length}</p>
              <p style={{ margin: 0, fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(0,0,0,0.4)" }}>Verified Artists</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#000", lineHeight: 1 }}>
                {artists.reduce((acc, a) => acc + (parseInt(a.song_count) || 0), 0)}
              </p>
              <p style={{ margin: 0, fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(0,0,0,0.4)" }}>Total Catalog</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 24 }}>
          {Array.from({ length: 8 }).map((_, i) => <ArtistSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", border: "3.5px solid #000", background: "#f9f9f9" }}>
          <Mic2 size={48} style={{ color: "#000", opacity: 0.1, marginBottom: 16 }} />
          <h2 style={{ fontWeight: 900, textTransform: "uppercase", margin: "0 0 8px", fontSize: 18 }}>No Artists Found</h2>
          <p style={{ fontWeight: 700, color: "rgba(0,0,0,0.4)", fontSize: 10, textTransform: "uppercase" }}>Try a different search term</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={sort + searchTerm}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 24 }}
          >
            {filtered.map((ar, i) => (
              <motion.div
                key={ar.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                onMouseEnter={() => setHovered(ar.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => playSongsByArtist(ar.id)}
                style={{
                  background: "#fff",
                  border: "3px solid #000",
                  cursor: "pointer", position: "relative", overflow: "hidden",
                  boxShadow: hovered === ar.id ? "8px 8px 0 #000" : "4px 4px 0 #000",
                  transform: hovered === ar.id ? "translate(-4px, -4px)" : "none",
                  transition: "all 0.1s ease-out"
                }}
              >
                {/* Rank badge */}
                <div style={{
                  position: "absolute", top: 12, left: 12, zIndex: 3,
                  padding: "4px 8px", background: "#CCFF00",
                  fontSize: 10, fontWeight: 900, color: "#000", border: "2px solid #000"
                }}>#{i + 1}</div>

                {/* Artist image */}
                <div style={{ width: "100%", aspectRatio: "1/1", overflow: "hidden", background: "#f0f0f0", borderBottom: "3px solid #000" }}>
                  {ar.image_url ? (
                    <img
                      src={ar.image_url}
                      alt={ar.name}
                      style={{
                        width: "100%", height: "100%", objectFit: "cover", display: "block",
                        filter: hovered === ar.id ? "grayscale(0%)" : "grayscale(30%)",
                        transition: "filter 0.3s ease"
                      }}
                      onError={e => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
                      <Mic2 size={48} style={{ color: "rgba(0,0,0,0.1)" }} />
                    </div>
                  )}

                  {/* Play overlay overlay icon */}
                  {hovered === ar.id && (
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "rgba(204,255,0,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <div style={{ width: 60, height: 60, background: "#000", color: "#CCFF00", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #CCFF00" }}>
                        <Play size={24} fill="currentColor" style={{ marginLeft: 4 }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "12px 14px 14px", background: hovered === ar.id ? "#CCFF00" : "#fff", transition: "background 0.1s" }}>
                  <p style={{
                    margin: "0 0 4px", fontSize: 13, fontWeight: 900,
                    textTransform: "uppercase", letterSpacing: "-0.02em",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    color: "#000"
                  }}>{ar.name}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: "rgba(0,0,0,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {ar.song_count || 0} Tracks
                    </span>
                    <ChevronRight size={14} style={{ opacity: hovered === ar.id ? 1 : 0.2 }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
