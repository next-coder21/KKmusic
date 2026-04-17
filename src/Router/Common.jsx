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
import Genres from "../pages/Genres";
import UpdateProfile from "../components/Sidebar/UpdateProfile";
import Settings from "../pages/Settings/Settings";
import Login from "../components/Auth/Login";
import AdminApp from "../pages/Admin/AdminApp";
import { useUser } from "../context/UserContext";
import ErrorBoundary from "../components/common/ErrorBoundary";
import { PlayerProvider } from "../context/PlayerContext";
import Player from "../components/Player/Player";

function PrivateRoute({ children }) {
  const { user, loading } = useUser();
  if (loading) return <div style={{ background:"#000", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#CCFF00", fontWeight:900, fontSize:14 }}>SYNCING_PROTOCOL...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AppLayout({ mobileSidebarOpen, setMobileSidebarOpen }) {
  const location = useLocation();
  const { user, loading } = useUser();
  
  // Layout States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [playerDockedBottom, setPlayerDockedBottom] = useState(true);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const PUBLIC  = ["/login","/verify-otp","/register","/forgot-password"];
  const isAdmin = location.pathname.startsWith("/admin");
  const hideUI  = PUBLIC.includes(location.pathname) || isAdmin;
  const showUI  = !hideUI && !loading && !!user;

  if (!showUI) {
    return (
      <Routes>
        <Route path="/login"   element={<Login />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*"        element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const gridStyle = isDesktop ? {
    gridTemplateColumns: `${sidebarCollapsed ? "64px" : "240px"} 1fr ${playerDockedBottom ? "0px" : "340px"}`
  } : {};

  // Mobile Player Overlay Logic
  const showMobilePlayer = !isDesktop && !playerDockedBottom;

  return (
    <div style={{ height:"100vh",overflow:"hidden",background:"var(--bg-root)" }}>
      <div className={`app-shell ${sidebarCollapsed ? 'sidebar-min' : ''} ${playerDockedBottom ? 'player-docked' : ''}`} style={gridStyle}>

        {/* Sidebar */}
        <aside className="sidebar-desktop" style={{ gridArea:"sidebar", background:"var(--bg-sidebar)", borderRight:"3px solid #000", overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <Sidebar onNavigate={() => {}} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        </aside>

        {/* Topbar */}
        <Topbar
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          playerDockedBottom={playerDockedBottom}
          setPlayerDockedBottom={setPlayerDockedBottom}
        />

        {/* Main content */}
        <main className="app-main-content" style={{ gridArea:"main", overflowY:"auto", background:"var(--bg-root)" }}>
          <div style={{ padding: isDesktop ? "40px 40px 100px" : "20px 20px 140px" }}>
            <ErrorBoundary label="Main Content">
              <Routes>
                <Route path="/"               element={<PrivateRoute><Home /></PrivateRoute>} />
                <Route path="/library"        element={<PrivateRoute><Library /></PrivateRoute>} />
                <Route path="/albums"         element={<PrivateRoute><Albums /></PrivateRoute>} />
                <Route path="/artists"        element={<PrivateRoute><Artists /></PrivateRoute>} />
                <Route path="/genres"         element={<PrivateRoute><Genres /></PrivateRoute>} />
                <Route path="/search"         element={<PrivateRoute><Search /></PrivateRoute>} />
                <Route path="/favorites"      element={<PrivateRoute><Favorites /></PrivateRoute>} />
                <Route path="/update-profile" element={<PrivateRoute><UpdateProfile /></PrivateRoute>} />
                <Route path="/settings"       element={<PrivateRoute><Settings /></PrivateRoute>} />
                <Route path="*"               element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </main>

        {/* ── PLAYER PANEL (DESKTOP OR MOBILE OVERLAY) ── */}
        <div className="player-wrapper" style={
          !isDesktop && !playerDockedBottom 
            ? { position: "fixed", inset: 0, zIndex: 2000, background: "#000", display: "flex", flexDirection: "column" }
            : { gridArea: "player", borderLeft: "3px solid #000", background: "#000", display: (playerDockedBottom || !isDesktop) ? 'none' : 'flex' }
        }>
            <ErrorBoundary label="PlayerPanel">
              <Player 
                forceBar={false} 
                onToggleDock={() => setPlayerDockedBottom(true)} 
                isMobileView={!isDesktop}
              />
            </ErrorBoundary>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <>
          <div
            onClick={() => setMobileSidebarOpen(false)}
            style={{ position:"fixed",inset:0,zIndex:998, background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)" }}
          />
          <aside style={{ position:"fixed",top:0,left:0,bottom:0,width:260,zIndex:999, background:"#000", borderRight:"3px solid #000", display:"flex", flexDirection:"column", overflowY:"auto" }}>
            <Sidebar onNavigate={() => setMobileSidebarOpen(false)} collapsed={false} />
          </aside>
        </>
      )}

      {/* ── GLOBAL BOTTOM BAR PLAYER ── */}
      {!showMobilePlayer && (
        <div className={`bottom-bar-wrapper ${(playerDockedBottom || !isDesktop) ? 'desk-dock' : ''}`}>
             {(!isDesktop || playerDockedBottom) && (
               <ErrorBoundary label="PlayerBar">
                  <Player forceBar={true} onToggleDock={() => setPlayerDockedBottom(false)} />
               </ErrorBoundary>
             )}
        </div>
      )}

      <MobileNav />
    </div>
  );
}

export default function Common() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  return (
    <Router>
      <PlayerProvider>
        <AppLayout
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />
      </PlayerProvider>
    </Router>
  );
}
