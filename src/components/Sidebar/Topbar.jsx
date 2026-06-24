import "./Topbar.css";
import { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Bell, Settings, User, LogOut, Search, Sun, Moon } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useNotifications } from "../../context/NotificationsContext";
import { useTheme } from "../../context/ThemeContext";
import DefaultAvatar from "../../assets/avatardef.png";
import http from "../../services/http";
import { motion, AnimatePresence } from "framer-motion";

const DROPDOWN_ANIM = {
  initial:    { opacity: 0, y: 8,  scale: 0.97 },
  animate:    { opacity: 1, y: 0,  scale: 1    },
  exit:       { opacity: 0, y: 8,  scale: 0.97 },
  transition: { duration: 0.15, ease: "easeOut" },
};

function MItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`topbar__menu-item${danger ? " topbar__menu-item--danger" : ""}`}
    >
      <Icon size={15} strokeWidth={2} />
      <span className="topbar__menu-item__label">{label}</span>
    </button>
  );
}

export default function Topbar({ mobileSidebarOpen, setMobileSidebarOpen }) {
  const location = useLocation();
  const { user, setUser }  = useUser();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "muves";
  const navigate = useNavigate();

  const PAGE_TITLES = {
    '/': 'Home', '/search': 'Search', '/library': 'Library',
    '/albums': 'Albums', '/artists': 'Artists', '/favorites': 'Favorites',
    '/settings': 'Settings', '/update-profile': 'Profile',
  };
  const pageTitle = PAGE_TITLES[location.pathname] || '';

  const [notifOpen, setNotifOpen] = useState(false);
  const [dropOpen,  setDropOpen ] = useState(false);

  const notifRef = useRef(null);
  const dropRef  = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (dropRef.current  && !dropRef.current.contains(e.target))  setDropOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const getAvatar = () => {
    if (user?.image)
      return user.image.startsWith("data:image") ? user.image : `data:image/png;base64,${user.image}`;
    return DefaultAvatar;
  };

  const handleLogout = async () => {
    try { await http.post("/auth/logout", {}); } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="topbar">

      {/* Left — mobile menu + desktop page title */}
      <div className="topbar__left">
        <button
          className="topbar-menu-btn topbar__icon-btn"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          style={{ borderRadius: 8 }}
        >
          {mobileSidebarOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
        </button>
        {pageTitle && (
          <span className="topbar-page-title">
            {pageTitle}
          </span>
        )}
      </div>

      {/* Right */}
      <div className="topbar__right">

        {/* Search pill */}
        <div className="topbar__search" onClick={() => navigate("/search")}>
          <Search size={15} className="topbar__search-icon" strokeWidth={2} />
          <span className="topbar__search-text">Search music...</span>
        </div>

        {/* Theme toggle */}
        <button
          className="topbar__icon-btn topbar__theme-toggle"
          onClick={() => setTheme(isDark ? "musikly" : "muves")}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
        </button>

        {/* Notification bell */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button className="topbar__icon-btn" onClick={() => setNotifOpen(!notifOpen)} aria-label="Notifications" title="Notifications">
            <Bell size={17} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="topbar__badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div {...DROPDOWN_ANIM} className="topbar__dropdown" style={{ width: 300 }}>
                <div className="topbar__notif-header">
                  <span className="topbar__notif-heading">Notifications</span>
                  <button className="topbar__notif-clear" onClick={markAllAsRead}>Clear all</button>
                </div>
                <div className="topbar__notif-list scrollbar-hide">
                  {notifications.length > 0 ? notifications.map(n => (
                    <div
                      key={n.id}
                      className={`topbar__notif-item${n.is_read ? "" : " topbar__notif-item--unread"}`}
                      onClick={() => { markAsRead(n.id); if (n.action_url) navigate(n.action_url); setNotifOpen(false); }}
                    >
                      <p className="topbar__notif-item__title">{n.title}</p>
                      <p className="topbar__notif-item__body">{n.body}</p>
                    </div>
                  )) : (
                    <div className="topbar__notif-empty">No notifications</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar */}
        <div ref={dropRef} style={{ position: "relative" }}>
          <button className="topbar__avatar-btn" onClick={() => setDropOpen(!dropOpen)}>
            <img src={getAvatar()} alt={user?.name ? `${user.name}'s avatar` : "Profile avatar"} className="topbar__avatar-img" />
          </button>

          <AnimatePresence>
            {dropOpen && (
              <motion.div {...DROPDOWN_ANIM} className="topbar__dropdown" style={{ width: 200, padding: "6px 0" }}>
                {user && (
                  <div className="topbar__user-header">
                    <p className="topbar__user-name">{user.name?.split(" ")[0] || "User"}</p>
                    <p className="topbar__user-email">{user.email}</p>
                  </div>
                )}
                <MItem icon={User}    label="My Profile" onClick={() => { navigate("/update-profile"); setDropOpen(false); }} />
                <MItem icon={Settings} label="Settings"  onClick={() => { navigate("/settings");        setDropOpen(false); }} />
                <div className="topbar__menu-divider" />
                <MItem icon={LogOut}  label="Sign Out"   onClick={handleLogout} danger />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
}
