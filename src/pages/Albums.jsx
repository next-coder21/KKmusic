import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Disc, Search, Play, Plus } from "lucide-react";
import axios from "axios";
import ApiService from "../services/ApiService";
import { API_CONFIG } from "../config";
import { usePlayer } from "../context/PlayerContext";
import { useUser } from "../context/UserContext";
import toast, { Toaster } from "react-hot-toast";

const BASE = API_CONFIG.AUTH_URL;

export default function Albums() {
  const { user } = useUser();
  const { setCurrentSongId, setQueueUpdated, setUserStarted, setIsPlaying } = usePlayer();
  const email = user?.email;

  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const r = await axios.get(`${API_CONFIG.MUSIC_URL}/albums`);
        setAlbums(r.data || []);
      } catch (error) {
        console.error("Failed to fetch albums:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);

  const playAlbum = async (albumId) => {
    if (!email) {
      toast.error("Please login to play music");
      return;
    }
    try {
      // Find songs in this album
      const res = await axios.get(`${API_CONFIG.MUSIC_URL}/songs`);
      const albumSongs = res.data.filter(s => s.album_id === albumId);
      
      if (albumSongs.length === 0) {
        toast.error("This album has no tracks");
        return;
      }

      await axios.post(`${API_CONFIG.QUEUE_URL}/add`, { 
        email, 
        songIds: albumSongs.map(s => s.id), 
        album: true 
      });
      
      setCurrentSongId(albumSongs[0].id);
      setUserStarted(true);
      setIsPlaying(true);
      setQueueUpdated(p => !p);
      toast.success(`Playing: ${albums.find(a => a.id === albumId)?.title}`);
    } catch (e) {
      toast.error("Failed to play album");
    }
  };

  const filteredAlbums = albums.filter((al) =>
    al.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (al.artist_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: "10px 0" }}>
      <Toaster position="top-right" />
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
           <div style={{ width: 30, height: 3, background: "#000", marginBottom: 12 }} />
           <p style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 9, letterSpacing: "0.15em", marginBottom: 4, opacity: 0.5 }}>Discovery Hub</p>
           <h1 style={{ fontSize: "2rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.04em", margin: 0, lineHeight: 1 }}>
             All Albums
           </h1>
        </div>

        <div style={{ position: "relative", minWidth: 260 }}>
          <Search size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#000" }} />
          <input
            type="text"
            placeholder="Search albums..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: "#fff",
              border: "2px solid #000",
              borderRadius: 0,
              padding: "12px 16px 12px 40px",
              color: "#000",
              fontSize: 12,
              fontWeight: 700,
              outline: "none",
              width: "100%",
              fontFamily: "inherit",
              textTransform: "uppercase"
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ border: "2px solid #000", padding: 8, background: "#f5f5f5", opacity: 0.2, height: 220 }} />
          ))}
        </div>
      ) : filteredAlbums.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", border: "3px solid #000", background: "#f9f9f9" }}>
          <Disc size={48} style={{ color: "#000", marginBottom: 16, opacity: 0.1 }} />
          <h2 style={{ fontWeight: 900, textTransform: "uppercase", margin: "0 0 8px", fontSize: 18 }}>No Matches Found</h2>
          <p style={{ fontWeight: 700, opacity: 0.4, fontSize: 10, textTransform: "uppercase" }}>Try a different search term</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20 }}>
          {filteredAlbums.map((al) => (
            <motion.div
              key={al.id}
              whileHover={{ scale: 1.02 }}
              style={{ 
                background: "#fff", 
                border: "2px solid #000", 
                padding: 10,
                cursor: "pointer",
                position: "relative"
              }}
              onClick={() => playAlbum(al.id)}
            >
              <div style={{ position: "relative", marginBottom: 10, border: "2px solid #000", overflow: "hidden" }}>
                <img
                  src={al.cover_url || "/default-album.jpg"}
                  alt={al.title}
                  style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }}
                  onError={(e) => (e.target.src = "/default-album.jpg")}
                />
                <div style={{ 
                  position: "absolute", top: 6, right: 6, 
                  width: 24, height: 24, background: "#CCFF00", border: "1.5px solid #000",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900,
                  fontSize: 10
                }}>↗</div>
              </div>
              
              <h3 style={{ fontSize: "0.9rem", fontWeight: 900, textTransform: "uppercase", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{al.title}</h3>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "rgba(0,0,0,0.4)", margin: "0 0 8px" }}>{al.artist_name || "Unknown Artist"}</p>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", background: "#000", color: "#fff", padding: "1px 5px" }}>{al.song_count} Tracks</span>
                <div 
                  onClick={(e) => { e.stopPropagation(); playAlbum(al.id); }}
                  style={{ width: 28, height: 28, background: "#000", color: "#CCFF00", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                   <Play size={12} fill="currentColor" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
