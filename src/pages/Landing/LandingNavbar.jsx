import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV = [
  { to: "/",          label: "Songs" },
  { to: "/features",  label: "Features" },
  { to: "/changelog", label: "Changelog" },
  { to: "/contact",   label: "Contact" },
];

export default function LandingNavbar() {
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname }          = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const active = (to) => to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <>
      <header className={`lp-navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="lp-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          {/* Logo */}
          <Link
            to="/"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", transform: "rotate(-1deg)", transition: "transform 0.2s ease" }}
            onMouseEnter={e => e.currentTarget.style.transform = "rotate(2deg)"}
            onMouseLeave={e => e.currentTarget.style.transform = "rotate(-1deg)"}
          >
            <img src="/muves/Muves.png" alt="Muves" style={{ height: 48, width: "auto", objectFit: "contain" }} />
          </Link>

          {/* Desktop nav */}
          <nav className="lp-hide-mobile" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            {NAV.map(l => (
              <Link key={l.to} to={l.to} className={`lp-nav-link ${active(l.to) ? "active" : ""}`}>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="lp-hide-mobile" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <a
              href="https://api.lijishwilson.in/muves/updates/muves-v0.1.0.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-btn lp-btn-primary lp-label-caps"
              style={{ transform: "rotate(1deg)", fontSize: 13, padding: "0.5rem 1rem" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
              Download
            </a>
            <Link
              to="/login"
              className="lp-btn lp-btn-secondary lp-label-caps"
              style={{ fontSize: 13, padding: "0.5rem 1rem" }}
            >
              Join Choir
            </Link>
          </div>

          {/* Hamburger */}
          <button
            className="lp-hide-desktop"
            onClick={() => setOpen(o => !o)}
            aria-label="Menu"
            style={{
              background: "var(--lp-surface-container-highest)",
              border: "2px solid var(--lp-on-surface)",
              boxShadow: "var(--lp-shadow-sm)",
              cursor: "pointer",
              color: "var(--lp-on-surface)",
              width: 40, height: 40,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "1.3rem" }}>
              {open ? "close" : "menu"}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`lp-drawer ${open ? "open" : ""}`}>
        <div style={{ height: "var(--lp-nav-h)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "2px solid var(--lp-on-surface)" }}>
          <img src="/muves/Muves.png" alt="Muves" style={{ height: 42, width: "auto", objectFit: "contain" }} />
          <button
            onClick={() => setOpen(false)}
            style={{ background: "var(--lp-surface-container-highest)", border: "2px solid var(--lp-on-surface)", boxShadow: "var(--lp-shadow-sm)", cursor: "pointer", color: "var(--lp-on-surface)", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>close</span>
          </button>
        </div>

        <div style={{ flex: 1, padding: "2.5rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {NAV.map((l, i) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="lp-headline-lg"
              style={{
                color: active(l.to) ? "var(--lp-primary)" : "var(--lp-on-surface)",
                textDecoration: "none",
                padding: "1rem 0",
                borderBottom: "2px dashed var(--lp-outline-variant)",
                display: "block",
                transform: `rotate(${[-1, 1, -0.5][i % 3]}deg)`,
                transition: "color 0.2s, transform 0.2s",
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <a href="https://api.lijishwilson.in/muves/updates/muves-v0.1.0.apk" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="lp-btn lp-btn-primary" style={{ justifyContent: "center", fontSize: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
            Download Android
          </a>
          <Link to="/login" onClick={() => setOpen(false)} className="lp-btn lp-btn-secondary" style={{ justifyContent: "center", fontSize: 16 }}>
            Open Web App
          </Link>
        </div>
      </div>
    </>
  );
}
