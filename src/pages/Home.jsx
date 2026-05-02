import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import http from "../services/http";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, TrendingUp, Music2, Headphones, Sparkles, Zap, Mic2, X } from "lucide-react";
import { useUser } from "../context/UserContext";
import { usePlayer } from "../context/PlayerContext";
import ApiService from "../services/ApiService";
import { API_CONFIG } from "../config";
import { Toaster } from "react-hot-toast";
import { songDefaults, fmtDuration } from "../utils/songUtils";

const COLORS = {
  primary: "#CCFF00",
  bg: "#fff",
  text: "#000",
  muted: "rgba(0,0,0,0.4)"
};

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-end", gap: 12 }}>
    {Icon && <div style={{ width: 44, height: 44, background: "#000", color: "#CCFF00", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, marginBottom: 4 }}>
      <Icon size={22} />
    </div>}
    <div>
      <h2 style={{ fontSize: "1.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.04em", margin: 0, lineHeight: 1 }}>{title}</h2>
      {subtitle && <p style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 10, opacity: 0.4, letterSpacing: "0.12em", marginTop: 4, margin: 0 }}>{subtitle}</p>}
    </div>
  </div>
);

function ChartRow({ rank, song, onPlay }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      onClick={onPlay}
      style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.05)", cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        background: "transparent", position: "relative"
      }}
      className="chart-row-hover"
    >
      <div style={{ width: 30, fontWeight: 900, fontSize: "1.1rem", opacity: 0.15, fontStyle: "italic" }}>{rank < 10 ? `0${rank}` : rank}</div>
      <div style={{ width: 48, height: 48, background: "#f0f0f0", border: "1.5px solid #000", overflow: "hidden", flexShrink: 0 }}>
        <img src={song.cover_url} alt={song.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.src = "/default-album.jpg"} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 12, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
           <p style={{ fontWeight: 700, opacity: 0.5, fontSize: 10, textTransform: "uppercase", margin: 0 }}>{song.artist_name}</p>
           {song.play_count > 100 && <div style={{ background: "#CCFF00", fontSize: 8, fontWeight: 900, padding: "1px 4px", borderRadius: 2 }}>HOT</div>}
        </div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 11, opacity: 0.3, letterSpacing: "0.05em" }}>{fmtDuration(song.duration_seconds)}</div>
      <div className="play-button-small" style={{ width: 34, height: 34, background: "#000", color: "#CCFF00", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: 0, transform: "scale(0.8)", transition: "all 0.2s" }}>
        <Play size={14} fill="currentColor" />
      </div>
      <style>{`
        .chart-row-hover:hover { background: rgba(0,0,0,0.02); }
        .chart-row-hover:hover .play-button-small { opacity: 1; transform: scale(1); }
      `}</style>
    </motion.div>
  );
}

export default function Home() {
  const { user } = useUser();
  const { setCurrentSongId, setQueueUpdated, setUserStarted, setIsPlaying } = usePlayer();
  const navigate = useNavigate();
  const email = user?.email;

  const [songs,    setSongs]    = useState([]);
  const [artists,  setArtists]  = useState([]);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeAd, setActiveAd] = useState(null);

  useEffect(() => {
    let alive = true;

    const fetchAll = async () => {
      try {
        const [songsRes, artistsRes] = await Promise.all([
          axios.get(`${API_CONFIG.MUSIC_URL}/songs`),
          axios.get(`${API_CONFIG.MUSIC_URL}/artists`),
        ]);
        if (alive) {
          setSongs(songsRes.data || []);
          setArtists(artistsRes.data || []);
        }
      } catch {}

      // Fetch play history for personalised Daily Discovery
      if (email) {
        try {
          const h = await http.get("/auth/play-history");
          if (alive) setHistory(h.data || []);
        } catch {}
      }

      if (alive) setLoading(false);
    };

    fetchAll();

    // Fetch Active Ad for popup (once per session)
    if (!sessionStorage.getItem("muve_ad_shown")) {
      axios.get(`${API_CONFIG.AUTH_URL}/ads/active`)
        .then(res => { if (alive && res.data) setActiveAd(res.data); })
        .catch(() => {});
    }

    return () => { alive = false; };
  }, [email]);

  const closeAd = () => {
    setActiveAd(null);
    sessionStorage.setItem("muve_ad_shown", "true");
  };

  const playSong = async (id) => {
    if (!email) return;
    try {
      await http.post("/auth/queue/add", { songIds: [id], album: false });
      setCurrentSongId(id);
      setUserStarted(true);
      setIsPlaying(true);
      setQueueUpdated(p => !p);
    } catch {}
  };

  // Carousel State
  const [heroIdx, setHeroIdx] = useState(0);

  // Logic: Sort by play_count for trending
  const sortedSongs = useMemo(() => {
    const seen = new Set();
    return [...songs]
      .filter(s => { const id = s.id ?? s._id; if (seen.has(id)) return false; seen.add(id); return true; })
      .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
      .map(songDefaults);
  }, [songs]);

  const trendingSongs = sortedSongs.slice(0, 5);
  const heroSongs     = sortedSongs.slice(0, 5);
  const heroSong      = heroSongs[heroIdx];

  // Artist Radar — real artist data sorted by song count
  const radarArtists = useMemo(() => {
    return [...artists]
      .sort((a, b) => (parseInt(b.song_count) || 0) - (parseInt(a.song_count) || 0))
      .slice(0, 6);
  }, [artists]);

  // Daily Discovery — user's recently played songs; fallback to top songs
  const mixSongs = useMemo(() => {
    if (history.length > 0) {
      const seen = new Set();
      const unique = history.filter(s => {
        const id = s.id ?? s._id;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      return unique.slice(0, 6).map(songDefaults);
    }
    return sortedSongs.slice(0, 6);
  }, [history, sortedSongs]);

  // Auto-slide carousel
  useEffect(() => {
    if (loading || heroSongs.length === 0) return;
    const interval = setInterval(() => {
      setHeroIdx(prev => (prev + 1) % heroSongs.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [loading, heroSongs.length]);

  if (loading) return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 40, height: 40, border: "4px solid #f3f3f3", borderTop: "4px solid #CCFF00", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ padding: "0" }}>
      <Toaster position="top-right" />

      {/* ── ADVERTISEMENT MODAL ── */}
      <AnimatePresence>
        {activeAd && (
          <div
            onClick={closeAd}
            style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.92, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{ background: "#fff", border: "4px solid #000", maxWidth: 480, width: "90%", position: "relative", boxShadow: "14px 14px 0 #CCFF00" }}
            >
              {/* AD badge */}
              <div style={{ position: "absolute", top: 0, left: 0, background: "#000", color: "#CCFF00", fontSize: 9, fontWeight: 900, padding: "3px 8px", letterSpacing: "0.15em" }}>AD</div>

              {/* Close button */}
              <button
                onClick={closeAd}
                style={{ position: "absolute", top: -18, right: -18, width: 40, height: 40, background: "#000", color: "#CCFF00", border: "2.5px solid #CCFF00", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2 }}
              >
                <X size={20} strokeWidth={3} />
              </button>

              {/* Image */}
              {activeAd.banner_image_url && (
                <div style={{ width: "100%", height: 260, overflow: "hidden", borderBottom: "3px solid #000" }}>
                  <img src={activeAd.banner_image_url} alt="Ad" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}

              {/* Body */}
              <div style={{ padding: "20px 24px 24px" }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.04em", color: "#000", margin: "0 0 16px", lineHeight: 1 }}>{activeAd.title}</h2>

                {activeAd.target_url ? (
                  <a
                    href={activeAd.target_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={closeAd}
                    style={{ display: "block", textAlign: "center", padding: "14px", background: "#000", color: "#CCFF00", fontWeight: 900, textTransform: "uppercase", border: "2.5px solid #000", textDecoration: "none", fontSize: 13, letterSpacing: "0.05em" }}
                  >
                    Learn More ↗
                  </a>
                ) : null}

                <button onClick={closeAd} style={{ width: "100%", marginTop: 12, background: "none", border: "none", color: "rgba(0,0,0,0.35)", fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Skip Ad ×
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── HERO SECTION (CAROUSEL) ── */}
      <section style={{ marginBottom: 48, position: "relative" }}>
        <div className="home-hero-grid" style={{
          background: "#fff",
          padding: "24px",
          border: "4px solid #000",
          boxShadow: "10px 10px 0 #000",
          minHeight: 220
        }}>
          <div style={{ overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ background: "#CCFF00", padding: "3px 8px", fontWeight: 900, fontSize: 9, textTransform: "uppercase", border: "1.5px solid #000" }}>HOT RIGHT NOW</div>
              <motion.div animate={{ rotate: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                <TrendingUp size={12} color="#000" />
              </motion.div>
            </div>
            
            <AnimatePresence mode="wait">
              {heroSong && (
                <motion.div key={heroSong.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.4 }}>
                  <h1 style={{ fontSize: "2.4rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: 0.95, margin: "0 0 12px", width: "110%" }}>
                    {heroSong.title}
                  </h1>
                  <p style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 10, opacity: 0.4, marginBottom: 24, letterSpacing: "0.1em" }}>
                    By <span style={{ color: "#000", opacity: 1 }}>{heroSong.artist_name}</span> · Ranked #{heroIdx + 1}
                  </p>
                  
                  <div style={{ display: "flex", gap: 12 }}>
                    <button 
                      onClick={() => playSong(heroSong.id)}
                      style={{ 
                        padding: "12px 24px", background: "#000", color: "#fff", 
                        fontWeight: 900, textTransform: "uppercase", border: "none", 
                        cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 8 
                      }}
                    >
                      <Play size={14} fill="#CCFF00" color="#CCFF00" /> Launch Play
                    </button>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                       {heroSongs.map((_, i) => (
                         <div key={i} onClick={() => setHeroIdx(i)} style={{ width: 8, height: 8, background: i === heroIdx ? "#000" : "rgba(0,0,0,0.1)", borderRadius: "50%", cursor: "pointer", transition: "all 0.3s" }} />
                       ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ position: "relative", justifySelf: "center" }}>
             <AnimatePresence mode="wait">
                <motion.div 
                  key={heroSong?.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ width: 220, height: 220, background: "#000", position: "relative" }}
                >
                  <img 
                    src={heroSong?.cover_url} 
                    style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: "-8px 8px 8px -8px", border: "3px solid #000" }} 
                    alt="Album" 
                  />
                  <div style={{ position: "absolute", bottom: -12, left: -20, background: "#CCFF00", border: "2px solid #000", padding: "6px 10px", fontWeight: 900, fontSize: 11 }}>
                     TOP {heroIdx + 1}
                  </div>
                </motion.div>
             </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── SECONDARY GRID ── */}
      <div className="home-secondary-grid" style={{ marginBottom: 80 }}>
        
        {/* Left: Artist Radar */}
        <section>
          <SectionHeader icon={Sparkles} title="Artist Radar" subtitle="Top artists in the catalog" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 24 }}>
            {radarArtists.map((artist) => (
              <motion.div
                whileHover={{ y: -5 }}
                key={artist.id}
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/artists")}
              >
                <div style={{
                  width: "100%", aspectRatio: "1/1.1",
                  background: "#f0f0f0", border: "2px solid #000",
                  marginBottom: 12, overflow: "hidden", position: "relative"
                }}>
                  {artist.image_url
                    ? <img src={artist.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={artist.name} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#e8e8e8" }}><Music2 size={40} style={{ opacity: 0.2 }} /></div>
                  }
                  <div style={{
                    position: "absolute", bottom: 0, width: "100%", padding: "6px",
                    background: "rgba(204, 255, 0, 0.95)", borderTop: "2px solid #000",
                    fontWeight: 900, fontSize: 9, textTransform: "uppercase", textAlign: "center"
                  }}>VERIFIED ARTIST</div>
                </div>
                <h4 style={{ fontSize: "1rem", fontWeight: 900, margin: 0, textTransform: "uppercase" }}>{artist.name}</h4>
                <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", opacity: 0.3, marginTop: 2 }}>{artist.song_count || 0} tracks</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Right: Top 5 Charts */}
        <section>
          <SectionHeader icon={Zap} title="Global Top 5" subtitle="Live stream count" />
          <div style={{ background: "#fff", border: "3.5px solid #000", padding: "4px 0" }}>
            {trendingSongs.map((song, i) => (
              <ChartRow key={song.id} rank={i + 1} song={song} onPlay={() => playSong(song.id)} />
            ))}
          </div>
          <button onClick={() => navigate("/search")} style={{ width: "100%", marginTop: 16, padding: "12px", background: "transparent", border: "1.5px solid #000", color: "#000", fontWeight: 900, fontSize: 10, textTransform: "uppercase", cursor: "pointer" }}>
            View Full Charts ↗
          </button>
        </section>
      </div>

      {/* ── PERSONAL MIX (GRID) ── */}
      <section style={{ marginBottom: 60 }}>
        <SectionHeader icon={Headphones} title="Daily Discovery" subtitle="A sound specifically for you" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: 24 }}>
            {mixSongs.map((song) => (
              <div key={song.id} style={{ 
                padding: 24, border: "2.5px solid #000", background: "#fff", 
                display: "flex", gap: 16, alignItems: "center", position: "relative",
                transition: "transform 0.2s", cursor: "pointer"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translate(-4px, -4px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "none"}
              onClick={() => playSong(song.id)}
              >
                <div style={{ width: 64, height: 64, border: "2px solid #000", flexShrink: 0 }}>
                  <img src={song.cover_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 900, margin: "0 0 4px", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</h3>
                  <p style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 9, opacity: 0.4 }}>{song.artist_name}</p>
                </div>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#CCFF00" }}>
                   <Play size={12} fill="currentColor" />
                </div>
                <div style={{ position: "absolute", right: 24, top: 12, fontSize: 8, fontWeight: 900, color: "#CCFF00", background: "#000", padding: "2px 4px" }}>MIX</div>
              </div>
            ))}
        </div>
      </section>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        .home-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          align-items: center;
        }
        .home-secondary-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 60px;
        }
        @media (max-width: 768px) {
          .home-hero-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .home-hero-grid > div:last-child {
            display: flex;
            justify-content: center;
          }
          .home-secondary-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
        }
      `}</style>
    </div>
  );
}
