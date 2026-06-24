import React from "react";
import { Link } from "react-router-dom";

const LINKS = [
  { label: "Privacy Policy", href: "#" },
  { label: "Contact Us",     to: "/contact" },
  { label: "Resources",      href: "#" },
  { label: "Credits",        href: "#" },
];

export default function LandingFooter() {
  return (
    <footer style={{ background: "var(--lp-surface-container-low)", borderTop: "2px solid var(--lp-on-surface)", marginTop: 48 }}>
      <div
        className="lp-wrap lp-footer-cols"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2rem var(--lp-px)", gap: "1.5rem", flexWrap: "wrap" }}
      >
        <Link to="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <img src="/muves/Muves.png" alt="Muves" style={{ height: 40, width: "auto", objectFit: "contain", transform: "rotate(-2deg)", display: "block" }} />
        </Link>

        <nav style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", justifyContent: "center" }}>
          {LINKS.map(l => {
            const style = { color: "var(--lp-on-surface-variant)", textDecoration: "none", transition: "color 0.2s ease, transform 0.2s ease", display: "inline-block" };
            const hover = {
              onMouseEnter: e => { e.currentTarget.style.color = "var(--lp-secondary)"; e.currentTarget.style.transform = "rotate(2deg)"; },
              onMouseLeave: e => { e.currentTarget.style.color = "var(--lp-on-surface-variant)"; e.currentTarget.style.transform = "rotate(0deg)"; },
            };
            return l.to ? (
              <Link key={l.label} to={l.to} className="lp-label-caps" style={style} {...hover}>{l.label}</Link>
            ) : (
              <a key={l.label} href={l.href} className="lp-label-caps" style={style} {...hover}>{l.label}</a>
            );
          })}
        </nav>

        <p className="lp-body-md" style={{ color: "var(--lp-on-surface)", opacity: 0.75, maxWidth: 280, textAlign: "right", fontStyle: "italic" }}>
          Hand-stitched with love by the Muves team.{" "}
          <em style={{ fontStyle: "normal", fontWeight: 700 }}>Sing loudly!</em>
        </p>
      </div>

      <div style={{ borderTop: "2px dashed var(--lp-outline-variant)", padding: "0.75rem var(--lp-px)", display: "flex", justifyContent: "center" }}>
        <p className="lp-label-caps" style={{ color: "var(--lp-on-surface-variant)", opacity: 0.6 }}>
          © {new Date().getFullYear()} Muves · By Lijish Wilson
        </p>
      </div>
    </footer>
  );
}
