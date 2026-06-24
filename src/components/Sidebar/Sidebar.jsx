import "./Sidebar.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Compass, BookOpen, Mic2, Clock, Library, Heart, PlusCircle, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import http from "../../services/http";
import { useUser } from "../../context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import DefaultAvatar from "../../assets/avatardef.png";

const MENU = [
  { name: "Explore",    path: "/home",                 icon: Compass  },
  { name: "Albums",     path: "/albums",               icon: BookOpen },
  { name: "Artists",    path: "/artists",              icon: Mic2     },
];

const LIBRARY = [
  { name: "Recent",      path: "/library?tab=history", icon: Clock    },
  { name: "Library",     path: "/library?tab=albums",  icon: Library  },
  { name: "Favourites",  path: "/favorites",           icon: Heart    },
];

function NavIcon({ item, onNavigate }) {
  const location = useLocation();
  const Icon = item.icon;
  const isActive =
    location.pathname + location.search === item.path ||
    (item.path === "/home" && location.pathname === "/home");

  return (
    <Link to={item.path} onClick={onNavigate} title={item.name} className="nav-icon-link">
      <div className={`nav-icon-btn${isActive ? " nav-icon-btn--active" : ""}`}>
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
      </div>
    </Link>
  );
}

export default function Sidebar({ onNavigate }) {
  const { user }  = useUser();
  const navigate  = useNavigate();

  const [playlists,  setPlaylists]  = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName,    setNewName]    = useState("");
  const [creating,   setCreating]   = useState(false);
  const createPanelRef = useRef(null);

  useEffect(() => {
    if (user?.email) {
      http.get("/auth/playlists")
        .then(res => setPlaylists(res.data || []))
        .catch(() => {});
    }
  }, [user?.email]);

  const createPlaylist = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const r = await http.post("/auth/playlists", { name: newName.trim() });
      setPlaylists(prev => [r.data, ...prev]);
      setNewName("");
      setShowCreate(false);
      toast.success("Playlist created");
      navigate(`/playlist/${r.data.id}`);
      onNavigate?.();
    } catch { toast.error("Failed to create"); }
    finally { setCreating(false); }
  };

  const getAvatar = () => {
    if (user?.image)
      return user.image.startsWith("data:image") ? user.image : `data:image/png;base64,${user.image}`;
    return DefaultAvatar;
  };

  return (
    <div className="sidebar">

      {/* Logo */}
      <div className="sidebar__logo">
        <span className="sidebar__logo-glyph" title="Muves">𝄞</span>
      </div>

      {/* Nav icons */}
      <div className="sidebar__scroll scrollbar-hide">
        <nav className="sidebar__nav">
          {MENU.map(item => <NavIcon key={item.name} item={item} onNavigate={onNavigate} />)}
        </nav>

        <div className="sidebar__divider" />

        <nav className="sidebar__nav">
          {LIBRARY.map(item => <NavIcon key={item.name} item={item} onNavigate={onNavigate} />)}
        </nav>
      </div>

      {/* Bottom: new playlist + avatar */}
      <div className="sidebar__bottom">

        {/* New playlist */}
        <div className="sidebar__plus-wrap">
          <div
            className={`nav-icon-btn${showCreate ? " nav-icon-btn--active" : ""}`}
            onClick={() => setShowCreate(p => !p)}
            title="New Playlist"
            style={{ cursor: "pointer" }}
          >
            <PlusCircle size={20} strokeWidth={2} />
          </div>

          <AnimatePresence>
            {showCreate && (
              <motion.div
                ref={createPanelRef}
                className="sidebar__popover"
                initial={{ opacity: 0, x: -8, scale: 0.96 }}
                animate={{ opacity: 1, x: 0,  scale: 1    }}
                exit={{    opacity: 0, x: -8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <p className="sidebar__popover-title">New Playlist</p>
                <form className="sidebar__popover-form" onSubmit={createPlaylist}>
                  <input
                    autoFocus
                    className="sidebar__popover-input"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === "Escape" && setShowCreate(false)}
                    placeholder="Playlist name…"
                  />
                  <div className="sidebar__popover-row">
                    <button
                      type="submit"
                      className="sidebar__popover-submit"
                      disabled={!newName.trim() || creating}
                    >
                      {creating ? "…" : "Create"}
                    </button>
                    <button
                      type="button"
                      className="sidebar__popover-cancel"
                      onClick={() => { setShowCreate(false); setNewName(""); }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar */}
        <div
          className="sidebar__avatar-wrap"
          onClick={() => navigate("/update-profile")}
          title="Profile"
        >
          <img src={getAvatar()} alt="avatar" className="sidebar__avatar" />
          {user && <div className="sidebar__avatar-dot" />}
        </div>

      </div>
    </div>
  );
}
