// Common.jsx
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { PlayerProvider } from "../context/PlayerContext";
import Home from "../pages/Home";
import Library from "../pages/Library";
import Search from "../pages/Search";
import Sidebar from "../components/Sidebar/Sidebar";
import Topbar from "../components/Sidebar/Topbar";
import Player from "../components/Player/Player";
import Login from "../components/Auth/Login";
import UpdateProfile from "../components/Sidebar/UpdateProfile";
import Favorites from "../components/music/favourites/Favourites";

function PrivateRoute({ children }) {
  const { user, loading } = useUser();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function Layout({ isMobileSidebarOpen, setIsMobileSidebarOpen }) {
  const location = useLocation();
  const { user, loading } = useUser();
  const publicRoutes = ["/login", "/verify-otp", "/register", "/forgot-password"];
  const hideUI = publicRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Topbar */}
      {!hideUI && !loading && user && (
        <Topbar 
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        />
      )}

      {/* Sidebar */}
      {!hideUI && !loading && user && (
        // Common.jsx (Layout component's return statement)
<div className={`fixed top-0 left-0 h-full w-64 z-40 transition-transform duration-300 ${
  isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
}`}>
  <Sidebar onNavigate={() => setIsMobileSidebarOpen(false)} />
</div>
      )}

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${
        !hideUI && !loading && user ? 'md:ml-64' : ''
      } relative pt-16 pb-24 md:pb-0`}>
        <div className="p-4 sm:p-6 min-h-[calc(100vh-6rem)]">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/library" element={<PrivateRoute><Library /></PrivateRoute>} />
            <Route path="/search" element={<PrivateRoute><Search /></PrivateRoute>} />
            <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
            <Route path="/update-profile" element={<PrivateRoute><UpdateProfile /></PrivateRoute>} />
          </Routes>
        </div>
      </div>

      {/* Player */}
      {!hideUI && !loading && user && (
        <div className={`fixed bottom-0 left-0 right-0 z-30 ${
          !hideUI && !loading && user ? 'md:left-64' : ''
        }`}>
          <Player />
        </div>
      )}
    </div>
  );
}

export default function Common() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <Router>
      <PlayerProvider>
        <Layout 
          isMobileSidebarOpen={isMobileSidebarOpen} 
          setIsMobileSidebarOpen={setIsMobileSidebarOpen} 
        />
      </PlayerProvider>
    </Router>
  );
}