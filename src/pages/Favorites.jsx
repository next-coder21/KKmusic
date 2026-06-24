import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import { usePlayer } from "../context/PlayerContext";
import http from "../services/http";
import { Play, Heart, Clock, Shuffle } from "lucide-react";
import AlbumArt from "../components/common/AlbumArt";

export default function Favorites() {
  const { user } = useUser();
  const { setCurrentSongId, setQueueUpdated, setUserStarted, setIsPlaying, favoritesUpdated } = usePlayer();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await http.get("/auth/favourites");
        const ids = res.data.favourites || [];
        if (!ids.length) { setSongs([]); return; }
        const detailed = await Promise.all(ids.map(async id => {
          try { const s = await http.get(`/auth/music/songs/${id}`); return { id, ...s.data }; }
          catch { return null; }
        }));
        setSongs(detailed.filter(Boolean));
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [user, favoritesUpdated]);

  const playSong = (id) => {
    setCurrentSongId(id);
    setUserStarted(true);
    setIsPlaying(true);
    http.post("/auth/queue/add", { songIds: [id] })
      .then(() => setQueueUpdated(prev => !prev))
      .catch(() => {});
  };

  const playAll = () => {
    if (!songs.length) return;
    setCurrentSongId(songs[0].id);
    setUserStarted(true);
    setIsPlaying(true);
    http.post("/auth/queue/add", { songIds: songs.map(s => s.id) })
      .then(() => setQueueUpdated(prev => !prev))
      .catch(() => {});
  };

  const shufflePlay = () => {
    if (!songs.length) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    setCurrentSongId(shuffled[0].id);
    setUserStarted(true);
    setIsPlaying(true);
    http.post("/auth/queue/add", { songIds: shuffled.map(s => s.id) })
      .then(() => setQueueUpdated(prev => !prev))
      .catch(() => {});
  };

  const fmtDuration = (sec) => {
    if (!sec) return "--:--";
    return `${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,"0")}`;
  };

  if (loading) {
    return (
      <div className="fav-page">
        <div className="fav-hero">
          <div style={{ marginBottom:12 }}>
            <div className="lib-skeleton-bone" style={{ width:120, height:10, marginBottom:16 }} />
            <div className="lib-skeleton-bone" style={{ width:280, height:40, marginBottom:10 }} />
            <div className="lib-skeleton-bone" style={{ width:160, height:12 }} />
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {Array.from({length:7}).map((_,i) => (
            <div key={i} className="fav-skeleton-row">
              <div className="lib-skeleton-bone" style={{ width:20, height:12 }} />
              <div className="lib-skeleton-bone" style={{ width:44, height:44, borderRadius:8 }} />
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <div className="lib-skeleton-bone" style={{ width:"80%", height:13 }} />
                <div className="lib-skeleton-bone" style={{ width:"50%", height:10 }} />
              </div>
              <div className="lib-skeleton-bone" style={{ width:"60%", height:10 }} />
              <div className="lib-skeleton-bone" style={{ width:36, height:10 }} />
              <div className="lib-skeleton-bone" style={{ width:14, height:14, borderRadius:"50%" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fav-page">
      {/* Hero section */}
      <div className="fav-hero">
        <div className="fav-hero-eyebrow">
          <Heart size={16} className="fav-hero-heart-icon" aria-hidden="true" />
          <span className="fav-hero-eyebrow-text">Your Collection</span>
        </div>
        <h1 className="fav-hero-title">Favourites</h1>
        <p className="fav-hero-subtitle">{songs.length} {songs.length === 1 ? "track" : "tracks"} pinned to collection</p>

        {songs.length > 0 && (
          <div className="fav-hero-actions">
            <button onClick={playAll} className="fav-play-all-btn" aria-label="Play all favourites">
              <Play size={16} fill="currentColor" aria-hidden="true" /> Play All
            </button>
            <button onClick={shufflePlay} className="fav-shuffle-btn" aria-label="Shuffle play favourites">
              <Shuffle size={14} aria-hidden="true" /> Shuffle
            </button>
          </div>
        )}
      </div>

      {songs.length > 0 ? (
        <>
          {/* Header */}
          <div className="fav-list-header" role="row" aria-hidden="true">
            <span className="fav-header-cell">#</span>
            <span className="fav-header-cell" />
            <span className="fav-header-cell">Title</span>
            <span className="fav-header-cell fav-header-cell--album">Album</span>
            <span className="fav-header-cell">Time</span>
            <span className="fav-header-cell" />
          </div>

          {/* Track rows */}
          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            {songs.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity:0, y:6 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.03, duration:0.2 }}
              >
                <div
                  className="fav-track-row"
                  onClick={() => playSong(s.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Play ${s.title} by ${s.artist_name}`}
                  onKeyDown={e => e.key === "Enter" && playSong(s.id)}
                >
                  <span className="fav-track-index">{String(i + 1).padStart(2, "0")}</span>
                  <AlbumArt src={s.cover_url} title={s.album_title || s.title} size={40} radius="6px" className="fav-track-thumb" />
                  <div className="fav-track-info">
                    <p className="fav-track-title">{s.title}</p>
                    <p className="fav-track-artist">{s.artist_name}</p>
                  </div>
                  <span className="fav-track-album">{s.album_title || "Single"}</span>
                  <span className="fav-track-duration">{fmtDuration(s.duration_seconds)}</span>
                  <Heart size={14} className="fav-track-heart" fill="currentColor" aria-label="Favourited" />
                </div>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <div className="fav-empty">
          <Heart size={56} className="fav-empty-icon" aria-hidden="true" />
          <p className="fav-empty-title">No Favourites Yet</p>
          <p className="fav-empty-sub">Like songs to see them here</p>
        </div>
      )}
    </div>
  );
}
