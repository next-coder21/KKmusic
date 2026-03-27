import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Library, User } from "lucide-react";

const items = [
  { name: "Home",    path: "/",               icon: Home    },
  { name: "Search",  path: "/search",         icon: Search  },
  { name: "Library", path: "/library",        icon: Library },
  { name: "Profile", path: "/update-profile", icon: User    },
];

export default function MobileNav() {
  const location = useLocation();
  return (
    <nav className="mobile-nav-bar">
      {items.map(({ name, path, icon: Icon }) => {
        const active = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
        return (
          <Link key={name} to={path} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 3, textDecoration: "none",
            color: active ? "var(--accent)" : "var(--text-muted)",
            transition: "color .15s",
          }}>
            <Icon size={18} style={{ transform: active ? "scale(1.1)" : "scale(1)", transition: "transform .15s" }} />
            <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, fontFamily: "'Outfit',sans-serif", letterSpacing: ".04em" }}>{name}</span>
            {active && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent)", marginTop: -1 }} />}
          </Link>
        );
      })}
    </nav>
  );
}
