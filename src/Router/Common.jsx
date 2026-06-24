import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import Topbar from "../components/Sidebar/Topbar";
import MobileNav from "../components/Sidebar/MobileNav";
import Home from "../pages/Home";
import Library from "../pages/Library";
import Search from "../pages/Search";
import Favorites from "../pages/Favorites";
import Albums from "../pages/Albums";
import Artists from "../pages/Artists";
import UpdateProfile from "../components/Sidebar/UpdateProfile";
import Settings from "../pages/Settings/Settings";
import Login from "../components/Auth/Login";
import AdminApp from "../pages/Admin/AdminApp";
import PlaylistPage from "../pages/Playlist";
import AddToPlaylistModal from "../components/common/AddToPlaylistModal";
import { useUser } from "../context/UserContext";
import ErrorBoundary from "../components/common/ErrorBoundary";
import { PlayerProvider, usePlayer } from "../context/PlayerContext";
import Player from "../components/Player/Player";
import PlayerSidePanel from "../components/Player/PlayerSidePanel";
import LandingPage from "../pages/Landing/LandingPage";
import FeaturesPage from "../pages/Landing/FeaturesPage";
import ChangelogPage from "../pages/Landing/ChangelogPage";
import ContactPage from "../pages/Landing/ContactPage";

function PrivateRoute({ children }) {
  const { user, loading } = useUser();
  if (loading) return <div style={{ background:"#000", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#CCFF00", fontWeight:900, fontSize:14 }}>SYNCING_PROTOCOL...</div>;
  return user ? children : <Navigate to="/" replace />;
}

function AppLayout({ mobileSidebarOpen, setMobileSidebarOpen }) {
  const location = useLocation();
  const { user, loading } = useUser();
  const { sidePanel, setSidePanel, song } = usePlayer();

  // Layout States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [playerDockedBottom, setPlayerDockedBottom] = useState(true);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // When player undocks to full panel, close any open side panel to avoid conflicts
  const handleUndock = () => {
    setSidePanel(null);
    setPlayerDockedBottom(false);
  };

  const LANDING_ROUTES = ["/", "/features", "/changelog", "/contact"];
  const isLanding = LANDING_ROUTES.includes(location.pathname);
  const isAdmin   = location.pathname.startsWith("/admin");
  const isLogin   = location.pathname === "/login";
  const hideUI    = isLanding || isLogin || isAdmin;
  const showUI    = !hideUI && !loading && !!user;

  if (loading && !hideUI) {
    return (
      <div style={{ background:"#000", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#CCFF00", fontWeight:900, fontSize:14 }}>
        SYNCING_PROTOCOL...
      </div>
    );
  }

  if (!showUI) {
    return (
      <Routes>
        {/* Landing pages — always public, no app shell */}
        <Route path="/"          element={user ? <Navigate to="/home" replace /> : <LandingPage />} />
        <Route path="/features"  element={<FeaturesPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/contact"   element={<ContactPage />} />
        {/* Auth & admin */}
        <Route path="/login"   element={user ? <Navigate to="/home" replace /> : <Login />} />
        <Route path="/admin/*" element={<AdminApp />} />
        {/* Anything else — send unauthenticated users to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Side panel is only active on desktop when the bar is docked
  const showSidePanel = isDesktop && playerDockedBottom && sidePanel !== null;

  const gridStyle = isDesktop ? {
    gridTemplateColumns: `72px 1fr ${(!playerDockedBottom || showSidePanel) ? "340px" : "0px"}`,
  } : {};

  // Mobile Player Overlay Logic
  const showMobilePlayer = !isDesktop && !playerDockedBottom;

  return (
    <div style={{ height:"100vh",overflow:"hidden",background:"var(--bg-root)" }}>
      <div className={`app-shell ${sidebarCollapsed ? 'sidebar-min' : ''} ${playerDockedBottom && !!song ? 'player-docked' : ''}`} style={gridStyle}>

        {/* Sidebar */}
        <aside className="sidebar-desktop" style={{ gridArea:"sidebar" }}>
          <Sidebar onNavigate={() => {}} />
        </aside>

        {/* Topbar */}
        <Topbar
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />

        {/* Main content */}
        <main className="app-main-content" style={{ gridArea:"main", overflowY:"auto" }}>
          <div style={{ padding: isDesktop ? `40px 40px ${song ? '100px' : '24px'}` : `20px 20px ${song ? '140px' : '24px'}` }}>
            <ErrorBoundary label="Main Content">
              <Routes>
                <Route path="/home"           element={<PrivateRoute><Home /></PrivateRoute>} />
                <Route path="/library"        element={<PrivateRoute><Library /></PrivateRoute>} />
                <Route path="/albums"         element={<PrivateRoute><Albums /></PrivateRoute>} />
                <Route path="/artists"        element={<PrivateRoute><Artists /></PrivateRoute>} />
                <Route path="/search"         element={<PrivateRoute><Search /></PrivateRoute>} />
                <Route path="/favorites"      element={<PrivateRoute><Favorites /></PrivateRoute>} />
                <Route path="/update-profile" element={<PrivateRoute><UpdateProfile /></PrivateRoute>} />
                <Route path="/settings"       element={<PrivateRoute><Settings /></PrivateRoute>} />
                <Route path="/playlist/:id"   element={<PrivateRoute><PlaylistPage /></PrivateRoute>} />
                <Route path="*"               element={<Navigate to="/home" replace />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </main>

        {/* ── PLAYER COLUMN ── */}
        {/* Full undocked panel (desktop or mobile overlay) */}
        <div className="player-wrapper" style={
          !isDesktop && !playerDockedBottom
            ? { position: "fixed", inset: 0, zIndex: 2000, background: "var(--bg-player, #09090f)", display: "flex", flexDirection: "column" }
            : { gridArea: "player", borderLeft: "1px solid var(--border, rgba(255,255,255,0.07))", background: "var(--bg-player, #09090f)", display: (!playerDockedBottom && isDesktop) ? 'flex' : 'none' }
        }>
          {/* Only mount when visible — prevents two <audio> elements playing at once */}
          {!playerDockedBottom && (
            <ErrorBoundary label="PlayerPanel">
              <Player
                forceBar={false}
                onToggleDock={() => setPlayerDockedBottom(true)}
                isMobileView={!isDesktop}
              />
            </ErrorBoundary>
          )}
        </div>

        {/* Side panel — visible only when bar is docked and a panel is selected (desktop only) */}
        {showSidePanel && (
          <div
            style={{
              gridArea: "player",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              height: "100%",
            }}
          >
            <ErrorBoundary label="PlayerSidePanel">
              <PlayerSidePanel />
            </ErrorBoundary>
          </div>
        )}
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <>
          <div
            onClick={() => setMobileSidebarOpen(false)}
            style={{ position:"fixed",inset:0,zIndex:998, background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)" }}
          />
          <aside style={{ position:"fixed",top:0,left:0,bottom:0,width:260,zIndex:999, background:"var(--bg-root, #000)", borderRight:"1px solid var(--border, rgba(255,255,255,0.07))", display:"flex", flexDirection:"column", overflowY:"auto" }}>
            <Sidebar onNavigate={() => setMobileSidebarOpen(false)} collapsed={false} />
          </aside>
        </>
      )}

      {/* ── GLOBAL BOTTOM BAR PLAYER — always mounted so currentSongId→song
           resolution runs; visually hidden until a song is loaded ── */}
      {!showMobilePlayer && (
        <div
          className={`bottom-bar-wrapper ${(playerDockedBottom || !isDesktop) ? 'desk-dock' : ''}`}
          style={!song ? { display: 'none' } : undefined}
        >
          {(!isDesktop || playerDockedBottom) && (
            <ErrorBoundary label="PlayerBar">
              <Player forceBar={true} onToggleDock={handleUndock} />
            </ErrorBoundary>
          )}
        </div>
      )}

      <MobileNav />
      <AddToPlaylistModal />
    </div>
  );
}

// Single <audio> element that never unmounts — survives bar↔panel transitions
function PersistentAudio() {
  const { audioRef } = usePlayer();
  return <audio ref={audioRef} preload="metadata" style={{ display: "none" }} />;
}

export default function Common() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  return (
    <Router basename="/muves">
      <PlayerProvider>
        <PersistentAudio />
        <AppLayout
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />
      </PlayerProvider>
    </Router>
  );
}
