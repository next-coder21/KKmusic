import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat,
  Volume2, VolumeX, Heart, ListMusic, Loader2, X,
  ThumbsUp, ThumbsDown, AlignJustify, Mic2, ChevronDown, Music2, Maximize2, Minimize2, Share2
} from "lucide-react";
import { useUser }   from "../../context/UserContext";
import { usePlayer } from "../../context/PlayerContext";
import ApiService    from "../../services/ApiService";
import { API_CONFIG } from "../../config";
import toast         from "react-hot-toast";
import ShareModal    from "./ShareModal";

/* ── LRC PARSER ────────────────────────────────────────── */
function parseLRC(raw) {
  if (!raw || !raw.trim()) return null;
  const lines  = raw.split("\n");
  const parsed = [];
  const tagRe  = /\[(\d{1,2}):(\d{2})(?:[.:](\d+))?\]/g;
  for (const line of lines) {
    const tags = [];
    let match;
    tagRe.lastIndex = 0;
    while ((match = tagRe.exec(line)) !== null) {
      const mins  = parseInt(match[1]);
      const secs  = parseInt(match[2]);
      const frac  = match[3] ? parseFloat("0." + match[3]) : 0;
      tags.push(mins * 60 + secs + frac);
    }
    const text = line.replace(/\[.*?\]/g, "").trim();
    if (text && tags.length > 0) tags.forEach(t => parsed.push({ time: t, text }));
  }
  if (parsed.length > 0) {
    parsed.sort((a, b) => a.time - b.time);
    return { type: "lrc", lines: parsed };
  }
  const plainLines = raw.split("\n").map(l => l.trim()).filter(Boolean);
  return plainLines.length > 0 ? { type: "plain", lines: plainLines } : null;
}

/* ── LYRICS PANEL ───────────────────────────────────────── */
function LyricsPanel({ songId, currentTime, onSeek }) {
  const [lyrics, setLyrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef(null);
  const lineRefs = useRef([]);

  useEffect(() => {
    if (!songId) { setLyrics(null); return; }
    setLoading(true); setLyrics(null);
    axios.get(`${ApiService.getBaseUrl()}/music/songs/${songId}/lyrics`)
      .then(r => setLyrics(parseLRC(r.data.raw || "")))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [songId]);

  useEffect(() => {
    if (!lyrics || lyrics.type !== "lrc") return;
    let idx = -1;
    for (let i = 0; i < lyrics.lines.length; i++) {
        if (currentTime >= lyrics.lines[i].time) idx = i;
        else break;
    }
    setActiveIdx(idx);
  }, [currentTime, lyrics]);

  useEffect(() => {
    if (activeIdx < 0) return;
    const el = lineRefs.current[activeIdx];
    if (el && containerRef.current) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIdx]);

  useEffect(() => {
    if (activeIdx >= 0) {
      setTimeout(() => {
        const el = lineRefs.current[activeIdx];
        if (el && containerRef.current) {
          el.scrollIntoView({ behavior: "auto", block: "center" });
        }
      }, 100);
    }
  }, [lyrics]);

  if (loading) return <div style={{ padding: 40, color: "#CCFF00", fontWeight: 900 }}>LOADING...</div>;

  return (
    <div ref={containerRef} style={{ flex: 1, overflowY: "auto", padding: "0 30px" }} className="scrollbar-hide">
      <div style={{ height: "50vh" }} />
      {lyrics ? lyrics.lines.map((line, i) => (
        <p key={i} ref={el => lineRefs.current[i] = el}
          onClick={() => line.time !== undefined && onSeek && onSeek(line.time)}
          style={{
            fontSize: i === activeIdx ? "2.2rem" : "1.1rem",
            fontWeight: 900, textTransform: "uppercase",
            lineHeight: 1.1, marginBottom: 20, transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            color: i === activeIdx ? "#CCFF00" : "rgba(255,255,255,0.2)",
            textShadow: i === activeIdx ? "0 0 20px rgba(204,255,0,0.3)" : "none",
            cursor: "pointer"
          }}>
          {lyrics.type === "lrc" ? line.text : line}
        </p>
      )) : <p style={{ color: "rgba(255,255,255,0.2)", fontWeight: 900, textTransform: "uppercase", textAlign: "center", paddingTop: 40 }}>No lyrics found.</p>}
      <div style={{ height: "50vh" }} />
    </div>
  );
}

/* ── MAIN PLAYER ───────────────────────────────────────── */
export default function Player({ forceBar, onToggleDock, isMobileView }) {
  // ── Panel-only local UI state ─────────────────────────
  const [panelMode, setPanelMode] = useState("player");
  const [shareOpen,    setShareOpen]    = useState(false);
  const [sharedLyrics, setSharedLyrics] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── All audio state lives in context so bar↔panel is seamless ──
  const {
    audioRef,
    queue, setQueue,
    currentIndex, setCurrentIndex,
    isPlaying, setIsPlaying,
    userStarted, setUserStarted,
    currentTime: globalTime, setCurrentTime: setGlobalTime,
    duration, setDuration,
    isBuffering, setIsBuffering,
    bufferedProgress, setBufferedProgress,
    localTime, setLocalTime,
    localProgress, setLocalProgress,
    song, setSong,
    isShuffling, setIsShuffling,
    isLooping,   setIsLooping,
    queueUpdated, currentSongId,
  } = usePlayer();

  const { user } = useUser();

  const recordedPlay  = useRef(null);
  const lastSavedTime = useRef(-1);

  const fmt = (s) => {
    const v = Number.isFinite(s) ? Math.floor(s) : 0;
    return `${Math.floor(v/60)}:${(v%60).toString().padStart(2,"0")}`;
  };

  // ── Record play after 5 s ──────────────────────────────
  useEffect(() => {
    let timeout;
    if (isPlaying && song?.id && recordedPlay.current !== song.id) {
      timeout = setTimeout(async () => {
        try {
          await axios.post(`${API_CONFIG.MUSIC_URL}/record-play/${song.id}`, {}, { withCredentials: true });
          recordedPlay.current = song.id;
        } catch {}
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, song?.id]);

  // ── Load queue from server ─────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!user?.email) return;
      try {
        const res = await axios.get(`${ApiService.getBaseUrl()}/queue/${user.email}`);
        const ids = res.data.queue || [];
        const detailed = await Promise.all(ids.map(async id => {
          const r = await axios.get(`${ApiService.getBaseUrl()}/music/songs/${id}`);
          return { id, title: r.data.title, artist_name: r.data.artist_name, cover_url: r.data.cover_url || "/default-album.jpg", duration: r.data.duration_seconds || 180 };
        }));
        setQueue(detailed.filter(Boolean));
        if (currentSongId) {
          const idx = detailed.findIndex(s => s.id === currentSongId);
          if (idx !== -1) setCurrentIndex(idx);
        }
      } catch {}
    };
    load();
  }, [user?.email, queueUpdated, currentSongId]);

  // ── Switch song when index/queue changes ───────────────
  useEffect(() => {
    const s = queue[currentIndex];
    if (!s) { setSong(null); return; }
    setSong(s);
    setDuration(s.duration);

    const audio = audioRef.current;
    if (!audio) return;

    const streamSrc = `${API_CONFIG.STREAM_URL}/${s.id}`;
    if (audio.src !== streamSrc) {
      // New song — load and play from saved position (handles remount too)
      audio.src = streamSrc;
      audio.currentTime = globalTime > 0 ? globalTime : 0;
      // Only auto-play if the user explicitly clicked play in this browser tab
      if (isPlaying && userStarted) audio.play().catch(() => {});
    }
    // Same src (e.g., bar↔panel switch) — audio is already playing, leave it alone

    return () => { if (audioRef.current) setGlobalTime(audioRef.current.currentTime); };
  }, [currentIndex, queue]);

  // ── Audio event handlers (via refs so they're never stale) ──
  const handlerRefs = useRef({});

  // Define handlers (re-created each render with fresh closure values)
  const onTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    setLocalTime(t);
    if (duration > 0) setLocalProgress((t / duration) * 100);
    const roundedT = Math.floor(t);
    if (roundedT % 5 === 0 && roundedT !== lastSavedTime.current) {
      setGlobalTime(t);
      lastSavedTime.current = roundedT;
    }
    if (audio.buffered.length > 0 && duration > 0) {
      for (let i = 0; i < audio.buffered.length; i++) {
        if (audio.buffered.start(i) <= t && t <= audio.buffered.end(i)) {
          setBufferedProgress((audio.buffered.end(i) / duration) * 100);
          break;
        }
      }
    }
  };

  const handleSongEnd = async () => {
    if (!song) return;

    // Loop: restart current song
    if (isLooping) {
      const audio = audioRef.current;
      if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
      return;
    }

    const finishedSongId = song.id;
    const isLastInQueue  = queue.length === 1;

    if (user?.email) {
      try {
        await axios.post(`${ApiService.getBaseUrl()}/queue/remove`, { email: user.email, songId: finishedSongId });
      } catch {}
    }

    const newQueue = queue.filter(s => s.id !== finishedSongId);
    setQueue(newQueue);

    if (isLastInQueue) {
      setIsPlaying(false);
      setCurrentIndex(0);
      setGlobalTime(0);
      if (audioRef.current) audioRef.current.pause();
    } else {
      let nextIdx = currentIndex;
      if (nextIdx >= newQueue.length) nextIdx = 0;
      setCurrentIndex(nextIdx);
      setGlobalTime(0);
    }
  };

  const onCanPlay  = () => { setIsBuffering(false); if (isPlaying && userStarted) audioRef.current?.play().catch(() => {}); };
  const onWaiting  = () => setIsBuffering(true);
  const onPlaying  = () => { setIsBuffering(false); setIsPlaying(true); };
  const onProgress = () => {
    const audio = audioRef.current;
    if (!audio || !audio.buffered.length || !duration) return;
    for (let i = 0; i < audio.buffered.length; i++) {
      if (audio.buffered.start(i) <= audio.currentTime && audio.currentTime <= audio.buffered.end(i)) {
        setBufferedProgress((audio.buffered.end(i) / duration) * 100);
        break;
      }
    }
  };

  // Always keep refs pointing to latest handlers
  handlerRefs.current = { onTimeUpdate, handleSongEnd, onCanPlay, onWaiting, onPlaying, onProgress };

  // Stable wrappers created once — these are what we actually attach to the DOM
  const stableHandlers = useRef(null);
  if (!stableHandlers.current) {
    stableHandlers.current = {
      onTimeUpdate: (...a) => handlerRefs.current.onTimeUpdate(...a),
      handleSongEnd: (...a) => handlerRefs.current.handleSongEnd(...a),
      onCanPlay:    (...a) => handlerRefs.current.onCanPlay(...a),
      onWaiting:    (...a) => handlerRefs.current.onWaiting(...a),
      onPlaying:    (...a) => handlerRefs.current.onPlaying(...a),
      onProgress:   (...a) => handlerRefs.current.onProgress(...a),
    };
  }

  // Attach event listeners when this Player mounts, detach when it unmounts
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const { onTimeUpdate, handleSongEnd, onCanPlay, onWaiting, onPlaying, onProgress } = stableHandlers.current;
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended",      handleSongEnd);
    audio.addEventListener("canplay",    onCanPlay);
    audio.addEventListener("waiting",    onWaiting);
    audio.addEventListener("playing",    onPlaying);
    audio.addEventListener("progress",   onProgress);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended",      handleSongEnd);
      audio.removeEventListener("canplay",    onCanPlay);
      audio.removeEventListener("waiting",    onWaiting);
      audio.removeEventListener("playing",    onPlaying);
      audio.removeEventListener("progress",   onProgress);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Controls ───────────────────────────────────────────
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); setGlobalTime(audio.currentTime); }
    else { audio.play().then(() => { setIsPlaying(true); setUserStarted(true); }).catch(() => {}); }
  };

  const skip = async (dir) => {
    if (!queue.length) return;

    // Skip forward: consume current song from queue (same as song ending)
    if (dir === 1 && song) {
      const skippedId  = song.id;
      const isLast     = queue.length === 1;

      if (user?.email) {
        try { await axios.post(`${ApiService.getBaseUrl()}/queue/remove`, { email: user.email, songId: skippedId }); } catch {}
      }

      const newQueue = queue.filter(s => s.id !== skippedId);
      setQueue(newQueue);

      if (isLast) {
        setIsPlaying(false); setCurrentIndex(0); setGlobalTime(0);
        if (audioRef.current) audioRef.current.pause();
      } else {
        let nextIdx = currentIndex;
        if (isShuffling && newQueue.length > 1) {
          do { nextIdx = Math.floor(Math.random() * newQueue.length); }
          while (nextIdx === currentIndex);
        }
        if (nextIdx >= newQueue.length) nextIdx = 0;
        setCurrentIndex(nextIdx);
        setGlobalTime(0);
      }
      return;
    }

    // Skip backward: just move, no removal
    const nextIdx = (currentIndex + dir + queue.length) % queue.length;
    setCurrentIndex(nextIdx);
    setGlobalTime(0);
  };

  const seekToTime = (t) => {
    const audio = audioRef.current;
    if (audio && duration > 0) {
      audio.currentTime = t;
      setLocalTime(t);
      setLocalProgress((t / duration) * 100);
      setGlobalTime(t);
    }
  };

  const seek = (e) => {
    const p = parseFloat(e.target.value);
    seekToTime((p / 100) * duration);
  };

  const handleShareClick = async () => {
    if (!song) return;
    try {
      const res = await axios.get(`${ApiService.getBaseUrl()}/music/songs/${song.id}/lyrics`);
      setSharedLyrics(parseLRC(res.data.raw || ""));
    } catch { setSharedLyrics(null); }
    setShareOpen(true);
  };

  // ── Sub-components ─────────────────────────────────────
  const ProgressBar = ({ height = 5 }) => (
    <div style={{ position: "relative", height, background: "rgba(255,255,255,0.1)", cursor: "pointer" }}>
      <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${bufferedProgress}%`, background: "rgba(255,255,255,0.15)", transition: "width 0.5s linear" }} />
      <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${localProgress}%`, background: "#CCFF00", transition: "width 0.1s" }} />
      {isBuffering && (
        <div style={{ position: "absolute", top: "50%", left: `${localProgress}%`, transform: "translate(-50%, -50%)", width: 10, height: 10, borderRadius: "50%", background: "rgba(204,255,0,0.4)", animation: "pulse-dot 1s infinite" }} />
      )}
      <input type="range" min="0" max="100" value={localProgress} onChange={seek}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
      />
    </div>
  );

  const Ctrl = ({ icon: Icon, onClick, active, size = 20 }) => (
    <button onClick={onClick} style={{ background: "transparent", border: "none", cursor: "pointer", color: active ? "#CCFF00" : "#fff", opacity: active ? 1 : 0.4, transition: "0.2s" }}>
      <Icon size={size} strokeWidth={active ? 3 : 2} />
    </button>
  );

  const TransportControls = ({ mode = "full" }) => (
    <div style={{ padding: mode === "lyrics" ? "20px 30px 40px" : "0", borderTop: mode === "lyrics" ? "1px solid rgba(255,255,255,0.1)" : "none", background: "#000" }}>
      <div style={{ marginBottom: 24 }}>
        <ProgressBar height={5} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, fontWeight: 900, opacity: 0.3 }}>
          <span>{fmt(localTime)}</span><span>{fmt(duration)}</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Ctrl icon={Shuffle} active={isShuffling} onClick={() => setIsShuffling(!isShuffling)} />
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Ctrl icon={SkipBack} onClick={() => skip(-1)} size={22} />
          <button onClick={togglePlay} style={{ width: 56, height: 56, background: "#CCFF00", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isBuffering
              ? <Loader2 size={26} color="#000" style={{ animation: "spin 0.8s linear infinite" }} />
              : isPlaying
                ? <Pause size={28} color="#000" fill="#000" />
                : <Play  size={28} color="#000" fill="#000" style={{ marginLeft: 3 }} />
            }
          </button>
          <Ctrl icon={SkipForward} onClick={() => skip(1)} size={22} />
        </div>
        <Ctrl icon={Repeat} active={isLooping} onClick={() => setIsLooping(!isLooping)} />
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#000", color: "#fff" }}>
      <style>{`
        @keyframes pulse-dot {
          0%,100% { opacity:0.3; transform:translate(-50%,-50%) scale(1); }
          50% { opacity:1; transform:translate(-50%,-50%) scale(1.5); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        song={song}
        lyrics={sharedLyrics}
        currentTime={localTime}
      />

      {/* ── PANEL MODE ── */}
      {!forceBar && (
        <div className="player-panel-view" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 30px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", gap: 24 }}>
              {["player", "queue", "lyrics"].map(m => (
                <button key={m} onClick={() => setPanelMode(m)} style={{ background: "transparent", border: "none", color: panelMode === m ? "#CCFF00" : "#fff", fontWeight: 900, textTransform: "uppercase", fontSize: 12, cursor: "pointer", letterSpacing: "0.1em" }}>{m}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <button onClick={handleShareClick} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }} title="Share Lyrics"><Share2 size={16} strokeWidth={3} /></button>
              {isMobileView ? (
                <button onClick={onToggleDock} style={{ background: "transparent", border: "none", color: "#CCFF00", cursor: "pointer" }} title="Collapse">
                  <ChevronDown size={24} strokeWidth={3} />
                </button>
              ) : (
                <button onClick={onToggleDock} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }} title="Dock to Bottom"><Minimize2 size={16} strokeWidth={3} /></button>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }} className="scrollbar-hide">
            {panelMode === "player" && (
              <div style={{ padding: "30px", flex: 1, display: "flex", flexDirection: "column" }}>
                {song ? (
                  <>
                    <div style={{ width: "100%", aspectRatio: "1", border: "3px solid #CCFF00", marginBottom: 30, overflow: "hidden", flexShrink: 0, background: "#111" }}>
                      <img src={song.cover_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                    </div>
                    <h2 style={{ fontSize: "1.8rem", fontWeight: 900, textTransform: "uppercase", lineHeight: 0.95, letterSpacing: "-0.04em", margin: "0 0 10px", overflow: "hidden", whiteSpace: "nowrap" }}>{song.title}</h2>
                    <p style={{ color: "#CCFF00", fontWeight: 900, textTransform: "uppercase", fontSize: 13, margin: "0 0 40px" }}>{song.artist_name}</p>
                    <TransportControls />
                  </>
                ) : <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textTransform: "uppercase", fontWeight: 900, fontSize: 11, opacity: 0.2 }}>SELECT A TRACK</div>}
              </div>
            )}

            {panelMode === "queue" && (
              <div style={{ padding: "24px 30px" }}>
                {queue.map((track, i) => (
                  <div key={i} onClick={() => setCurrentIndex(i)} style={{ display: "flex", gap: 14, padding: "12px", border: currentIndex === i ? "2px solid #CCFF00" : "2px solid transparent", background: currentIndex === i ? "rgba(204,255,0,0.05)" : "transparent", cursor: "pointer", marginBottom: 6 }}>
                    <img src={track.cover_url} style={{ width: 44, height: 44, border: "1px solid rgba(255,255,255,0.1)" }} alt="" />
                    <div style={{ overflow: "hidden" }}>
                      <p style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 11, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</p>
                      <p style={{ fontWeight: 700, fontSize: 10, color: "#CCFF00", textTransform: "uppercase", marginTop: 2 }}>{track.artist_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {panelMode === "lyrics" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
                <LyricsPanel songId={song?.id} currentTime={localTime} onSeek={seekToTime} />
                <TransportControls mode="lyrics" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BAR MODE ── */}
      {forceBar && (
        <div style={{ padding: isMobile ? "10px 12px" : "12px 40px", background: "#000", display: "flex", alignItems: "center", gap: isMobile ? 8 : 0, minHeight: 80, width: "100%", overflow: "hidden" }}>
          {song ? (
            <>
              {/* Info */}
              <div
                onClick={() => isMobile && onToggleDock()}
                style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 20, flex: "0 1 auto", overflow: "hidden", maxWidth: isMobile ? "35%" : "30%", cursor: isMobile ? "pointer" : "default" }}
              >
                <img src={song.cover_url} style={{ width: isMobile ? 40 : 56, height: isMobile ? 40 : 56, border: "2px solid #CCFF00", flexShrink: 0 }} alt="" />
                {!isMobile && (
                  <div style={{ overflow: "hidden" }}>
                    <p style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 15, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>{song.title}</p>
                    <p style={{ fontWeight: 900, color: "#CCFF00", fontSize: 11, textTransform: "uppercase", margin: 0 }}>{song.artist_name}</p>
                  </div>
                )}
              </div>

              {/* Transport */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: isMobile ? "0 8px" : "0 40px" }}>
                <div style={{ display: "flex", justifyContent: "center", gap: isMobile ? 16 : 40, alignItems: "center", marginBottom: 6 }}>
                  {!isMobile && <Ctrl icon={Shuffle} active={isShuffling} size={16} onClick={() => setIsShuffling(!isShuffling)} />}
                  <Ctrl icon={SkipBack} onClick={() => skip(-1)} size={isMobile ? 16 : 18} />
                  <button onClick={togglePlay} style={{ width: isMobile ? 38 : 48, height: isMobile ? 38 : 48, background: "#CCFF00", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                    {isBuffering
                      ? <Loader2 size={16} color="#000" style={{ animation: "spin 0.8s linear infinite" }} />
                      : isPlaying
                        ? <Pause size={isMobile ? 18 : 22} color="#000" fill="#000" />
                        : <Play  size={isMobile ? 18 : 22} color="#000" fill="#000" style={{ marginLeft: 2 }} />
                    }
                  </button>
                  <Ctrl icon={SkipForward} onClick={() => skip(1)} size={isMobile ? 16 : 18} />
                  {!isMobile && <Ctrl icon={Repeat} active={isLooping} size={16} onClick={() => setIsLooping(!isLooping)} />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, opacity: 0.3, flexShrink: 0 }}>{fmt(localTime)}</span>
                  <div style={{ flex: 1 }}><ProgressBar height={3} /></div>
                  <span style={{ fontSize: 9, fontWeight: 900, opacity: 0.3, flexShrink: 0 }}>{fmt(duration)}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: isMobile ? 10 : 20, alignItems: "center", flexShrink: 0 }}>
                <button onClick={handleShareClick} style={{ background: "transparent", border: "none", color: "#CCFF00", cursor: "pointer", padding: 4 }} title="Share">
                  <Share2 size={isMobile ? 16 : 18} strokeWidth={3} />
                </button>
                <button
                  onClick={() => { setPanelMode("lyrics"); onToggleDock(); }}
                  style={{ background: "transparent", border: "none", color: panelMode === "lyrics" ? "#CCFF00" : "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4 }}
                  title="Lyrics"
                >
                  <Mic2 size={isMobile ? 16 : 18} strokeWidth={3} />
                </button>
                <Ctrl
                  icon={ListMusic}
                  size={isMobile ? 16 : 20}
                  active={panelMode === "queue"}
                  onClick={() => { setPanelMode("queue"); onToggleDock(); }}
                />
              </div>
            </>
          ) : <p style={{ flex: 1, fontSize: 10, fontWeight: 900, textAlign: "center", opacity: 0.2 }}>CHANNELS_IDLE</p>}
        </div>
      )}
    </div>
  );
}
