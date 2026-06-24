import React, { useState } from "react";
import { Link } from "react-router-dom";
import LandingNavbar from "./LandingNavbar";
import LandingFooter from "./LandingFooter";
import { useLandingBody } from "./useLandingBody";
import "./landing.css";

const FEATURES = [
  {
    badge: "Streaming",
    icon: "play_circle",
    title: "Stream Any Song",
    subtitle: "High-quality audio, instantly.",
    description: "Every VBS song plays right in your browser or on the Android app — no ads, no buffering, completely free. The music bar stays with you no matter which page you visit.",
    details: ["Works on web & Android", "Queue up to 500 songs", "Shuffle & loop modes", "Player stays open while browsing"],
    rotate: "-1deg",
    badgeBg: "var(--lp-primary-container)",
    badgeColor: "var(--lp-on-primary-container)",
  },
  {
    badge: "Lyrics",
    icon: "mic",
    title: "Lyrics That Follow Along",
    subtitle: "Words light up as the song plays.",
    description: "Open the Lyrics panel in the player and watch the words scroll in time with the music — in Tamil, English, and more. No need to search elsewhere; the lyrics are already there.",
    details: ["Tamil & English support", "Words sync to the beat", "20+ language support", "Available on web & Android"],
    rotate: "1.5deg",
    badgeBg: "var(--lp-secondary-container)",
    badgeColor: "var(--lp-on-secondary-container)",
  },
  {
    badge: "Library",
    icon: "library_music",
    title: "Playlists & Favourites",
    subtitle: "Your music, your way.",
    description: "Build playlists, rename them, share them with friends, or keep them private. Heart any song and find it in your Favourites in one tap. Play all, shuffle — it's your collection.",
    details: ["Create & rename playlists", "Public or private playlists", "Reorder songs in a playlist", "Favourites with play-all & shuffle"],
    rotate: "-1.5deg",
    badgeBg: "var(--lp-tertiary-container)",
    badgeColor: "var(--lp-on-tertiary-container)",
  },
  {
    badge: "Search",
    icon: "search",
    title: "Find Any Song",
    subtitle: "Titles, artists, albums — all at once.",
    description: "Type a word and Muves searches songs, artists, and albums at the same time. Your recent searches are saved so you can jump back in without retyping.",
    details: ["Search songs, artists & albums", "Recent search history", "Tamil & English queries", "Available on web & Android"],
    rotate: "1deg",
    badgeBg: "var(--lp-primary-container)",
    badgeColor: "var(--lp-on-primary-container)",
  },
  {
    badge: "Stats",
    icon: "bar_chart",
    title: "Your Listening Story",
    subtitle: "See what you've been playing.",
    description: "Your profile keeps track of every song you've listened to — how many songs, how many hours, and which artists you keep coming back to. Follow your favourite artists to stay connected.",
    details: ["Total songs & hours listened", "Top artists you follow", "Full listening history", "Daily play breakdown"],
    rotate: "-1deg",
    badgeBg: "var(--lp-secondary-container)",
    badgeColor: "var(--lp-on-secondary-container)",
  },
  {
    badge: "Mobile",
    icon: "phone_android",
    title: "Android App",
    subtitle: "Take the music everywhere.",
    description: "Download the free Android app and take VBS songs wherever you go. Save songs to listen without internet, see song info on your lock screen, and choose your preferred playback quality.",
    details: ["Save songs & play offline", "Song on your lock screen", "Choose playback quality", "Lyrics panel in the app"],
    rotate: "1.5deg",
    badgeBg: "var(--lp-tertiary-container)",
    badgeColor: "var(--lp-on-tertiary-container)",
  },
  {
    badge: "Account",
    icon: "manage_accounts",
    title: "Your Profile",
    subtitle: "Safe, simple, always yours.",
    description: "Sign up with your email in seconds. Forgot your password? Reset it easily from the login page. Update your name, photo, and personal details any time from Settings.",
    details: ["Easy email sign-up", "Password reset by email", "Update name & profile photo", "Manage your active logins"],
    rotate: "-1.5deg",
    badgeBg: "var(--lp-primary-container)",
    badgeColor: "var(--lp-on-primary-container)",
  },
  {
    badge: "Themes",
    icon: "contrast",
    title: "Dark & Light Themes",
    subtitle: "Pick what feels right for you.",
    description: "Choose the dark theme for night listening or the light theme for bright days — switch any time from Settings. Your choice is saved and works on both the web app and Android.",
    details: ["Dark theme for night mode", "Light theme for daytime", "Follows your device setting", "Instant switch, no reload"],
    rotate: "1deg",
    badgeBg: "var(--lp-secondary-container)",
    badgeColor: "var(--lp-on-secondary-container)",
  },
];

function FeatureBlock({ feature, idx }) {
  const isEven = idx % 2 === 0;
  return (
    <div className="lp-feat-block" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center" }}>
      <div className="lp-feat-icon" style={{ order: isEven ? 2 : 1, display: "flex", justifyContent: "center" }}>
        <div
          style={{ width: 200, height: 200, background: feature.badgeBg, border: "2px solid var(--lp-on-surface)", boxShadow: "var(--lp-shadow-lg)", borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px", display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${feature.rotate})`, transition: "transform 0.3s ease", cursor: "default" }}
          onMouseEnter={e => e.currentTarget.style.transform = `rotate(${feature.rotate}) scale(1.06)`}
          onMouseLeave={e => e.currentTarget.style.transform = `rotate(${feature.rotate})`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 80, color: feature.badgeColor }}>{feature.icon}</span>
        </div>
      </div>
      <div style={{ order: isEven ? 1 : 2 }}>
        <div style={{ display: "inline-block", background: feature.badgeBg, color: feature.badgeColor, padding: "4px 12px", border: "1px solid var(--lp-on-surface)", boxShadow: "var(--lp-shadow-sm)", marginBottom: "1rem", transform: "rotate(-1deg)" }}>
          <span className="lp-label-caps" style={{ color: feature.badgeColor }}>{feature.badge}</span>
        </div>
        <h2 className="lp-headline-lg" style={{ color: "var(--lp-on-surface)", marginBottom: "0.5rem" }}>{feature.title}</h2>
        <p className="lp-subheading" style={{ color: feature.badgeColor, marginBottom: "1.25rem", fontSize: 18 }}>{feature.subtitle}</p>
        <p className="lp-body-lg" style={{ color: "var(--lp-on-surface-variant)", marginBottom: "1.5rem" }}>{feature.description}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {feature.details.map(d => (
            <div key={d} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", padding: "0.6rem 0.75rem", background: "#fff", border: "1.5px solid var(--lp-on-surface)", boxShadow: "var(--lp-shadow-sm)" }}>
              <span style={{ color: feature.badgeColor, flexShrink: 0, marginTop: 2 }}>✦</span>
              <span className="lp-body-md" style={{ fontWeight: 600, color: "var(--lp-on-surface)" }}>{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FeaturesPage() {
  useLandingBody();
  return (
    <div className="landing-root">
      <LandingNavbar />

      <main style={{ flex: 1, paddingTop: "var(--lp-nav-h)" }}>
        {/* Hero */}
        <section style={{ padding: "5rem var(--lp-px) 4rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: "10%", width: "40%", height: "100%", background: "radial-gradient(ellipse, rgba(255,217,102,0.2) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(60px)" }} />
          <div style={{ position: "absolute", top: 0, right: "5%", width: "35%", height: "100%", background: "radial-gradient(ellipse, rgba(135,214,254,0.18) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(60px)" }} />

          <div className="lp-sticker lp-sticker-lg lp-float"   style={{ top: "20%", left: "6%" }}>🎵</div>
          <div className="lp-sticker lp-sticker-md lp-float-b" style={{ top: "15%", right: "8%" }}>⚡</div>
          <div className="lp-sticker lp-sticker-sm lp-float-c" style={{ bottom: "14%", left: "12%" }}>✨</div>
          <div className="lp-sticker lp-sticker-md lp-float"   style={{ bottom: "16%", right: "6%" }}>🎶</div>

          <div className="lp-wrap" style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-block", background: "var(--lp-surface-container-highest)", padding: "4px 16px", border: "2px solid var(--lp-on-surface)", boxShadow: "var(--lp-shadow-sm)", transform: "rotate(-2deg)", marginBottom: "1.5rem" }}>
              <span className="lp-label-caps" style={{ color: "var(--lp-primary)" }}>Everything Muves can do</span>
            </div>
            <h1 className="lp-headline-xl" style={{ color: "var(--lp-on-surface)", transform: "rotate(1deg)", marginBottom: "1.25rem", display: "inline-block" }}>
              All the good stuff,<br />ready for you now.
            </h1>
            <div style={{ width: "min(200px,60%)", height: 8, background: "var(--lp-primary-container)", margin: "0 auto 1.5rem", transform: "rotate(-1deg)" }} />
            <p className="lp-body-lg" style={{ color: "var(--lp-on-surface-variant)", maxWidth: 540, margin: "0 auto" }}>
              Stream, save, sing along — here's everything waiting for you inside the app.
            </p>
          </div>
        </section>

        {/* Feature cards */}
        <section style={{ padding: "0 0 5rem" }}>
          <div className="lp-wrap" style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
            {FEATURES.map((f, idx) => <FeatureBlock key={f.title} feature={f} idx={idx} />)}
          </div>
        </section>

        {/* CTA */}
        <section style={{ maxWidth: 860, margin: "0 auto", padding: "5rem var(--lp-px)" }}>
          <div style={{ background: "var(--lp-secondary-container)", border: "2px solid var(--lp-on-surface)", boxShadow: "var(--lp-shadow-lg)", padding: "3.5rem 2.5rem", textAlign: "center", transform: "rotate(-1deg)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "var(--lp-surface)", opacity: 0.4, pointerEvents: "none" }} />
            <h2 className="lp-headline-lg" style={{ color: "var(--lp-on-secondary-container)", marginBottom: "0.75rem", position: "relative", zIndex: 1 }}>Ready to explore the app?</h2>
            <p className="lp-body-lg" style={{ color: "var(--lp-on-secondary-container)", maxWidth: 400, margin: "0 auto 2rem", position: "relative", zIndex: 1 }}>Sign in on the web or grab the Android APK — it's completely free.</p>
            <div className="lp-cta-btns" style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
              <a href="https://api.lijishwilson.in/muves/updates/muves-v0.1.0.apk" target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-primary" style={{ fontSize: 16 }}>🤖 Download Android</a>
              <Link to="/login" className="lp-btn lp-btn-surface" style={{ fontSize: 16 }}>🌐 Open Web App</Link>
            </div>
            <div style={{ marginTop: "1.5rem", position: "relative", zIndex: 1 }}>
              <Link to="/" className="lp-label-caps" style={{ color: "var(--lp-on-secondary-container)", opacity: 0.7, textDecoration: "none" }}>← Back to Home</Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
