import { Link, useLocation, useNavigate } from "react-router-dom";
import { Compass, Disc3, BookOpen, Mic2, Clock, Library, Heart, HardDrive, PlusCircle, ListMusic, Music2, X } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import http from "../../services/http";
import { useUser } from "../../context/UserContext";
import { usePlayer } from "../../context/PlayerContext";
import ApiService from "../../services/ApiService";
import { API_CONFIG } from "../../config";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

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
  const navigate = useNavigate();
  const [recent,    setRecent]    = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName,    setNewName]    = useState("");
  const [creating,   setCreating]   = useState(false);

  const playSong = async (id) => {
    if (!user?.email) return;
    try {
      await http.post("/auth/queue/add", { songIds: [id], album: false });
      setCurrentSongId(id);
      setQueueUpdated(prev => !prev);
    } catch {}
  };

  useEffect(() => {
    if (!collapsed && user?.email) {
      http.get("/auth/play-history")
        .then(res => setRecent(res.data.slice(0, 5)))
        .catch(() => {});
      http.get("/auth/playlists")
        .then(res => setPlaylists(res.data || []))
        .catch(() => {});
    }
  }, [collapsed, user?.email]);

  const createPlaylist = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const r = await http.post("/auth/playlists", { name: newName.trim() });
      setPlaylists(prev => [r.data, ...prev]);
      setNewName(""); setShowCreate(false);
      toast.success("Playlist created");
      navigate(`/playlist/${r.data.id}`);
      onNavigate?.();
    } catch { toast.error("Failed to create"); }
    finally { setCreating(false); }
  };

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
          {!collapsed && playlists.map(pl => (
            <Link key={pl.id} to={`/playlist/${pl.id}`} onClick={onNavigate} style={{ textDecoration: "none", display: "block", padding: "0 12px" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", color: "#fff", fontSize: 12, fontWeight: 700, textTransform: "uppercase", cursor: "pointer", transition: "color .1s", borderRadius: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = "#CCFF00"}
                onMouseLeave={e => e.currentTarget.style.color = "#fff"}
              >
                <ListMusic size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pl.name}</span>
                <span style={{ marginLeft: "auto", fontSize: 9, opacity: 0.35, flexShrink: 0 }}>{pl.songCount ?? 0}</span>
              </div>
            </Link>
          ))}

          {collapsed && (
            <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
              <Link to="/library?tab=playlists" onClick={onNavigate} style={{ color: "rgba(255,255,255,0.4)", display: "flex" }} title="Playlists">
                <ListMusic size={18} />
              </Link>
            </div>
          )}

          {!collapsed && (
            <>
              <AnimatePresence>
                {showCreate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: "hidden", padding: "4px 12px" }}
                  >
                    <form onSubmit={createPlaylist} style={{ display: "flex", gap: 6 }}>
                      <input
                        autoFocus
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === "Escape" && setShowCreate(false)}
                        placeholder="Playlist name…"
                        style={{ flex: 1, padding: "7px 10px", borderRadius: 6, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 11, fontFamily: "inherit", outline: "none" }}
                      />
                      <button type="submit" disabled={!newName.trim() || creating} style={{ padding: "7px 10px", borderRadius: 6, border: "none", background: "#CCFF00", color: "#000", fontSize: 11, fontWeight: 900, cursor: "pointer", opacity: newName.trim() ? 1 : 0.5 }}>
                        {creating ? "…" : "OK"}
                      </button>
                      <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "7px 8px", borderRadius: 6, border: "none", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <X size={12} />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => setShowCreate(p => !p)}
                style={{ margin: "6px 12px 0", padding: "10px 12px", background: "transparent", border: "2px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontWeight: 900, textTransform: "uppercase", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, justifyContent: "center", transition: "0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#CCFF00"; e.currentTarget.style.color = "#CCFF00"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
              >
                <PlusCircle size={12} /> New Playlist
              </button>
            </>
          )}
        </nav>
      </div>

    </div>
  );
}
