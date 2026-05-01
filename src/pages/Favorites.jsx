import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { usePlayer } from "../context/PlayerContext";
import axios from "axios";
import ApiService from "../services/ApiService";
import { API_CONFIG } from "../config";
import { Play, Heart, Clock, MoreHorizontal } from "lucide-react";

export default function Favorites() {
  const { user } = useUser();
  const { setCurrentSongId, setQueueUpdated, setUserStarted, setIsPlaying } = usePlayer();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      try {
        const res = await axios.get(`${API_CONFIG.MUSIC_URL}/favorites/${user.email}`);
        setSongs(res.data || []);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [user]);

  const playSong = async (id) => {
    try {
      await axios.post(`${ApiService.getBaseUrl()}/queue/add`, { email: user.email, songIds: [id] });
      setCurrentSongId(id); setQueueUpdated(prev => !prev);
      setUserStarted(true);
      setIsPlaying(true);
    } catch {}
  };

  if (loading) return <div style={{ color: "#CCFF00", fontWeight: 900, padding: 40 }}>SCANNING_FAVORITES...</div>;

  return (
    <div>
      <div style={{ marginBottom: 60 }}>
         <h1 style={{ fontSize: "4rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.04em", margin: 0 }}>Favourites</h1>
         <p style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 13, opacity: 0.4, letterSpacing: "0.1em" }}>{songs.length} Tracks pinned to collection.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", border: "3px solid #000" }}>
         {songs.length > 0 ? (
           <>
             {/* Header */}
             <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 100px 40px", padding: "16px 20px", background: "#000", color: "#fff", fontWeight: 900, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                <span>#</span>
                <span>Title</span>
                <span>Album</span>
                <span>Time</span>
                <span></span>
             </div>
             
             {/* List */}
             {songs.map((s, i) => (
                <div key={s.id} onClick={() => playSong(s.id)} style={{ 
                  display: "grid", gridTemplateColumns: "60px 1fr 1fr 100px 40px", padding: "16px 20px", 
                  alignItems: "center", borderBottom: "1px solid #000", background: "#fff", 
                  cursor: "pointer", transition: "all 0.1s" 
                }} onMouseEnter={e => e.currentTarget.style.background = "#CCFF00"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                   <span style={{ fontWeight: 900, opacity: 0.2 }}>{String(i + 1).padStart(2, "0")}</span>
                   <div>
                      <p style={{ fontWeight: 900, margin: 0, textTransform: "uppercase", fontSize: 13 }}>{s.title}</p>
                      <p style={{ fontWeight: 800, opacity: 0.4, fontSize: 10, margin: 0 }}>{s.artist_name}</p>
                   </div>
                   <span style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 11, opacity: 0.5 }}>{s.album_name || "Single"}</span>
                   <span style={{ fontWeight: 800, fontSize: 12, opacity: 0.4 }}>3:45</span>
                   <Heart size={14} fill="#000" />
                </div>
             ))}
           </>
         ) : (
           <div style={{ padding: 100, textAlign: "center", fontWeight: 900, textTransform: "uppercase", opacity: 0.2 }}>NO_FAVORITES_PINNED</div>
         )}
      </div>
    </div>
  );
}
