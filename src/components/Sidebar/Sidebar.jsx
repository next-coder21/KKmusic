// Sidebar.jsx
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Logo from "../../assets/Muves.png";

function Sidebar({ onNavigate }) { // Receive onNavigate prop
  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onNavigate(); // Call onNavigate to close the sidebar
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onNavigate]); // Include onNavigate in dependencies

  return (
    <div
      ref={sidebarRef}
      className="fixed md:relative left-0 top-0 h-screen bg-gray-900 w-64 transform transition-transform duration-300 z-50 border-r border-gray-800"
    >
      <div className="p-6 h-full flex flex-col">
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-3" onClick={onNavigate}>
            <img src={Logo} alt="Logo" className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-white">Muve𝄞</h1>
          </Link>
        </div>

        <nav className="flex-1 space-y-6">
          <div className="space-y-2">
            <Link
              to="/"
              className="block px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg"
              onClick={onNavigate}
            >
              Home
            </Link>
            <Link
              to="/library"
              className="block px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg"
              onClick={onNavigate}
            >
              Your Library
            </Link>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h2 className="px-4 mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
              D I S C O V E R Y
            </h2>
            <div className="space-y-2">
              {["Artists", "Album", "Your Playlist", "Radio", "Video"].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  className="block px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg"
                  onClick={onNavigate}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;