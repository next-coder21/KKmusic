import React, { useState, useRef } from "react";
import LandingNavbar from "./LandingNavbar";
import LandingFooter from "./LandingFooter";
import { useLandingBody } from "./useLandingBody";
import { CHANGELOG, LATEST, TAG_STYLES } from "./changelog.js";
import "./landing.css";

function countByType(entry) {
  const counts = {};
  for (const c of entry.changes) counts[c.type] = (counts[c.type] ?? 0) + 1;
  return counts;
}

function ChangelogCard({ entry, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const isLatest = entry.version === LATEST;
  const counts   = countByType(entry);

  return (
    <div style={{ border: `2px solid ${isLatest ? "var(--lp-on-surface)" : "var(--lp-outline-variant)"}`, background: isLatest ? "var(--lp-primary-container)" : "var(--lp-surface-container-lowest)", boxShadow: open ? (isLatest ? "var(--lp-shadow-lg)" : "var(--lp-shadow)") : (isLatest ? "var(--lp-shadow)" : "var(--lp-shadow-sm)"), transform: open ? "none" : `rotate(${isLatest ? "-0.5deg" : "0.3deg"})`, transition: "box-shadow 0.2s ease, transform 0.2s ease", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem 1.5rem", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", color: "var(--lp-on-surface)", borderBottom: open ? "2px dashed var(--lp-outline-variant)" : "none" }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
            <span className="lp-label-caps" style={{ color: isLatest ? "var(--lp-on-primary-container)" : "var(--lp-primary)", fontWeight: 800 }}>{entry.version}</span>
            {isLatest && (
              <span style={{ background: "var(--lp-on-surface)", color: "var(--lp-primary-container)", padding: "2px 10px", fontFamily: "var(--lp-font-subheading)", fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>Latest</span>
            )}
            <span className="lp-body-md" style={{ color: isLatest ? "var(--lp-on-primary-container)" : "var(--lp-on-surface-variant)", opacity: 0.7 }}>
              {new Date(entry.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <p className="lp-subheading" style={{ color: isLatest ? "var(--lp-on-primary-container)" : "var(--lp-on-surface)", margin: 0, fontSize: 18, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.headline}</p>
        </div>

        <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {Object.entries(counts).map(([type, n]) => {
            const tag = TAG_STYLES[type];
            return (
              <span key={type} className="lp-label-caps" style={{ padding: "2px 8px", background: tag.bg, color: tag.color, border: "1px solid var(--lp-on-surface)", fontSize: 10 }}>
                {n} {tag.label}
              </span>
            );
          })}
        </div>

        <span style={{ fontSize: "1.1rem", color: isLatest ? "var(--lp-on-primary-container)" : "var(--lp-on-surface-variant)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease", flexShrink: 0 }}>▾</span>
      </button>

      <div style={{ maxHeight: open ? "2000px" : "0", overflow: "hidden", transition: "max-height 0.35s ease" }}>
        <ul style={{ display: "flex", flexDirection: "column", gap: "0.6rem", listStyle: "none", padding: "1.25rem 1.5rem 1.5rem", margin: 0 }}>
          {entry.changes.map((c, i) => {
            const tag = TAG_STYLES[c.type];
            return (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <span className="lp-label-caps" style={{ padding: "2px 8px", background: tag.bg, color: tag.color, border: "1px solid var(--lp-on-surface)", flexShrink: 0, minWidth: 60, textAlign: "center", fontSize: 10, marginTop: 2 }}>{tag.label}</span>
                <span className="lp-body-md" style={{ color: "var(--lp-on-surface)", lineHeight: 1.6 }}>{c.text}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

const ROTATIONS = [-1, 1, -0.5, 0.5];

export default function ChangelogPage() {
  useLandingBody();
  const refs = useRef({});

  const scrollTo = (version) => refs.current[version]?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="landing-root">
      <LandingNavbar />

      <main style={{ flex: 1, paddingTop: "var(--lp-nav-h)" }}>
        {/* Hero */}
        <section style={{ padding: "5rem var(--lp-px) 4rem", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: "8%", width: "40%", height: "100%", background: "radial-gradient(ellipse, rgba(255,217,102,0.18) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(60px)" }} />
          <div style={{ position: "absolute", top: 0, right: "5%", width: "35%", height: "100%", background: "radial-gradient(ellipse, rgba(174,47,52,0.1) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(60px)" }} />

          <div className="lp-sticker lp-sticker-md lp-float"   style={{ top: "22%", right: "10%" }}>🎵</div>
          <div className="lp-sticker lp-sticker-sm lp-float-b" style={{ top: "60%", right: "5%" }}>⭐</div>
          <div className="lp-sticker lp-sticker-md lp-float-c" style={{ bottom: "14%", right: "26%" }}>🚀</div>

          <div className="lp-wrap" style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-block", background: "var(--lp-surface-container-highest)", padding: "4px 16px", border: "2px solid var(--lp-on-surface)", boxShadow: "var(--lp-shadow-sm)", transform: "rotate(-2deg)", marginBottom: "1.5rem" }}>
              <span className="lp-label-caps" style={{ color: "var(--lp-tertiary)" }}>Release History</span>
            </div>
            <h1 className="lp-headline-xl" style={{ color: "var(--lp-on-surface)", transform: "rotate(1deg)", marginBottom: "1rem", display: "block" }}>
              Every Beat,<br />Every Update.
            </h1>
            <div style={{ width: "min(180px,55%)", height: 8, background: "var(--lp-tertiary-container)", marginBottom: "1.5rem", transform: "rotate(-1deg)" }} />
            <p className="lp-body-lg" style={{ color: "var(--lp-on-surface-variant)", maxWidth: 520 }}>
              Every fix, feature, and joyful improvement — tracked since day one.
            </p>
          </div>
        </section>

        {/* Changelog list */}
        <section style={{ padding: "0 0 5rem" }}>
          <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 var(--lp-px)" }}>
            {/* Version quick-jump pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem", paddingBottom: "2rem", borderBottom: "2px dashed var(--lp-outline-variant)" }}>
              {CHANGELOG.map((entry, i) => (
                <button
                  key={entry.version}
                  onClick={() => scrollTo(entry.version)}
                  className="lp-label-caps"
                  style={{ padding: "0.4rem 1rem", border: "2px solid var(--lp-on-surface)", boxShadow: "var(--lp-shadow-sm)", fontSize: 12, cursor: "pointer", color: entry.version === LATEST ? "var(--lp-on-primary-container)" : "var(--lp-on-surface-variant)", background: entry.version === LATEST ? "var(--lp-primary-container)" : "var(--lp-surface-container-lowest)", transform: `rotate(${ROTATIONS[i % 4]}deg)`, transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = `rotate(${ROTATIONS[i % 4]}deg) scale(1.05)`; e.currentTarget.style.boxShadow = "var(--lp-shadow)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = `rotate(${ROTATIONS[i % 4]}deg) scale(1)`; e.currentTarget.style.boxShadow = "var(--lp-shadow-sm)"; }}
                >
                  {entry.version}
                </button>
              ))}
            </div>

            {/* Accordion entries */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {CHANGELOG.map(entry => (
                <div key={entry.version} ref={el => { refs.current[entry.version] = el; }} style={{ scrollMarginTop: "calc(var(--lp-nav-h) + 1rem)" }}>
                  <ChangelogCard entry={entry} defaultOpen={entry.version === LATEST} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
