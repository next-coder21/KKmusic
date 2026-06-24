import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { usePlayer } from "../../context/PlayerContext";
import { LyricsPanel } from "./Player";

const SLIDE = {
  hidden:  { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1,
    transition: { type: "spring", stiffness: 320, damping: 32, mass: 0.85 } },
  exit:    { x: "100%", opacity: 0,
    transition: { type: "spring", stiffness: 400, damping: 40 } },
};

const CONTENT = {
  enter:  { opacity: 0, y: 10 },
  center: { opacity: 1, y: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
  exit:   { opacity: 0, y: -6,
    transition: { duration: 0.15, ease: [0.55, 0, 1, 0.45] } },
};

function SidePanelQueue() {
  const { queue, currentIndex, setCurrentIndex, setCurrentTime: setGlobalTime } = usePlayer();

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px 24px" }} className="scrollbar-hide">
      {queue.length === 0 ? (
        <p style={{
          color: "rgba(255,255,255,0.18)", fontWeight: 700, textTransform: "uppercase",
          fontSize: 10, textAlign: "center", paddingTop: 48, letterSpacing: "0.1em", margin: 0,
        }}>
          Queue is empty
        </p>
      ) : queue.map((track, i) => (
        <motion.div
          key={`${track.id}-${i}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.025, duration: 0.2 }}
          onClick={() => { setGlobalTime(0); setCurrentIndex(i); }}
          className={`pp-queue-track${currentIndex === i ? " pp-queue-track--active" : ""}`}
          style={{
            display: "flex", gap: 10, padding: "9px 10px", borderRadius: 11,
            background: currentIndex === i ? "rgba(200,255,0,0.06)" : "transparent",
            border: `1px solid ${currentIndex === i ? "rgba(200,255,0,0.15)" : "transparent"}`,
            cursor: "pointer", marginBottom: 3,
            transition: "background 0.18s, border-color 0.18s",
          }}
        >
          <img
            src={track.cover_url} alt=""
            onError={e => { e.target.src = "/default-album.jpg"; }}
            style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
          />
          <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
            <p className={`pp-queue-title${currentIndex === i ? " pp-queue-title--active" : ""}`}
              style={{ fontWeight: 700, fontSize: 12, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: currentIndex === i ? "#C8FF00" : "#fff" }}>
              {track.title}
            </p>
            <p className="pp-queue-artist"
              style={{ fontWeight: 500, fontSize: 10, color: "rgba(255,255,255,0.38)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {track.artist_name}
            </p>
          </div>
          {currentIndex === i && (
            <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C8FF00", animation: "sp-pulse 1.2s ease-in-out infinite" }} />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export default function PlayerSidePanel() {
  const { sidePanel, setSidePanel, song, audioRef, setLocalTime, setCurrentTime: setGlobalTime, localTime } = usePlayer();

  const handleSeek = (t) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = t;
    setLocalTime(t);
    setGlobalTime(t);
  };

  return (
    <>
      <style>{`
        @keyframes sp-pulse {
          0%,100% { opacity:0.3; transform:scale(1); }
          50%      { opacity:1;   transform:scale(1.5); }
        }
      `}</style>

      <AnimatePresence mode="wait">
        {sidePanel !== null && (
          <motion.div
            key="side-panel"
            variants={SLIDE}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="player-side-panel"
            style={{
              width: "100%", height: "100%",
              background: "var(--bg-player, #09090f)",
              borderLeft: "1px solid var(--border, rgba(255,255,255,0.07))",
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px", flexShrink: 0 }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={sidePanel}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
                  exit={{ opacity: 0, y: 4, transition: { duration: 0.12 } }}
                  className="sp-label"
                  style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}
                >
                  {sidePanel === "lyrics" ? "LYRICS" : "QUEUE"}
                </motion.span>
              </AnimatePresence>
              <button
                className="sp-close"
                onClick={() => setSidePanel(null)}
                title="Close"
                style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center",
                  justifyContent: "center", width: 24, height: 24, borderRadius: 6,
                  transition: "color 0.15s, background 0.15s", padding: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.background = "transparent"; }}
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            <div className="sp-divider" style={{ height: 1, background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />

            {/* Content — cross-fades when switching lyrics ↔ queue */}
            <AnimatePresence mode="wait">
              {sidePanel === "lyrics" && (
                <motion.div
                  key="sp-lyrics"
                  variants={CONTENT}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}
                >
                  <LyricsPanel songId={song?.id} currentTime={localTime} onSeek={handleSeek} />
                </motion.div>
              )}

              {sidePanel === "queue" && (
                <motion.div
                  key="sp-queue"
                  variants={CONTENT}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  style={{ flex: 1, overflow: "hidden", minHeight: 0 }}
                >
                  <SidePanelQueue />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
