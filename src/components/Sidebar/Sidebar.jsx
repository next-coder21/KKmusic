import { Link, useLocation } from "react-router-dom";
import { Compass, Disc3, BookOpen, Mic2, Clock, Library, Heart, HardDrive, PlusCircle, ListMusic, Music2 } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../../context/UserContext";
import { usePlayer } from "../../context/PlayerContext";
import ApiService from "../../services/ApiService";
import { API_CONFIG } from "../../config";
import { motion } from "framer-motion";

const MENU = [
  { name: "Explore",    path: "/",         icon: Compass  },
  { name: "Genres",     path: "/genres",   icon: Disc3    },
  { name: "Albums",     path: "/albums",   icon: BookOpen },
  { name: "Artists",    path: "/artists",  icon: Mic2     },
];

const LIBRARY = [
  { name: "Recent",     path: "/library?tab=history",  icon: Clock    },
  { name: "Albums",     path: "/library?tab=albums",   icon: Library  },
  { name: "Favourites", path: "/favorites",            icon: Heart    },
  { name: "Local Files",path: "/local?tab=local",      icon: HardDrive},
];

const PLAYLISTS = [
  { name: "Design Flow",    path: "/library", icon: ListMusic  },
  { name: "Best of 2024",   path: "/library", icon: ListMusic  },
  { name: "Late Night",     path: "/library", icon: ListMusic  },
];

function SectionLabel({ children, collapsed }) {
  if (collapsed) return <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "30px 16px 16px" }} />;
  return (
    <p style={{ 
      fontSize: 10, fontWeight: 900, textTransform: "uppercase", 
      letterSpacing: ".2em", color: "rgba(255,255,255,0.4)", 
      padding: "0 24px", marginBottom: 16, marginTop: 40 
    }}>
      {children}
    </p>
  );
}

function NavItem({ item, onNavigate, collapsed }) {
  const location = useLocation();
  const Icon = item.icon;
  const isActive = location.pathname + location.search === item.path || (item.path === "/" && location.pathname === "/");

  return (
    <Link to={item.path} onClick={onNavigate} style={{ textDecoration: "none", display: "block", padding: collapsed ? "0 8px" : "0 12px" }}>
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: collapsed ? 0 : 14,
          padding: "12px", 
          background: isActive ? "#CCFF00" : "transparent",
          color: isActive ? "#000" : "#fff",
          fontWeight: 900, fontSize: 13, 
          textTransform: "uppercase",
          transition: "all .1s ease",
          border: isActive ? "2px solid #000" : "2px solid transparent"
        }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = "#CCFF00"; } }}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = "#fff"; } }}
        title={collapsed ? item.name : ""}
      >
        <Icon size={18} style={{ flexShrink: 0 }} strokeWidth={isActive ? 3 : 2} />
        {!collapsed && <span style={{ paddingTop: 1 }}>{item.name}</span>}
      </div>
    </Link>
  );
}

export default function Sidebar({ onNavigate, collapsed }) {
  const { user } = useUser();
  const { setCurrentSongId, setQueueUpdated } = usePlayer();
  const [recent, setRecent] = useState([]);

  const playSong = async (id) => {
    if (!user?.email) return;
    try {
      await axios.post(`${API_CONFIG.QUEUE_URL}/add`, { email: user.email, songIds: [id], album: false }, { withCredentials: true });
      setCurrentSongId(id);
      setQueueUpdated(prev => !prev);
    } catch {}
  };

  useEffect(() => {
    if (!collapsed && user?.email) {
       axios.get(`${API_CONFIG.AUTH_URL}/play-history`, { withCredentials: true })
         .then(res => setRecent(res.data.slice(0, 5)))
         .catch(() => {});
    }
  }, [collapsed, user?.email]);

  return (
    <div style={{ 
      display: "flex", flexDirection: "column", height: "100%", 
      background: "#000", color: "#fff",
      borderRight: "3px solid #000",
      width: "100%", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
    }}>
      {/* ── LOGO ── */}
      <div style={{ padding: collapsed ? "30px 0" : "40px 24px 30px", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 12 }}>
        {!collapsed && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ width: 8, height: 32, background: "#CCFF00", border: "2px solid #000" }} />}
        <span style={{ fontWeight: 900, fontSize: 22, color: "#fff", letterSpacing: "-0.05em", textTransform: "uppercase" }}>
          {collapsed ? "M" : "Muve"}<span style={{ color: "#CCFF00" }}>𝄞</span>
        </span>
      </div>

      <div className="scrollbar-hide" style={{ flex: 1, overflowY: "auto", paddingBottom: 40 }}>
        <SectionLabel collapsed={collapsed}>Discover</SectionLabel>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {MENU.map(item => <NavItem key={item.name} item={item} onNavigate={onNavigate} collapsed={collapsed} />)}
        </nav>

        <SectionLabel collapsed={collapsed}>Your Library</SectionLabel>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {LIBRARY.map(item => <NavItem key={item.name} item={item} onNavigate={onNavigate} collapsed={collapsed} />)}
        </nav>

        {!collapsed && recent.length > 0 && (
          <>
            <SectionLabel collapsed={collapsed}>Recently Played</SectionLabel>
            <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 4 }}>
               {recent.map(s => (
                 <div key={s.id + s.played_at} 
                   onClick={() => playSong(s.id)}
                   style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", cursor: "pointer", transition: "0.2s" }} 
                   className="sidebar-recent-item" 
                   onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} 
                   onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <img src={s.cover_url || "/default-album.jpg"} style={{ width: 32, height: 32, border: "1px solid rgba(255,255,255,0.1)" }} alt="" />
                    <div style={{ overflow: "hidden" }}>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 900, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</p>
                      <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{s.artist_name}</p>
                    </div>
                 </div>
               ))}
            </div>
          </>
        )}

        <SectionLabel collapsed={collapsed}>Playlists</SectionLabel>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {PLAYLISTS.map(item => <NavItem key={item.name} item={item} onNavigate={onNavigate} collapsed={collapsed} />)}
          {!collapsed && (
            <button style={{ 
              marginTop: 10, margin: "10px 12px 0", padding: "12px",
              background: "transparent", border: "2px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)", fontWeight: 900, textTransform: "uppercase", 
              fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              justifyContent: "center", transition: "0.2s"
            }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#CCFF00"; e.currentTarget.style.color = "#CCFF00"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>
              <PlusCircle size={12} /> New Playlist
            </button>
          )}
        </nav>
      </div>

      {/* ── PREMIUM UPSELL ── */}
      <div style={{ padding: collapsed ? "12px" : "24px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
         <div style={{ 
           padding: collapsed ? "10px" : "20px", background: "#CCFF00", color: "#000", 
           textAlign: "center", fontWeight: 900, textTransform: "uppercase", fontSize: collapsed ? 14 : 11,
           cursor: "pointer", border: "2px solid #000"
         }}>
           {collapsed ? "PR" : "Try Premium ↗"}
         </div>
      </div>
    </div>
  );
}
