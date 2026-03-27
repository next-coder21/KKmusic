import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Bell, Settings, User, LogOut, Search, ChevronDown, PanelLeft, Layout, Maximize2, Minimize2 } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useNotifications } from "../../context/NotificationsContext";
import Logo from "../../assets/Muves.png";
import DefaultAvatar from "../../assets/avatardef.png";
import axios from "axios";
import ApiService from "../../services/ApiService";
import { API_CONFIG } from "../../config";
import { motion, AnimatePresence } from "framer-motion";

const TABS = ["Music", "Podcast", "Live"];

export default function Topbar({ 
  mobileSidebarOpen, setMobileSidebarOpen, 
  sidebarCollapsed, setSidebarCollapsed, 
  playerDockedBottom, setPlayerDockedBottom 
}) {
  const { user, setUser } = useUser();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("Music");
  const [notifOpen, setNotifOpen] = useState(false);
  const [dropOpen,  setDropOpen ] = useState(false);

  const notifRef = useRef(null);
  const dropRef  = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))  setNotifOpen(false);
      if (dropRef.current  && !dropRef.current.contains(e.target))   setDropOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const getAvatar = () => {
    if (user?.image) return user.image.startsWith("data:image") ? user.image : `data:image/png;base64,${user.image}`;
    return DefaultAvatar;
  };
  
  const handleLogout = async () => {
    try { await axios.post(`${ApiService.getBaseUrl()}/logout`, {}, { withCredentials: true }); } catch {}
    setUser(null); navigate("/login");
  };

  const DR_STYLE = {
    position: "absolute", right: 0, top: "calc(100% + 12px)", background: "#fff",
    border: "3px solid #000", boxShadow: "8px 8px 0 0 #000", zIndex: 100, overflow: "hidden"
  };

  const MItem = ({ icon: Icon, label, onClick, danger }) => (
    <button onClick={onClick} style={{ 
      width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
      background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
      color: danger ? "#ff4444" : "#000", transition: "all 0.1s"
    }} onMouseEnter={e => { e.currentTarget.style.background = danger ? "rgba(255, 68, 68, 0.1)" : "#CCFF00"; }}
       onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
      <Icon size={16} strokeWidth={3} />
      <span style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.1em" }}>{label}</span>
    </button>
  );

  return (
    <header style={{ 
      gridArea: "topbar", display: "flex", alignItems: "center", justifyContent: "space-between", 
      padding: "0 30px", height: 64, background: "#fff", borderBottom: "3px solid #000", 
      position: "sticky", top: 0, zIndex: 100 
    }}>
      
      {/* ── LEFT ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
         {/* Desktop Sidebar Toggle */}
         <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ width: 44, height: 44, background: sidebarCollapsed ? "#000" : "transparent", color: sidebarCollapsed ? "#CCFF00" : "#000", border: sidebarCollapsed ? "none" : "3px solid #000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} className="sidebar-desktop-toggle">
            <PanelLeft size={20} strokeWidth={3} />
         </button>

         {/* Mobile menu btn */}
         <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} style={{ padding: 8, background: "transparent", border: "none", cursor: "pointer", color: "#000" }} className="topbar-menu-btn">
            {mobileSidebarOpen ? <X size={24} strokeWidth={3} /> : <Menu size={24} strokeWidth={3} />}
         </button>

         <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ 
                padding: "6px 14px", background: "transparent", border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em",
                color: activeTab === tab ? "#000" : "rgba(0,0,0,0.3)", position: "relative"
              }}>
                {tab}
                {activeTab === tab && <span style={{ position: "absolute", bottom: 0, left: "20%", right: "20%", height: 3, background: "#CCFF00", border: "1px solid #000" }} />}
              </button>
            ))}
         </nav>
      </div>

      {/* ── CENTER ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", border: "3px solid #000", background: "#f5f5f5", width: "25%", cursor: "text" }} onClick={() => navigate("/search")}>
         <Search size={16} strokeWidth={3} />
         <span style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 10, opacity: 0.3, letterSpacing: "0.05em" }}>GLOBAL_SEARCH</span>
      </div>

      {/* ── RIGHT ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
         
         {/* Desktop Player Toggle */}
         <button onClick={() => setPlayerDockedBottom(!playerDockedBottom)} style={{ width: 44, height: 44, background: playerDockedBottom ? "#000" : "transparent", color: playerDockedBottom ? "#CCFF00" : "#000", border: playerDockedBottom ? "none" : "3px solid #000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} className="player-desktop-toggle">
            <Layout size={20} strokeWidth={3} />
         </button>

         {/* Notifications */}
         <div ref={notifRef} style={{ position: "relative" }}>
            <button onClick={() => setNotifOpen(!notifOpen)} style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #000", background: "#fff", cursor: "pointer" }}>
               <Bell size={18} strokeWidth={3} />
               {unreadCount > 0 && <div style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, background: "#ff4444", border: "2px solid #000", color: "#fff", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount}</div>}
            </button>
            <AnimatePresence>
               {notifOpen && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={{ ...DR_STYLE, width: 300, padding: 0 }}>
                    <div style={{ padding: "12px 16px", borderBottom: "3px solid #000", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#CCFF00" }}>
                       <span style={{ fontWeight: 900, fontSize: 10, textTransform: "uppercase" }}>Alerts Hub</span>
                       <button onClick={markAllAsRead} style={{ border: "2px solid #000", background: "#fff", padding: "2px 8px", fontSize: 9, fontWeight: 900, cursor: "pointer" }}>CLEAR</button>
                    </div>
                    <div style={{ maxHeight: 300, overflowY: "auto" }} className="scrollbar-hide">
                       {notifications.length > 0 ? notifications.map(n => (
                         <div key={n.id} onClick={() => { markAsRead(n.id); if(n.action_url) navigate(n.action_url); setNotifOpen(false); }} style={{ padding: "12px 16px", borderBottom: "1px solid #000", background: n.is_read ? "#fff" : "#f5f5f5", cursor: "pointer" }}>
                            <p style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 10, margin: 0 }}>{n.title}</p>
                            <p style={{ fontSize: 9, fontWeight: 700, opacity: 0.5, margin: "2px 0 0" }}>{n.body}</p>
                         </div>
                       )) : <div style={{ padding: 40, textAlign: "center", fontSize: 10, fontWeight: 900, opacity: 0.2 }}>CHANNELS_CLEAR</div>}
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>
         </div>

         {/* Account Dropdown */}
         <div ref={dropRef} style={{ position: "relative" }}>
            <button onClick={() => setDropOpen(!dropOpen)} style={{ 
              display: "flex", alignItems: "center", gap: 12, padding: "4px 14px 4px 6px", 
              border: "3px solid #000", background: "#fff", cursor: "pointer", transition: "all 0.1s"
            }}>
               <img src={getAvatar()} alt="av" style={{ width: 32, height: 32, border: "2px solid #000", objectFit: "cover" }} />
               <span style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.05em" }}>{user?.name?.split(" ")[0] || "USER"}</span>
               <ChevronDown size={14} strokeWidth={3} />
            </button>
            <AnimatePresence>
               {dropOpen && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={{ ...DR_STYLE, width: 200, padding: 0 }}>
                    <MItem icon={User} label="My Identity" onClick={() => { navigate("/update-profile"); setDropOpen(false); }} />
                    <MItem icon={Settings} label="Preferences" onClick={() => { navigate("/settings"); setDropOpen(false); }} />
                    <div style={{ height: 3, background: "#000" }} />
                    <MItem icon={LogOut} label="Emergency Sign Out" onClick={handleLogout} danger />
                 </motion.div>
               )}
            </AnimatePresence>
         </div>

      </div>
    </header>
  );
}
