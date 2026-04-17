import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import {
  FiGrid, FiMusic, FiUsers, FiMic, FiDisc, FiAlertTriangle,
  FiLogOut, FiLayers, FiBell, FiSettings, FiChevronRight, FiRadio, FiFileText
} from "react-icons/fi";
import axios from "axios";
import ApiService from "../../services/ApiService";
import { API_CONFIG } from "../../config";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import AdminSongs from "./AdminSongs";
import AdminAnnouncements from "./AdminAnnouncements";
import AdminArtists from "./AdminArtists";
import AdminAlbums from "./AdminAlbums";
import AdminUsers from "./AdminUsers";
import AdminReports from "./AdminReports";
import AdminAds from "./AdminAds";
import AdminLyricsCreator from "./AdminLyricsCreator";

const adminApi = axios.create({
  baseURL: API_CONFIG.ADMIN_URL,
  withCredentials: true,
});

const NAV_ITEMS = [
  { name: "Overview",        icon: FiGrid,          path: "/admin",                  exact: true },
  { name: "Alerts",          icon: FiRadio,         path: "/admin/announcements",    badge: true },
  { name: "Songs",           icon: FiMusic,         path: "/admin/songs" },
  { name: "Lyrics Creator",  icon: FiFileText,      path: "/admin/lyrics-creator" },
  { name: "Artists",         icon: FiMic,           path: "/admin/artists" },
  { name: "Albums",          icon: FiDisc,          path: "/admin/albums" },
  { name: "Ads",             icon: FiLayers,        path: "/admin/ads" },
  { name: "Users",           icon: FiUsers,         path: "/admin/users" },
  { name: "Reports",         icon: FiAlertTriangle, path: "/admin/reports", alert: true },
];

const S = {
  sidebar: { width: 220, background: '#0b0b0b', borderRight: '1px solid #181818', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 50 },
  logoWrap: { padding: '24px 18px 18px', borderBottom: '1px solid #181818' },
  logoIcon: { width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#ec4899,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff', flexShrink: 0 },
  nav: { flex: 1, padding: '10px 10px', overflowY: 'auto' },
  sectionLabel: { fontSize: 9, color: '#333', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, padding: '6px 10px 8px', display: 'block' },
  footer: { padding: '12px 10px', borderTop: '1px solid #181818' },
};

const NavItem = ({ item, active, scheduledCount }) => {
  const Icon = item.icon;
  return (
    <Link to={item.path} style={{ textDecoration: 'none', display: 'block', marginBottom: 1 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 11px', borderRadius: 8,
        background: active ? 'rgba(236,72,153,0.08)' : 'transparent',
        border: `1px solid ${active ? 'rgba(236,72,153,0.15)' : 'transparent'}`,
        transition: 'all 0.12s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Icon size={14} style={{ color: active ? '#ec4899' : '#444', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: active ? '#f9fafb' : '#6b7280', fontWeight: active ? 600 : 400, letterSpacing: '-0.01em' }}>
            {item.name}
          </span>
        </div>
        {item.badge && scheduledCount > 0 && (
          <span style={{ background: '#f59e0b', color: '#000', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 20 }}>
            {scheduledCount}
          </span>
        )}
        {item.alert && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />}
      </div>
    </Link>
  );
};

const Sidebar = ({ onLogout, api, adminName, mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try { const { data } = await api.get('/announcements?status=scheduled'); setScheduledCount(data.total || 0); } catch {}
    };
    load();
    const iv = setInterval(load, 60000);
    return () => clearInterval(iv);
  }, [api]);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 45, backdropFilter: 'blur(2px)' }}
          className="admin-mobile-overlay"
        />
      )}
      <aside style={S.sidebar} className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div style={S.logoWrap}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={S.logoIcon}>K</div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#f9fafb', lineHeight: 1.3, letterSpacing: '-0.02em' }}>KK Admin</p>
              <p style={{ margin: 0, fontSize: 10, color: '#374151' }}>Control Panel</p>
            </div>
          </div>
        </div>

        <nav style={S.nav}>
          <span style={S.sectionLabel}>Navigation</span>
          {NAV_ITEMS.map(item => (
            <div key={item.path} onClick={() => setMobileOpen(false)}>
              <NavItem
                item={item}
                active={item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)}
                scheduledCount={scheduledCount}
              />
            </div>
          ))}
        </nav>

        <div style={S.footer}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#ec4899,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {(adminName || 'A')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adminName || 'Admin'}</p>
              <p style={{ margin: 0, fontSize: 10, color: '#374151' }}>Super Admin</p>
            </div>
          </div>
          <button onClick={onLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 11px', borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <FiLogOut size={13} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 500 }}>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

const TopBar = ({ setMobileOpen }) => {
  const location = useLocation();
  const current = NAV_ITEMS.find(n => n.exact ? location.pathname === n.path : location.pathname.startsWith(n.path));
  return (
    <header style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid #181818', background: '#080808', position: 'sticky', top: 0, zIndex: 40, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="admin-menu-btn" onClick={() => setMobileOpen(true)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 11, color: '#374151' }}>Admin</span>
          <span style={{ fontSize: 11, color: '#222' }}>/</span>
          <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>{current?.name || 'Panel'}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[FiBell, FiSettings].map((Icon, i) => (
          <button key={i} style={{ width: 32, height: 32, borderRadius: 8, background: '#111', border: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4b5563', transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#2a2a2a'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.borderColor = '#1f1f1f'; }}>
            <Icon size={14} />
          </button>
        ))}
      </div>
    </header>
  );
};

const AdminApp = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        const r = await adminApi.get('/check-auth');
        setIsAdmin(true);
        setAdminName(r.data?.admin?.name || 'Admin');
      } catch {
        setIsAdmin(false);
        if (location.pathname !== '/admin/login') navigate('/admin/login');
      } finally { setLoading(false); }
    })();
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    try { await adminApi.post('/logout'); } catch {}
    setIsAdmin(false);
    navigate('/admin/login');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,#ec4899,#6366f1)', margin: '0 auto 12px' }} />
        <p style={{ color: '#374151', fontSize: 13 }}>Authenticating...</p>
      </div>
    </div>
  );

  if (!isAdmin) return (
    <Routes>
      <Route path="/login" element={<AdminLogin onLogin={(name) => { setIsAdmin(true); setAdminName(name || 'Admin'); navigate('/admin'); }} />} />
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#f9fafb', display: 'flex', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#222;border-radius:2px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .admin-fade{animation:fadeUp 0.2s ease-out}
        .admin-menu-btn { display: none !important; }
        
        @media(max-width: 768px) {
          .admin-sidebar { transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .admin-sidebar.open { transform: translateX(0); }
          .admin-main-wrapper { margin-left: 0 !important; }
          .admin-menu-btn { display: flex !important; }
          .admin-main-content { padding: 16px !important; }
        }
      `}</style>
      <Sidebar onLogout={handleLogout} api={adminApi} adminName={adminName} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="admin-main-wrapper" style={{ flex: 1, minWidth: 0, marginLeft: 220, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'margin-left 0.3s' }}>
        <TopBar setMobileOpen={setMobileOpen} />
        <main className="admin-fade admin-main-content" style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          <Routes>
            <Route path="/"              element={<AdminDashboard     api={adminApi} />} />
            <Route path="/announcements" element={<AdminAnnouncements api={adminApi} />} />
            <Route path="/songs"           element={<AdminSongs         api={adminApi} />} />
            <Route path="/lyrics-creator"  element={<AdminLyricsCreator api={adminApi} />} />
            <Route path="/artists"       element={<AdminArtists       api={adminApi} />} />
            <Route path="/albums"        element={<AdminAlbums        api={adminApi} />} />
            <Route path="/users"         element={<AdminUsers         api={adminApi} />} />
            <Route path="/ads"           element={<AdminAds           api={adminApi} />} />
            <Route path="/reports"       element={<AdminReports       api={adminApi} />} />
            <Route path="*"              element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminApp;
