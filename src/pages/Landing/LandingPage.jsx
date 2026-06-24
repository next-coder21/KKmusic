import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import LandingNavbar from "./LandingNavbar";
import LandingFooter from "./LandingFooter";
import { useLandingBody } from "./useLandingBody";
import { API_CONFIG } from "../../config.js";
import "./landing.css";

/* ── Intersection reveal ── */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ── Floating notes ── */
const NOTE_ICONS = ["music_note", "queue_music", "music_cast"];
function FloatingNotes({ count = 8 }) {
  const [notes, setNotes] = useState([]);
  useEffect(() => {
    setNotes(Array.from({ length: count }, () => ({
      icon: NOTE_ICONS[Math.floor(Math.random() * NOTE_ICONS.length)],
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4,
      size: 16 + Math.random() * 22,
    })));
  }, [count]);
  return (
    <>
      {notes.map((n, i) => (
        <span key={i} className="material-symbols-outlined lp-floating-note" style={{ left: `${n.left}%`, top: `${n.top}%`, animationDelay: `${n.delay}s`, animationDuration: `${n.duration}s`, fontSize: n.size }}>{n.icon}</span>
      ))}
    </>
  );
}

/* ── Flip card ── */
const TORN_CLIP = "polygon(0% 2%,5% 0%,10% 3%,15% 0%,20% 2%,25% 0%,30% 3%,35% 0%,40% 2%,45% 0%,50% 3%,55% 0%,60% 2%,65% 0%,70% 3%,75% 0%,80% 2%,85% 0%,90% 3%,95% 0%,100% 2%,100% 98%,95% 100%,90% 97%,85% 100%,80% 98%,75% 100%,70% 97%,65% 100%,60% 98%,55% 100%,50% 97%,45% 100%,40% 98%,35% 100%,30% 97%,25% 100%,20% 98%,15% 100%,10% 97%,5% 100%,0% 98%)";
function FlipCard({ card }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div onMouseEnter={() => setFlipped(true)} onMouseLeave={() => setFlipped(false)} style={{ minWidth: 288, width: 320, height: 200, flexShrink: 0, perspective: 1000 }}>
      <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transition: "transform 0.55s cubic-bezier(0.23,1,0.32,1)", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
        <div style={{ position: "absolute", inset: 0, background: "#fff", border: "2px solid #1d1c16", boxShadow: "4px 4px 0px rgba(29,28,22,1)", padding: 24, WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden", transform: `rotate(${card.rotate})`, display: "flex", flexDirection: "column", justifyContent: "space-between", ...(card.torn ? { clipPath: TORN_CLIP } : {}) }}>
          <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%) rotate(-2deg)", width: 40, height: 15, background: "rgba(255,255,255,0.65)", boxShadow: "1px 1px 2px rgba(0,0,0,0.08)" }} />
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <span className="lp-label-caps" style={{ background: card.badgeBg, color: card.badgeColor, padding: "3px 8px", border: "1px solid #1d1c16" }}>{card.badge}</span>
              <span className="material-symbols-outlined" style={{ color: "var(--lp-on-surface-variant)", fontSize: 20 }}>{card.actionIcon ?? "favorite"}</span>
            </div>
            <h4 className="lp-subheading" style={{ color: "var(--lp-on-surface)", marginBottom: 4, fontSize: 20 }}>{card.title}</h4>
            <p className="lp-body-md" style={{ color: "var(--lp-on-surface-variant)" }}>{card.subtitle}</p>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--lp-primary)", fontFamily: "var(--lp-font-subheading)", fontWeight: 700, fontSize: 14, background: "none", border: "none", cursor: "pointer", padding: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>play_circle</span>
            {card.actionLabel ?? "Play Now"}
          </button>
        </div>
        <div style={{ position: "absolute", inset: 0, background: card.backBg, border: "2px solid #1d1c16", boxShadow: "4px 4px 0px rgba(29,28,22,1)", padding: 24, WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden", transform: `rotateY(180deg) rotate(${card.rotate})`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", ...(card.torn ? { clipPath: TORN_CLIP } : {}) }}>
          <h4 className="lp-subheading" style={{ color: card.backColor, marginBottom: 10, fontSize: 18 }}>Vanthu Paarungal!</h4>
          <p className="lp-body-md" style={{ color: card.backColor, fontStyle: "italic" }} dangerouslySetInnerHTML={{ __html: card.snippet }} />
        </div>
      </div>
    </div>
  );
}

/* ── Feature highlight cards (what you actually get) ── */
const FEATURE_CARDS = [
  { badge: "Lyrics",    badgeBg: "var(--lp-secondary-container)", badgeColor: "var(--lp-on-secondary-container)", title: "Sing Along", subtitle: "Words that light up as you listen", backBg: "var(--lp-secondary-container)", backColor: "var(--lp-on-secondary-container)", snippet: "Tamil, English & more — <br/>lyrics that scroll with every beat.", rotate: "-1deg", torn: true, actionLabel: "See Features", actionIcon: "mic" },
  { badge: "Streaming", badgeBg: "var(--lp-primary-container)",   badgeColor: "var(--lp-on-primary-container)",   title: "Just Press Play", subtitle: "Crystal-clear, no buffering", backBg: "var(--lp-primary-container)", backColor: "var(--lp-on-primary-container)", snippet: "Queue up to 500 songs,<br/>shuffle & loop to your heart's content.", rotate: "2deg", actionLabel: "Open App", actionIcon: "play_circle" },
  { badge: "Mobile",    badgeBg: "var(--lp-tertiary-container)",  badgeColor: "var(--lp-on-tertiary-container)",  title: "Take It Anywhere", subtitle: "Android app — listen offline too", backBg: "var(--lp-tertiary-container)", backColor: "var(--lp-on-tertiary-container)", snippet: "Download the app, save songs,<br/>and play even without internet.", rotate: "-2deg", torn: true, actionLabel: "Download", actionIcon: "phone_android" },
];

/* ── Song flip card (real DB data) ── */
const CARD_BG_PAIRS = [
  { front: "var(--lp-primary-container)",   color: "var(--lp-on-primary-container)"   },
  { front: "var(--lp-secondary-container)", color: "var(--lp-on-secondary-container)" },
  { front: "var(--lp-tertiary-container)",  color: "var(--lp-on-tertiary-container)"  },
  { front: "#fff",                           color: "var(--lp-on-surface)"             },
];
const CARD_ROTATIONS = ["-1.5deg", "2deg", "-2deg", "1deg", "-0.5deg", "1.5deg"];

function SongFlipCard({ song, rank, apiBase }) {
  const [flipped, setFlipped] = useState(false);
  const pair = CARD_BG_PAIRS[rank % CARD_BG_PAIRS.length];
  const rotate = CARD_ROTATIONS[rank % CARD_ROTATIONS.length];
  const coverSrc = song.cover_url ? `${apiBase}/cover/${song.id}` : null;

  return (
    <div
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      style={{ minWidth: 260, width: 280, height: 200, flexShrink: 0, perspective: 1000, scrollSnapAlign: "center" }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transition: "transform 0.55s cubic-bezier(0.23,1,0.32,1)", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
        {/* Front */}
        <div style={{ position: "absolute", inset: 0, background: "#fff", border: "2px solid #1d1c16", boxShadow: "4px 4px 0px rgba(29,28,22,1)", padding: 0, WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden", transform: `rotate(${rotate})`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {/* Tape strip */}
          <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%) rotate(-2deg)", width: 40, height: 15, background: "rgba(255,255,255,0.65)", boxShadow: "1px 1px 2px rgba(0,0,0,0.08)", zIndex: 2 }} />
          {/* Cover area */}
          <div style={{ position: "relative", height: 100, background: pair.front, overflow: "hidden", flexShrink: 0 }}>
            {coverSrc && (
              <img src={coverSrc} alt={song.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} onError={e => e.currentTarget.style.display = "none"} />
            )}
            {/* Rank badge */}
            <div style={{ position: "absolute", top: 8, left: 8, fontFamily: "var(--lp-font-headline)", fontSize: 32, fontWeight: 800, color: "rgba(255,255,255,0.9)", lineHeight: 1, textShadow: "1px 2px 4px rgba(0,0,0,0.5)" }}>
              #{rank + 1}
            </div>
            {/* Play count pill */}
            <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.65)", color: "#fff", fontFamily: "var(--lp-font-subheading)", fontSize: 11, fontWeight: 700, padding: "3px 8px", letterSpacing: "0.04em" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: "middle", marginRight: 3 }}>play_arrow</span>
              {fmtNum(song.play_count)}
            </div>
          </div>
          {/* Info */}
          <div style={{ flex: 1, padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontFamily: "var(--lp-font-subheading)", fontWeight: 700, fontSize: 14, color: "var(--lp-on-surface)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.title}</p>
              <p style={{ fontFamily: "var(--lp-font-body)", fontSize: 12, color: "var(--lp-on-surface-variant)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.artist_name || "Unknown artist"}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--lp-primary)", fontFamily: "var(--lp-font-subheading)", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>play_circle</span>
              Flip to see more
            </div>
          </div>
        </div>
        {/* Back */}
        <div style={{ position: "absolute", inset: 0, background: pair.front, border: "2px solid #1d1c16", boxShadow: "4px 4px 0px rgba(29,28,22,1)", padding: "1.5rem", WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden", transform: `rotateY(180deg) rotate(${rotate})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--lp-font-headline)", fontSize: 42, fontWeight: 800, color: pair.color, lineHeight: 1, marginBottom: 6 }}>{fmtNum(song.play_count)}</div>
          <div style={{ fontFamily: "var(--lp-font-subheading)", fontSize: 11, color: pair.color, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>total plays</div>
          <p style={{ fontFamily: "var(--lp-font-subheading)", fontWeight: 700, fontSize: 14, color: pair.color, margin: "0 0 4px", lineHeight: 1.3 }}>{song.title}</p>
          <p style={{ fontFamily: "var(--lp-font-body)", fontSize: 12, color: pair.color, opacity: 0.75, margin: 0 }}>{song.artist_name || "Unknown artist"}</p>
        </div>
      </div>
    </div>
  );
}

function spawnConfetti() {
  const colors = ["#735c00", "#ae2f34", "#006687", "#ffd966", "#87d6fe"];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement("div");
    el.className = "lp-confetti";
    el.style.left = `${Math.random() * 100}vw`;
    el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDelay = `${Math.random() * 2.5}s`;
    el.style.width = `${6 + Math.random() * 8}px`;
    el.style.height = `${6 + Math.random() * 8}px`;
    el.style.borderRadius = Math.random() > 0.5 ? "50%" : "0";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

function fmtNum(n) {
  if (!n && n !== 0) return "—";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function fmtDuration(secs) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ── Live Stats Bar ── */
function StatsBar({ stats, loading }) {
  const items = [
    { icon: "music_note",    label: "Songs",       value: fmtNum(stats?.totalSongs),   color: "var(--lp-primary)" },
    { icon: "artist",        label: "Artists",      value: fmtNum(stats?.totalArtists), color: "var(--lp-secondary)" },
    { icon: "album",         label: "Albums",       value: fmtNum(stats?.totalAlbums),  color: "var(--lp-tertiary)" },
    { icon: "play_circle",   label: "Total Plays",  value: fmtNum(stats?.totalPlays),   color: "var(--lp-primary)" },
  ];
  return (
    <section style={{ background: "var(--lp-on-surface)", padding: "1.25rem 0", overflow: "hidden" }}>
      <div className="lp-wrap" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "2.5rem" }}>
        {items.map((it, i) => (
          <div key={it.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", transform: `rotate(${[-1, 1, -0.5, 0.5][i]}deg)` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: it.color }}>
              {it.icon}
            </span>
            <div>
              <div style={{ fontFamily: "var(--lp-font-headline)", fontSize: 22, fontWeight: 800, color: it.color, lineHeight: 1 }}>
                {loading ? <span style={{ display: "inline-block", width: 48, height: 18, background: "rgba(255,255,255,0.15)", borderRadius: 4 }} /> : it.value}
              </div>
              <div style={{ fontFamily: "var(--lp-font-subheading)", fontSize: 11, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{it.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Top Songs Chart ── */
function TopSongsChart({ songs, loading, reveal }) {
  const maxPlays = songs?.[0]?.play_count || 1;
  return (
    <section style={{ padding: "5rem 0", background: "var(--lp-surface-container-lowest)" }}>
      <div className="lp-wrap">
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "inline-block", background: "var(--lp-primary-container)", padding: "4px 14px", border: "2px solid var(--lp-on-surface)", boxShadow: "var(--lp-shadow-sm)", transform: "rotate(-1.5deg)", marginBottom: 16 }}>
            <span className="lp-label-caps" style={{ color: "var(--lp-on-primary-container)" }}>🎵 Most Played</span>
          </div>
          <h2 ref={reveal.ref} className={`lp-headline-lg lp-reveal${reveal.visible ? " visible" : ""}`} style={{ color: "var(--lp-on-surface)", display: "inline-block", position: "relative", marginLeft: 0 }}>
            Top Played Songs
            <div style={{ position: "absolute", bottom: -6, left: 0, width: "100%", height: 8, background: "var(--lp-secondary-container)", zIndex: -1, transform: "rotate(-1deg)" }} />
          </h2>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ height: 64, background: "var(--lp-surface-container-high)", border: "2px solid var(--lp-outline-variant)", boxShadow: "var(--lp-shadow-sm)", animation: "lp-shimmer 1.4s ease-in-out infinite", opacity: 0.6 + i * 0.06 }} />
            ))}
          </div>
        ) : songs?.length === 0 ? (
          <p className="lp-body-lg" style={{ color: "var(--lp-on-surface-variant)" }}>No play data yet — be the first to listen!</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {songs?.map((song, i) => {
              const pct = Math.max(4, (song.play_count / maxPlays) * 100);
              const rotations = ["-0.5deg", "0.3deg", "-0.3deg", "0.5deg", "-0.2deg", "0.2deg", "-0.4deg", "0.4deg", "-0.1deg", "0.1deg"];
              const bgs = [
                "var(--lp-primary-container)",
                "var(--lp-secondary-container)",
                "var(--lp-tertiary-container)",
                "var(--lp-surface-container-high)",
                "var(--lp-surface-container-highest)",
              ];
              return (
                <div key={song.id} style={{ border: "2px solid var(--lp-on-surface)", boxShadow: "var(--lp-shadow-sm)", background: "#fff", transform: rotations[i % rotations.length], transition: "transform 0.2s ease, box-shadow 0.2s ease", cursor: "default", overflow: "hidden" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "rotate(0deg) scale(1.01)"; e.currentTarget.style.boxShadow = "var(--lp-shadow)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = rotations[i % rotations.length]; e.currentTarget.style.boxShadow = "var(--lp-shadow-sm)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem 1.1rem", position: "relative", zIndex: 1 }}>
                    {/* Rank */}
                    <div style={{ fontFamily: "var(--lp-font-headline)", fontSize: 28, fontWeight: 800, color: "var(--lp-outline)", minWidth: 36, textAlign: "center", lineHeight: 1 }}>
                      {i + 1}
                    </div>
                    {/* Cover */}
                    {song.cover_url ? (
                      <img src={`${API_CONFIG.MUSIC_URL}/cover/${song.id}`} alt={song.title} style={{ width: 44, height: 44, objectFit: "cover", border: "1.5px solid var(--lp-outline-variant)", flexShrink: 0 }} onError={e => e.currentTarget.style.display = "none"} />
                    ) : (
                      <div style={{ width: 44, height: 44, background: bgs[i % bgs.length], border: "1.5px solid var(--lp-outline-variant)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 22, color: "var(--lp-on-surface-variant)" }}>music_note</span>
                      </div>
                    )}
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "var(--lp-font-subheading)", fontWeight: 700, fontSize: 15, color: "var(--lp-on-surface)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.title}</p>
                      <p style={{ fontFamily: "var(--lp-font-body)", fontSize: 13, color: "var(--lp-on-surface-variant)", margin: "2px 0 6px" }}>{song.artist_name || "Unknown artist"}</p>
                      {/* Bar */}
                      <div style={{ height: 6, background: "var(--lp-outline-variant)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: i === 0 ? "var(--lp-primary)" : i === 1 ? "var(--lp-secondary)" : "var(--lp-tertiary)", borderRadius: 3, transition: "width 1s ease" }} />
                      </div>
                    </div>
                    {/* Plays */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "var(--lp-font-headline)", fontSize: 18, fontWeight: 800, color: i === 0 ? "var(--lp-primary)" : "var(--lp-on-surface)", lineHeight: 1 }}>{fmtNum(song.play_count)}</div>
                      <div style={{ fontFamily: "var(--lp-font-subheading)", fontSize: 10, color: "var(--lp-on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.06em" }}>plays</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <Link to="/login" className="lp-btn lp-btn-primary lp-wobble" style={{ fontSize: 15, transform: "rotate(-1deg)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>headphones</span>
            Listen to all songs
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ── */
const HOW_STEPS = [
  { step: "01", icon: "account_circle",  title: "Create your account",  desc: "Sign up with your email in seconds. No credit card — it's completely free.", bg: "var(--lp-primary-container)",   color: "var(--lp-on-primary-container)",   rotate: "-2deg" },
  { step: "02", icon: "search",          title: "Search or browse",     desc: "Find songs by title, artist, or album — it's all here in one place.", bg: "var(--lp-secondary-container)", color: "var(--lp-on-secondary-container)", rotate: "1.5deg" },
  { step: "03", icon: "play_circle",     title: "Press play",           desc: "Hit play and enjoy. The music bar follows you no matter where you go in the app.", bg: "var(--lp-tertiary-container)",  color: "var(--lp-on-tertiary-container)",  rotate: "-1deg" },
  { step: "04", icon: "lyrics",          title: "Read the lyrics",      desc: "Tap Lyrics in the player — words scroll in sync with the song in Tamil & English.", bg: "var(--lp-primary-container)",   color: "var(--lp-on-primary-container)",   rotate: "2deg" },
];

function HowItWorks({ reveal }) {
  return (
    <section style={{ padding: "5rem 0", background: "var(--lp-surface-container-low)", borderTop: "2px dashed var(--lp-on-surface)", borderBottom: "2px dashed var(--lp-on-surface)" }}>
      <div className="lp-wrap">
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "inline-block", background: "var(--lp-surface-container-highest)", padding: "4px 16px", border: "2px solid var(--lp-on-surface)", boxShadow: "var(--lp-shadow-sm)", transform: "rotate(-1deg)", marginBottom: 16 }}>
            <span className="lp-label-caps" style={{ color: "var(--lp-tertiary)" }}>Simple as 1-2-3-4</span>
          </div>
          <h2 ref={reveal.ref} className={`lp-headline-lg lp-reveal${reveal.visible ? " visible" : ""}`} style={{ color: "var(--lp-on-surface)", display: "inline-block" }}>
            How it works
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
          {HOW_STEPS.map((s, i) => (
            <div
              key={s.step}
              className={`lp-reveal${reveal.visible ? " visible" : ""}`}
              style={{ background: s.bg, border: "2px solid var(--lp-on-surface)", boxShadow: "var(--lp-shadow)", padding: "2rem 1.5rem", transform: s.rotate, transition: "transform 0.2s ease, box-shadow 0.2s ease", transitionDelay: `${i * 0.08}s`, cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "rotate(0deg) scale(1.02)"; e.currentTarget.style.boxShadow = "var(--lp-shadow-lg)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = s.rotate; e.currentTarget.style.boxShadow = "var(--lp-shadow)"; }}
            >
              {/* Step number */}
              <div style={{ fontFamily: "var(--lp-font-headline)", fontSize: 48, fontWeight: 800, color: "rgba(0,0,0,0.08)", lineHeight: 1, marginBottom: 8 }}>{s.step}</div>
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: s.color, display: "block", marginBottom: 12 }}>{s.icon}</span>
              <h3 className="lp-subheading" style={{ color: "var(--lp-on-surface)", marginBottom: 8, fontSize: 18 }}>{s.title}</h3>
              <p className="lp-body-md" style={{ color: "var(--lp-on-surface-variant)" }}>{s.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link to="/login" className="lp-btn lp-btn-secondary lp-wobble" style={{ fontSize: 16, transform: "rotate(1deg)" }}>
            Get started — it's free 🎵
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ══════════ PAGE ══════════ */
export default function LandingPage() {
  useLandingBody();
  const [mounted, setMounted] = useState(false);
  const [stats,   setStats]   = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch(`${API_CONFIG.MUSIC_URL}/platform-stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d); })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const heroReveal    = useReveal(0.05);
  const featReveal    = useReveal(0.08);
  const topSongsReveal = useReveal(0.08);
  const howReveal     = useReveal(0.08);
  const catalogReveal = useReveal(0.08);
  const actionReveal  = useReveal(0.08);
  const ctaReveal     = useReveal(0.4);
  const ctaFired      = useRef(false);

  useEffect(() => {
    if (ctaReveal.visible && !ctaFired.current) { ctaFired.current = true; spawnConfetti(); }
  }, [ctaReveal.visible]);

  return (
    <div className="landing-root">
      <LandingNavbar />

      <main style={{ flex: 1, paddingTop: "var(--lp-nav-h)" }}>

        {/* ══ HERO ══ */}
        <section style={{ position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 40, left: 40, width: 160, height: 160, borderRadius: "50%", background: "var(--lp-primary-container)", opacity: 0.18, filter: "blur(50px)", zIndex: 0, pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 30, right: 40, width: 220, height: 220, borderRadius: "50%", background: "var(--lp-secondary-container)", opacity: 0.15, filter: "blur(60px)", zIndex: 0, pointerEvents: "none" }} />

          <div className="lp-wrap lp-hero-cols" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "3rem", padding: "4rem var(--lp-px) 5rem", position: "relative", zIndex: 1 }}>
            {/* Left */}
            <div ref={heroReveal.ref} style={{ flex: 1, zIndex: 10 }}>
              <div style={{ display: "inline-block", background: "var(--lp-surface-container-highest)", padding: "4px 14px", border: "2px solid var(--lp-on-surface)", borderRadius: 9999, boxShadow: "var(--lp-shadow-sm)", transform: "rotate(-3deg)", marginBottom: 24 }}>
                <span className="lp-label-caps" style={{ color: "var(--lp-primary)" }}>VBS 2026 — This Year's Collection!</span>
              </div>
              <h1 className={`lp-headline-xl lp-reveal${heroReveal.visible ? " visible" : ""}`} style={{ color: "var(--lp-on-surface)", transform: "rotate(1deg)", marginBottom: "1.25rem", transitionDelay: "0.05s" }}>
                Ting ting! VBS paadalgal ippo unga pocket-la!
              </h1>
              <p className={`lp-body-lg lp-reveal${heroReveal.visible ? " visible" : ""}`} style={{ color: "var(--lp-on-surface-variant)", maxWidth: 500, marginBottom: "2rem", transitionDelay: "0.14s" }}>
                Stream on web, download the Android APK, and get AI-generated LRC lyrics in Tamil &amp; English.
              </p>
              <div className={`lp-reveal${heroReveal.visible ? " visible" : ""}`} style={{ display: "flex", flexWrap: "wrap", gap: "1rem", transitionDelay: "0.24s" }}>
                <a href="https://api.lijishwilson.in/muves/updates/muves-v0.1.0.apk" target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-primary lp-wobble" style={{ transform: "rotate(-1deg)", clipPath: TORN_CLIP }}>
                  🤖 Download Android
                </a>
                <Link to="/login" className="lp-btn lp-btn-secondary lp-wobble" style={{ transform: "rotate(2deg)" }}>
                  🌐 Open Web App
                </Link>
              </div>
            </div>

            {/* Right — mascot */}
            <div className={`lp-reveal lp-hide-mobile${heroReveal.visible ? " visible" : ""}`} style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative", transitionDelay: "0.34s", minWidth: 240, maxWidth: 420 }}>
              <div style={{ position: "relative", width: 320, height: 320 }}>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdcKZ8FlpMtaYbwaa_C3w7pLFwbSrIihxg0R1yyG5XRKPlsA9-Y5TTg027Hz64U7uEygZTubdqFgeZ64EUgRfpTD6XIv0mYKYb5jrX4UhinB94kLIg9suhbFRY4gsxeEIADr61N_l8L-txbeD5v2ztRdkFwCoakBkdb78e7x-E0obfqNUcY9_wO7bTOFB8zMqoKWtUo8gfSVqrjxhbltpMbgBPzPz5Ml4F_yiQXwKbl8M6isnq_FOKKN3KIW0wOGuR2_AphBmPIrg"
                  alt="Muves Singing Sparrow mascot"
                  style={{ width: "100%", height: "100%", objectFit: "contain", transform: "rotate(3deg)", transition: "transform 500ms ease", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "rotate(-2deg)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "rotate(3deg)"}
                />
                <div style={{ position: "absolute", top: 16, right: -16, background: "var(--lp-tertiary-container)", color: "var(--lp-on-tertiary-container)", padding: "8px 14px", border: "2px solid var(--lp-on-surface)", boxShadow: "var(--lp-shadow-sm)", transform: "rotate(15deg)", fontFamily: "var(--lp-font-subheading)", fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  NEW!
                </div>
              </div>
            </div>
          </div>
          {mounted && <FloatingNotes count={10} />}
        </section>

        {/* ══ LIVE STATS BAR ══ */}
        <StatsBar stats={stats} loading={statsLoading} />

        {/* ══ HOW IT WORKS ══ */}
        <HowItWorks reveal={howReveal} />

        {/* ══ TOP SONGS CHART ══ */}
        <TopSongsChart songs={stats?.topSongs} loading={statsLoading} reveal={topSongsReveal} />

        {/* ══ FEATURETTES ══ */}
        <section style={{ background: "var(--lp-surface-container-low)", padding: "5rem 0", borderTop: "2px dashed var(--lp-on-surface)", borderBottom: "2px dashed var(--lp-on-surface)" }}>
          <div ref={featReveal.ref} className="lp-wrap lp-feat-cols" style={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: "3.5rem", flexWrap: "wrap" }}>
            {[
              { icon: "play_circle",  label: "Stream Instantly",   desc: "Open the app, tap a song, and it plays — no setup, no ads, completely free.", rotate: "-2deg", hoverBg: "var(--lp-primary-container)" },
              { icon: "mic",          label: "Lyrics That Sync",   desc: "Words light up line by line as the song plays, in Tamil, English, and more.", rotate: "3deg",  hoverBg: "var(--lp-secondary-container)" },
              { icon: "phone_android", label: "Offline Listening",  desc: "Download the Android app, save your favourite songs, and listen without internet.", rotate: "-1deg", hoverBg: "var(--lp-tertiary-container)" },
            ].map((f, i) => (
              <div key={f.label} className={`lp-reveal${featReveal.visible ? " visible" : ""}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem", maxWidth: 230, transitionDelay: `${i * 0.1}s` }}>
                <div
                  style={{ width: 96, height: 96, background: "var(--lp-surface)", borderRadius: "50%", border: "2px solid var(--lp-on-surface)", boxShadow: "var(--lp-shadow)", display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${f.rotate})`, transition: "background 0.2s ease, transform 0.2s ease", cursor: "default" }}
                  onMouseEnter={e => { e.currentTarget.style.background = f.hoverBg; e.currentTarget.style.transform = `rotate(${f.rotate}) scale(1.06)`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--lp-surface)"; e.currentTarget.style.transform = `rotate(${f.rotate})`; }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: "var(--lp-on-surface)" }}>{f.icon}</span>
                </div>
                <div>
                  <h3 className="lp-subheading" style={{ color: "var(--lp-on-surface)", marginBottom: 6 }}>{f.label}</h3>
                  <p className="lp-body-md" style={{ color: "var(--lp-on-surface-variant)" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ WHAT YOU GET — FEATURE FLIP CARDS ══ */}
        <section style={{ padding: "5rem 0", overflow: "hidden" }}>
          <div className="lp-wrap" style={{ marginBottom: "2.5rem" }}>
            <h2 ref={catalogReveal.ref} className={`lp-headline-lg lp-reveal${catalogReveal.visible ? " visible" : ""}`} style={{ color: "var(--lp-on-surface)", display: "inline-block", position: "relative" }}>
              What you actually get
              <div style={{ position: "absolute", bottom: -8, left: 0, width: "100%", height: 8, background: "var(--lp-primary-container)", zIndex: -1, transform: "rotate(-1deg)" }} />
            </h2>
            <p className="lp-body-md" style={{ color: "var(--lp-on-surface-variant)", marginTop: 24 }}>Hover a card to flip it — every feature below is shipped and working.</p>
          </div>
          <div className="lp-card-scroll lp-hide-scrollbar" style={{ display: "flex", gap: "2rem", overflowX: "auto", paddingBottom: "2rem", paddingLeft: "var(--lp-px)", paddingRight: "var(--lp-px)", scrollSnapType: "x mandatory" }}>
            {FEATURE_CARDS.map(card => (
              <div key={card.title} style={{ scrollSnapAlign: "center" }}><FlipCard card={card} /></div>
            ))}
          </div>
        </section>

        {/* ══ TRENDING SONGS — REAL DB DATA ══ */}
        <section style={{ padding: "5rem 0", overflow: "hidden", background: "var(--lp-surface-container-low)", borderTop: "2px dashed var(--lp-outline-variant)", borderBottom: "2px dashed var(--lp-outline-variant)" }}>
          <div className="lp-wrap" style={{ marginBottom: "2.5rem" }}>
            <h2 ref={actionReveal.ref} className={`lp-headline-lg lp-reveal${actionReveal.visible ? " visible" : ""}`} style={{ color: "var(--lp-on-surface)", display: "inline-block", position: "relative" }}>
              🔥 Now Trending
              <div style={{ position: "absolute", bottom: -8, left: 0, width: "100%", height: 8, background: "var(--lp-secondary-container)", zIndex: -1, transform: "rotate(1deg)", opacity: 0.7 }} />
            </h2>
            <p className="lp-body-md" style={{ color: "var(--lp-on-surface-variant)", marginTop: 24 }}>Hover a card to flip it — real play counts, live from the database.</p>
          </div>
          {statsLoading ? (
            <div className="lp-wrap" style={{ display: "flex", gap: "2rem" }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ minWidth: 260, width: 280, height: 200, flexShrink: 0, background: "var(--lp-surface-container-high)", border: "2px solid var(--lp-outline-variant)", animation: "lp-shimmer 1.4s ease-in-out infinite", opacity: 0.5 + i * 0.1 }} />
              ))}
            </div>
          ) : stats?.topSongs?.length > 0 ? (
            <div className="lp-card-scroll lp-hide-scrollbar" style={{ display: "flex", gap: "2rem", overflowX: "auto", paddingBottom: "2rem", paddingLeft: "var(--lp-px)", paddingRight: "var(--lp-px)", scrollSnapType: "x mandatory" }}>
              {stats.topSongs.map((song, i) => (
                <SongFlipCard key={song.id} song={song} rank={i} apiBase={API_CONFIG.MUSIC_URL} />
              ))}
            </div>
          ) : (
            <div className="lp-wrap">
              <p className="lp-body-lg" style={{ color: "var(--lp-on-surface-variant)" }}>No play data yet — be the first to listen!</p>
            </div>
          )}
        </section>

        {/* ══ FINAL CTA ══ */}
        <section style={{ maxWidth: 896, margin: "0 auto", padding: "6rem var(--lp-px) 6rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div ref={ctaReveal.ref} className={`lp-reveal${ctaReveal.visible ? " visible" : ""}`} style={{ background: "var(--lp-primary-container)", border: "2px solid var(--lp-on-surface)", boxShadow: "var(--lp-shadow-lg)", padding: "4rem 3rem", transform: "rotate(1deg)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, left: -40, width: 140, height: 140, borderRadius: "50%", background: "var(--lp-surface)", opacity: 0.5, pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "var(--lp-surface)", opacity: 0.5, pointerEvents: "none" }} />
            <h2 className="lp-headline-lg" style={{ color: "var(--lp-on-primary-container)", marginBottom: "1rem", position: "relative", zIndex: 1 }}>
              Ready to make a joyful noise?
            </h2>
            <p className="lp-body-lg" style={{ color: "var(--lp-on-primary-container)", maxWidth: 500, margin: "0 auto 2rem", position: "relative", zIndex: 1 }}>
              Grab your songbook, warm up those vocal cords, and let's get singing!
            </p>
            <Link to="/login" className="lp-btn lp-btn-surface lp-wobble" style={{ border: "4px solid var(--lp-on-surface)", boxShadow: "var(--lp-shadow)", transform: "rotate(-2deg)", fontSize: 20, fontWeight: 800, padding: "1rem 2rem", display: "inline-flex", position: "relative", zIndex: 1 }}>
              Get Started! 🎶
            </Link>
          </div>
          {mounted && <FloatingNotes count={8} />}
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
