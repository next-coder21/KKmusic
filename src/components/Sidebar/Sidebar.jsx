import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User } from "lucide-react";
import { useUser } from "../../context/UserContext";
import SearchBar from "../searchbar/SearchBar";
import Logo from "../../assets/CSI_Kanyakumari_Diocese_Logo.png";
import DefaultAvatar from "../../assets/avatardef.png";
import axios from "axios";
import ApiService from "../../services/ApiService";


function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Get Profile Image
  const getProfileImage = () => {
    if (user?.image) {
      return user.image.startsWith("data:image")
        ? user.image
        : `data:image/png;base64,${user.image}`;
    }
    return DefaultAvatar;
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await axios.post(`${ApiService.getBaseUrl()}/logout`, {}, { withCredentials: true });
      setUser(null);
      setDropdownOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-gray-900 text-white p-4 shadow-md w-full rounded-lg">
      <div className="flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold flex items-center space-x-2">
          <img src={Logo} alt="Logo" className="w-10 h-10" />
          <span className="text-2xl">♫ uve 𝄞 𓏢</span>
        </Link>

        {/* Search Bar */}
        <div className="hidden md:block">
          <SearchBar />
        </div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-6">
          <li><Link to="/" className="hover:text-blue-400">Home</Link></li>
          <li><Link to="/library" className="hover:text-blue-400">Library</Link></li>
          <li><Link to="/search" className="hover:text-blue-400">Search</Link></li>

          {/* User Avatar & Dropdown */}
          {user ? (
            <li className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <span className="text-sm">{user.name}</span>
                <img
                  src={getProfileImage()}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full border border-gray-400"
                />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 bg-gray-800 p-2 rounded shadow-lg w-40 animate-fade-in">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate("/update-profile");
                    }}
                    className="flex items-center space-x-2 text-white w-full p-2 hover:bg-gray-700 rounded"
                  >
                    <User className="w-4 h-4" />
                    <span>Update Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-white w-full p-2 hover:bg-gray-700 rounded mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </li>
          ) : (
            <li><Link to="/login" className="hover:text-blue-400">Login</Link></li>
          )}
        </ul>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2 bg-blue-500 rounded" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Menu */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 md:hidden`}>
        <div className="w-64 bg-gray-900 h-full shadow-lg p-4">
          {/* Close Button */}
          <button className="absolute top-4 right-4 text-white" onClick={() => setIsOpen(false)}>
            <X className="w-6 h-6" />
          </button>

          {/* Mobile Menu Items */}
          <ul className="space-y-4 mt-10">
            <li><Link to="/" className="block p-2 hover:bg-gray-700 rounded" onClick={() => setIsOpen(false)}>Home</Link></li>
            <li><Link to="/library" className="block p-2 hover:bg-gray-700 rounded" onClick={() => setIsOpen(false)}>Library</Link></li>
            <li><Link to="/search" className="block p-2 hover:bg-gray-700 rounded" onClick={() => setIsOpen(false)}>Search</Link></li>

            {/* User Info & Actions */}
            {user ? (
              <li className="flex flex-col items-center space-y-2">
                <img src={getProfileImage()} alt="User Avatar" className="w-10 h-10 rounded-full border border-gray-400" />
                <span className="text-sm">{user.name}</span>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/update-profile");
                  }}
                  className="flex items-center space-x-2 text-white p-2 hover:bg-gray-700 rounded w-full"
                >
                  <User className="w-4 h-4" />
                  <span>Update Profile</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-white p-2 hover:bg-gray-700 rounded w-full mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </li>
            ) : (
              <li><Link to="/login" className="block p-2 hover:bg-gray-700 rounded" onClick={() => setIsOpen(false)}>Login</Link></li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
