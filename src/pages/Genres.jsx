import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Disc3, Music2, Play, LayoutGrid, Heart, TrendingUp } from "lucide-react";
import axios from "axios";
import ApiService from "../services/ApiService";
import { API_CONFIG } from "../config";
import { usePlayer } from "../context/PlayerContext";
import { useUser } from "../context/UserContext";

const BASE = API_CONFIG.AUTH_URL;
const AUTH = API_CONFIG.AUTH_URL; 

// Premium dark colors for fallback tiles
const TILE_COLORS = [
  "#FF4B2B", "#4A00E0", "#00F260", "#F7971E", 
  "#8E2DE2", "#f12711", "#0575E6", "#11998e", 
  "#3a7bd5", "#dd1818", "#7b4397", "#2193b0"
];

function GenreSkeleton() {
  return (
    <div style={{ aspectRatio: "16/9", background: "rgba(0,0,0,0.05)", border: "2px solid #000", position: "relative" }}>
       <div className="bone" style={{ position: "absolute", bottom: 12, left: 12, height: 14, width: "60%", background: "rgba(0,0,0,0.1)" }} />
    </div>
  );
}

export default function Genres() {
  const { user } = useUser();
  const { setCurrentSongId, setQueueUpdated, setUserStarted, setIsPlaying } = usePlayer();
  const [genres, setGenres] = useState([]);
  const [topGenres, setTopGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const list = async () => {
       try {
          const g = await axios.get(`${BASE}/music/genres`);
          setGenres(g.data || []);
          
          if (user?.email) {
             const t = await axios.get(`${AUTH}/top-genres`, { withCredentials: true });
             setTopGenres((t.data || []).slice(0, 4));
          }
       } catch {}
       finally { setLoading(false); }
    };
    list();
  }, [user?.email]);

  const filtered = genres.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const playGenre = async (genreName) => {
    if (!user?.email) return;
    try {
      const res = await axios.get(`${BASE}/music/songs`);
      const genreSongs = res.data.filter(s => s.genre === genreName);
      if (!genreSongs.length) return;
      await axios.post(`${API_CONFIG.QUEUE_URL}/add`, {
        email: user.email,
        songIds: genreSongs.map(s => s.id),
        album: true,
      });
      setCurrentSongId(genreSongs[0].id);
      setUserStarted(true);
      setIsPlaying(true);
      setQueueUpdated(p => !p);
    } catch {}
  };

  const getColor = (idx) => TILE_COLORS[idx % TILE_COLORS.length];

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", minHeight: "80vh", paddingBottom: 60 }}>
      
      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 12, height: 12, background: "#CCFF00", border: "2.5px solid #000" }} />
          <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(0,0,0,0.4)" }}>Discovery Hub</span>
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.05em", color: "#000", lineHeight: 1 }}>
             Marketplace <span style={{ color: "#CCFF00", WebkitTextStroke: "1px #000" }}>Genres</span>
          </h1>

          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(0,0,0,0.4)" }} />
            <input 
              type="text" 
              placeholder="Find your vibe..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                background: "#fff", border: "2.5px solid #000", padding: "10px 14px 10px 36px",
                color: "#000", fontSize: 11, fontWeight: 700, outline: "none", width: 220,
                textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "inherit"
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Your Top Genres ── */}
      {!loading && topGenres.length > 0 && !searchTerm && (
         <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
               <Heart size={18} fill="#000" strokeWidth={0} />
               <h2 style={{ margin: 0, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Top Genres</h2>
               <div style={{ flex: 1, height: 2.5, background: "#000" }} />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
               {topGenres.map((g, i) => (
                 <motion.div
                   key={"top-"+g.id}
                   whileHover={{ scale: 1.02 }}
                   onClick={() => playGenre(g.name)}
                   style={{
                      background: "#000", color: "#fff", padding: 20, border: "2.5px solid #000",
                      display: "flex", alignItems: "center", gap: 16, cursor: "pointer",
                      boxShadow: "6px 6px 0 #CCFF00", position: "relative", overflow: "hidden"
                   }}
                 >
                    <div style={{ width: 44, height: 44, background: getColor(i+5), display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
                       <Music2 size={24} />
                    </div>
                    <div>
                       <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, textTransform: "uppercase", lineHeight: 1 }}>{g.name}</h3>
                       <p style={{ margin: "4px 0 0", fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#CCFF00" }}>{g.play_count} Plays in your history</p>
                    </div>
                    <div style={{ position: "absolute", right: -10, bottom: -10, opacity: 0.1 }}>
                       <TrendingUp size={64} />
                    </div>
                 </motion.div>
               ))}
            </div>
         </div>
      )}

      {/* ── All Genres ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
         <LayoutGrid size={18} />
         <h2 style={{ margin: 0, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>Browse Marketplace</h2>
         <div style={{ flex: 1, height: 2.5, background: "#000", opacity: 0.1 }} />
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
           {Array.from({ length: 8 }).map((_, i) => <GenreSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", border: "3.5px solid #000" }}>
           <Disc3 size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
           <p style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 14 }}>Try another mood</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
           {filtered.map((g, i) => (
             <motion.div
               key={g.id}
               className="genre-tile"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.03 }}
               whileHover={{ scale: 1.02, y: -4 }}
               onClick={() => playGenre(g.name)}
               style={{
                 position: "relative", aspectRatio: "16/9", background: g.image_url ? "#000" : getColor(i),
                 border: "2.5px solid #000", cursor: "pointer", overflow: "hidden",
                 boxShadow: "4px 4px 0 #000"
               }}
             >
               {g.image_url && (
                 <img src={g.image_url} alt={g.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
               )}
               
               <div style={{ position: "absolute", inset: 0, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between", background: "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                     <div style={{ width: 32, height: 32, background: "#000", color: "#CCFF00", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "2px solid #CCFF00", opacity: 0 }} className="genre-play-btn">
                        <Play size={14} fill="currentColor" />
                     </div>
                  </div>
                  
                  <div>
                    <h3 style={{ margin: 0, fontSize: 24, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.04em", color: "#fff", lineHeight: 0.9 }}>{g.name}</h3>
                    <p style={{ margin: "4px 0 0", fontSize: 9, fontWeight: 900, textTransform: "uppercase", color: "#CCFF00", letterSpacing: "0.1em" }}>
                      {g.song_count || 0} {parseInt(g.song_count) === 1 ? "Track" : "Tracks"}
                    </p>
                  </div>
               </div>
               <style>{`
                 .genre-tile:hover .genre-play-btn { opacity: 1 !important; transform: scale(1.1); }
               `}</style>
             </motion.div>
           ))}
        </div>
      )}
    </div>
  );
}
