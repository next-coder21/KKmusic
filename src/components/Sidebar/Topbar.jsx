// Topbar.jsx
import React, { useRef,useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User } from "lucide-react";
import { useUser } from "../../context/UserContext";
import Logo from "../../assets/Muves.png";
import DefaultAvatar from "../../assets/avatardef.png";
import axios from "axios";
import ApiService from "../../services/ApiService";

function Topbar({ isMobileSidebarOpen, setIsMobileSidebarOpen }) {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getProfileImage = () => {
    if (user?.image) {
      return user.image.startsWith("data:image")
        ? user.image
        : `data:image/png;base64,${user.image}`;
    }
    return DefaultAvatar;
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${ApiService.getBaseUrl()}/logout`, {}, { withCredentials: true });
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="w-full bg-gray-900 border-b border-gray-800 p-4 fixed top-0 z-40">
      <div className="flex justify-between items-center">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="md:hidden text-white p-2 hover:bg-gray-800 rounded-lg"
        >
          {isMobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={Logo} alt="Logo" className="w-8 h-8" />
          <span className="text-xl font-bold text-white hidden md:block">Muve𝄞</span>
        </Link>

        {/* Profile Section */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:bg-gray-800 p-2 rounded-lg"
          >
            <span className="text-gray-300 text-sm hidden md:block">{user?.name}</span>
            <img
              src={getProfileImage()}
              alt="User Avatar"
              className="w-8 h-8 rounded-full border border-gray-600"
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 bg-gray-800 rounded-lg shadow-lg w-48 py-2">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/update-profile");
                }}
                className="w-full px-4 py-2 text-gray-300 hover:bg-gray-700 text-left flex items-center gap-2"
              >
                <User size={16} />
                Update Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-red-400 hover:bg-gray-700 text-left flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Topbar;