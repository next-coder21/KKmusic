import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { PlayerProvider } from "../context/PlayerContext";
import Home from "../pages/Home";
import Library from "../pages/Library";
import Search from "../pages/Search";
import Sidebar from "../components/Sidebar/Sidebar"; // Now acts as a top navbar
import Player from "../components/Player/Player";
import Login from "../components/Auth/Login";
import UpdateProfile from "../components/Sidebar/UpdateProfile";

/**
 * PrivateRoute Component - Redirects unauthenticated users to login
 */
function PrivateRoute({ children }) {
  const { user, loading } = useUser();

  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

/**
 * Layout Component - Manages Navbar, Player, and Scrollable Content Area
 */
function Layout() {
  const location = useLocation();
  const { user, loading } = useUser();

  // Define routes where Navbar & Player should not be shown
  const publicRoutes = ["/login", "/verify-otp", "/register", "/forgot-password"];
  const hideUI = publicRoutes.includes(location.pathname);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Navbar (Top Navigation Bar) */}
      {!hideUI && !loading && user && (
        <div className="w-full bg-gray-900 text-white sticky top-0 z-50">
          <Sidebar /> {/* Now a navbar */}
        </div>
      )}

      {/* Main Content (Middle Scrollable Section) */}
      <div className="flex-1 overflow-auto p-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/library" element={<PrivateRoute><Library /></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><Search /></PrivateRoute>} />
          <Route path="/update-profile" element={<PrivateRoute><UpdateProfile /></PrivateRoute>} />
        </Routes>
      </div>

      {/* Player (Sticky at the Bottom) */}
      {!hideUI && !loading && user && (
        <div className="sticky bottom-0 w-full bg-gray-800 z-50">
          <Player />
        </div>
      )}
    </div>
  );
}

/**
 * Common Component - Wraps App with Router & Player Context
 */
function Common() {
  return (
    <Router>
      <PlayerProvider>
        <Layout />
      </PlayerProvider>
    </Router>
  );
}

export default Common;
