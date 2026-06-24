import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import http from "../../services/http";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat,
  Heart, ListMusic, Loader2, AlertCircle,
  Mic2, MicOff, ChevronDown, Maximize2, Minimize2, Share2, PlusCircle,
  Volume2
} from "lucide-react";
import { FiThumbsUp, FiThumbsDown } from "react-icons/fi";
import { useUser }   from "../../context/UserContext";
import { usePlayer } from "../../context/PlayerContext";
import AlbumArt     from "../common/AlbumArt";
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
// Exported so PlayerSidePanel can import it directly.
export function LyricsPanel({ songId, currentTime, onSeek, onLyricsAvailable }) {
  const [lyrics, setLyrics]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef(null);
  const lineRefs     = useRef([]);

  useEffect(() => {
    if (!songId) { setLyrics(null); onLyricsAvailable?.(false); return; }
    lineRefs.current = [];
    setActiveIdx(-1);
    setLoading(true);
    setLyrics(null);
    let cancelled = false;
    http.get(`/auth/music/songs/${songId}/lyrics`)
      .then(r => {
        if (cancelled) return;
        const parsed = parseLRC(r.data?.raw || "");
        setLyrics(parsed);
        onLyricsAvailable?.(!!parsed);
      })
      .catch(() => { if (!cancelled) { setLyrics(null); onLyricsAvailable?.(false); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [songId]);

  // Sync active line with playback position
  useEffect(() => {
    if (!lyrics || lyrics.type !== "lrc") return;
    let idx = -1;
    for (let i = 0; i < lyrics.lines.length; i++) {
      if (currentTime >= lyrics.lines[i].time) idx = i;
      else break;
    }
    setActiveIdx(idx);
  }, [currentTime, lyrics]);

  // Auto-scroll to active line (smooth during playback)
  useEffect(() => {
    if (activeIdx < 0) return;
    const el = lineRefs.current[activeIdx];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIdx]);

  // Jump to active line immediately when lyrics first load (no smooth)
  useEffect(() => {
    if (activeIdx < 0) return;
    const el = lineRefs.current[activeIdx];
    if (el) el.scrollIntoView({ behavior: "auto", block: "center" });
  }, [lyrics]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          height: "16px",
          borderRadius: "8px",
          background: "rgba(255,255,255,0.07)",
          width: `${60 + (i % 3) * 15}%`,
          animation: "shimmer 1.5s infinite"
        }} />
      ))}
      <style>{`@keyframes shimmer { 0%,100% { opacity:.4 } 50% { opacity:.9 } }`}</style>
    </div>
  );

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, overflowY: "auto", padding: "0 30px" }}
      className="scrollbar-hide"
    >
      <div style={{ height: "140px" }} />
      {lyrics
        ? lyrics.lines.map((line, i) => (
            <p
              key={i}
              ref={el => { lineRefs.current[i] = el; }}
              onClick={() => line.time !== undefined && onSeek?.(line.time)}
              className={`lyrics-line${i === activeIdx ? " lyrics-line--active" : ""}`}
              style={{
                fontFamily: "'Edu NSW ACT Foundation', cursive",
                fontSize: i === activeIdx ? "2rem" : "1.05rem",
                fontWeight: i === activeIdx ? 700 : 400,
                lineHeight: 1.3, marginBottom: 18,
                transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                color: i === activeIdx ? "#C8FF00" : "rgba(255,255,255,0.22)",
                textShadow: i === activeIdx ? "0 0 24px rgba(204,255,0,0.28)" : "none",
                cursor: "pointer",
              }}
            >
              {lyrics.type === "lrc" ? line.text : line}
            </p>
          ))
        : (
          <p style={{ color: "rgba(255,255,255,0.2)", fontWeight: 900, textTransform: "uppercase", textAlign: "center", paddingTop: 40 }}>
            No lyrics found.
          </p>
        )
      }
      <div style={{ height: "140px" }} />
    </div>
  );
}

// Module-level song cache: avoids re-fetching details for songs already loaded this session
const songCache = new Map();

/* ── RATING WIDGET ─────────────────────────────────────────── */
/**
 * currentRating: 1 (thumbs-up), -1 (thumbs-down), or null
 * onRate(value): called with 1, -1, or null (toggling off)
 */
export function RatingWidget({ currentRating, onRate, size = 16 }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center", flexShrink: 0 }}>
      <button
        onClick={() => onRate?.(currentRating === 1 ? null : 1)}
        title="Thumbs up"
        aria-label={currentRating === 1 ? "Remove thumbs up" : "Thumbs up"}
        aria-pressed={currentRating === 1}
        className="rating-btn rating-btn--up"
        style={{
          background: currentRating === 1 ? "rgba(200,255,0,0.15)" : "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 5px",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          color: currentRating === 1 ? "#C8FF00" : "#aaa",
          transition: "background 0.18s, color 0.18s",
        }}
      >
        <FiThumbsUp size={size} strokeWidth={currentRating === 1 ? 2.5 : 1.8} />
      </button>
      <button
        onClick={() => onRate?.(currentRating === -1 ? null : -1)}
        title="Thumbs down"
        aria-label={currentRating === -1 ? "Remove thumbs down" : "Thumbs down"}
        aria-pressed={currentRating === -1}
        className="rating-btn rating-btn--down"
        style={{
          background: currentRating === -1 ? "rgba(239,68,68,0.12)" : "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 5px",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          color: currentRating === -1 ? "#ef4444" : "#aaa",
          transition: "background 0.18s, color 0.18s",
        }}
      >
        <FiThumbsDown size={size} strokeWidth={currentRating === -1 ? 2.5 : 1.8} />
      </button>
    </div>
  );
}

/* ── MAIN PLAYER ───────────────────────────────────────── */
export default function Player({ forceBar, onToggleDock, isMobileView }) {
  const [panelMode, setPanelMode] = useState("player");
  const [shareOpen,    setShareOpen]    = useState(false);
  const [sharedLyrics, setSharedLyrics] = useState(null);
  const [audioError,   setAudioError]   = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
    favoritesUpdated, setFavoritesUpdated,
    setAddToPlaylistSong,
    sidePanel, setSidePanel,
  } = usePlayer();

  const { user } = useUser();
  const recordedPlay  = useRef(null);
  const lastSavedTime = useRef(-1);

  // ── Favourite state ────────────────────────────────────
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // ── Rating state ───────────────────────────────────────
  const [currentRating, setCurrentRating] = useState(null);

  // Reset rating when song changes
  useEffect(() => { setCurrentRating(null); }, [song?.id]);

  useEffect(() => {
    document.title = song?.title ? `${song.title} • Muves` : "Muve\u{1D11E} - Streaming app";
  }, [song?.title]);

  const handleRate = (value) => {
    if (!song?.id) return;
    const previous = currentRating;
    setCurrentRating(value);
    http.post(`/auth/music/songs/${song.id}/rate`, { rating: value }).catch(() => {
      setCurrentRating(previous);
    });
  };

  // ── Volume ─────────────────────────────────────────────
  const [volume, setVolume] = useState(1);
  const handleVolume = (val) => {
    const v = Math.max(0, Math.min(1, val));
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  // ── Lyrics availability — derived from LyricsPanel fetch, no extra request ──
  const [hasLyrics, setHasLyrics] = useState(false);

  // Cache the favourites ID set; re-fetch only when favoritesUpdated toggles (not on every song skip)
  const favSetRef = useRef(new Set());
  useEffect(() => {
    if (!user) { favSetRef.current = new Set(); setIsFav(false); return; }
    let cancelled = false;
    http.get("/auth/favourites")
      .then(r => {
        if (cancelled) return;
        favSetRef.current = new Set(r.data.favourites || []);
        setIsFav(favSetRef.current.has(song?.id));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, favoritesUpdated]); // only re-fetch when favourites list actually changes

  // Derive isFav from cache when song changes — no network request
  useEffect(() => {
    setIsFav(favSetRef.current.has(song?.id));
  }, [song?.id]);

  const toggleFav = async () => {
    if (!song?.id || !user || favLoading) return;
    setFavLoading(true);
    const next = !isFav;
    setIsFav(next);
    try {
      await http.post(next ? "/auth/favourites/add" : "/auth/favourites/remove", { songIds: [song.id] });
      setFavoritesUpdated(p => !p);
    } catch {
      setIsFav(!next);
    } finally {
      setFavLoading(false);
    }
  };

  const fmt = (s) => {
    const v = Number.isFinite(s) ? Math.floor(s) : 0;
    return `${Math.floor(v / 60)}:${(v % 60).toString().padStart(2, "0")}`;
  };

  // ── Record play after 5 s ──────────────────────────────
  useEffect(() => {
    let timeout;
    if (isPlaying && song?.id && recordedPlay.current !== song.id) {
      timeout = setTimeout(async () => {
        try {
          // Use http (not raw axios) so the Bearer token and 401 interceptor apply
          await http.post(`/auth/music/record-play/${song.id}`, {});
          recordedPlay.current = song.id;
        } catch {}
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, song?.id]);

  // ── Load queue from server ─────────────────────────────
  useEffect(() => {
    if (!user?.email) return;
    const controller = new AbortController();

    const load = async () => {
      try {
        const res = await http.get("/auth/queue", { signal: controller.signal });
        const ids = res.data.queue || [];

        // Fetch only songs not already in our cache (avoids re-fetching the same song)
        const uncached = ids.filter(id => !songCache.has(id));
        if (uncached.length > 0) {
          await Promise.all(
            uncached.map(async id => {
              try {
                const r = await http.get(
                  `/auth/music/songs/${id}`,
                  { signal: controller.signal }
                );
                songCache.set(id, {
                  id,
                  title: r.data.title,
                  artist_name: r.data.artist_name,
                  cover_url: r.data.cover_url || "/default-album.jpg",
                  duration: r.data.duration_seconds || 0,
                });
              } catch { /* skip bad IDs */ }
            })
          );
        }

        const valid = ids.map(id => songCache.get(id)).filter(Boolean);
        setQueue(valid);
        // Restore index for the current song after a queue reload
        if (currentSongId) {
          const idx = valid.findIndex(s => s.id === currentSongId);
          if (idx !== -1) setCurrentIndex(idx);
        }
      } catch (e) {
        // Ignore abort errors
        if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
      }
    };

    load();
    return () => controller.abort();
  // currentSongId intentionally excluded: it changing doesn't require a full
  // queue reload. It's read inside the effect to sync the index after load.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, queueUpdated]);

  // ── Switch song when index/queue changes ───────────────
  useEffect(() => {
    const s = queue[currentIndex];
    // Don't null out song while waiting for a currentSongId to load into queue
    if (!s) { if (!currentSongId) setSong(null); return; }

    setSong(s);
    // Set duration from DB as initial estimate; loadedmetadata will correct it
    setDuration(s.duration || 0);
    // Reset UI state for the new track
    setLocalTime(0);
    setLocalProgress(0);
    setBufferedProgress(0);
    setAudioError(false);
    lastSavedTime.current = -1;

    // Don't set audio source until the user has explicitly started playback;
    // avoids preloading when the queue restores from a previous session.
    if (!userStarted) return;

    const audio = audioRef.current;
    if (!audio) return;

    const streamSrc = `${API_CONFIG.STREAM_URL}/${s.id}`;
    if (audio.src !== streamSrc) {
      setIsBuffering(true); // only set when src actually changes; canplay will clear it
      audio.src = streamSrc;
      // Restore saved position only on remount (globalTime > 0 means we were
      // mid-song when bar↔panel toggled). For fresh song switches, globalTime
      // is always 0 because skip/handleSongEnd reset it.
      audio.currentTime = globalTime > 0 ? globalTime : 0;
      if (isPlaying) audio.play().catch(() => {});
    }

    return () => {
      if (audioRef.current) setGlobalTime(audioRef.current.currentTime);
    };
  }, [currentIndex, queue]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fast-path: show player + start audio immediately when currentSongId set ─
  useEffect(() => {
    if (!currentSongId) return;
    if (song?.id === currentSongId) return;

    const startPlayback = (s) => {
      setSong(s);
      setDuration(s.duration || 0);
      setLocalTime(0);
      setLocalProgress(0);
      setBufferedProgress(0);
      setAudioError(false);
      const audio = audioRef.current;
      if (!audio) return;
      const streamSrc = `${API_CONFIG.STREAM_URL}/${s.id}`;
      if (audio.src !== streamSrc) {
        setIsBuffering(true);
        audio.src = streamSrc;
        audio.currentTime = 0;
      }
      audio.play().catch(() => {});
    };

    // Already in queue — use it instantly
    const inQueue = queue.find(s => s.id === currentSongId);
    if (inQueue) { startPlayback(inQueue); return; }

    // Not yet in queue — fetch details then start
    let cancelled = false;
    http.get(`/auth/music/songs/${currentSongId}`)
      .then(r => {
        if (cancelled) return;
        const s = {
          id: currentSongId,
          title: r.data.title,
          artist_name: r.data.artist_name,
          cover_url: r.data.cover_url || null,
          duration: r.data.duration_seconds || 0,
        };
        songCache.set(currentSongId, s);
        startPlayback(s);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [currentSongId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Audio event handlers (via refs so they're never stale) ──
  const handlerRefs = useRef({});

  const onTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    const dur = audio.duration || duration;
    setLocalTime(t);
    if (dur > 0) setLocalProgress((t / dur) * 100);

    // Save position every 5 s for remount restoration
    const rounded = Math.floor(t);
    if (rounded % 5 === 0 && rounded !== lastSavedTime.current) {
      setGlobalTime(t);
      lastSavedTime.current = rounded;
    }

    // Update buffered progress
    if (audio.buffered.length > 0 && dur > 0) {
      for (let i = 0; i < audio.buffered.length; i++) {
        if (audio.buffered.start(i) <= t && t <= audio.buffered.end(i)) {
          setBufferedProgress((audio.buffered.end(i) / dur) * 100);
          break;
        }
      }
    }
  };

  const onLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    // Use actual audio duration from file rather than DB estimate
    if (audio.duration && isFinite(audio.duration)) {
      setDuration(audio.duration);
    }
  };

  const handleSongEnd = async () => {
    if (!song) return;

    if (isLooping) {
      const audio = audioRef.current;
      if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
      return;
    }

    const finishedSongId = song.id;
    const isLastInQueue  = queue.length === 1;

    if (user?.email) {
      try { await http.post("/auth/queue/remove", { songId: finishedSongId }); } catch {}
    }

    const newQueue = queue.filter(s => s.id !== finishedSongId);
    setQueue(newQueue);
    setGlobalTime(0);

    if (isLastInQueue) {
      setIsPlaying(false);
      setCurrentIndex(0);
      setLocalTime(0);
      setLocalProgress(0);
      if (audioRef.current) audioRef.current.pause();
      return;
    }

    let nextIdx = currentIndex;
    // Apply shuffle when song ends naturally (same logic as skip forward)
    if (isShuffling && newQueue.length > 1) {
      do { nextIdx = Math.floor(Math.random() * newQueue.length); }
      while (nextIdx === currentIndex);
    }
    if (nextIdx >= newQueue.length) nextIdx = 0;
    setCurrentIndex(nextIdx);
  };

  const onCanPlay = () => {
    setIsBuffering(false);
    setAudioError(false);
    if (isPlaying && userStarted) audioRef.current?.play().catch(() => {});
  };

  const onWaiting  = () => setIsBuffering(true);
  const onPlaying  = () => { setIsBuffering(false); setIsPlaying(true); };

  const onProgress = () => {
    const audio = audioRef.current;
    const dur = audio?.duration || duration;
    if (!audio || !audio.buffered.length || !dur) return;
    for (let i = 0; i < audio.buffered.length; i++) {
      if (audio.buffered.start(i) <= audio.currentTime && audio.currentTime <= audio.buffered.end(i)) {
        setBufferedProgress((audio.buffered.end(i) / dur) * 100);
        break;
      }
    }
  };

  const onError = () => {
    setIsBuffering(false);
    setIsPlaying(false);
    setAudioError(true);
    toast.error("Failed to load audio. Check your connection.");
  };

  // Always keep refs pointing to latest handlers
  handlerRefs.current = {
    onTimeUpdate, onLoadedMetadata, handleSongEnd,
    onCanPlay, onWaiting, onPlaying, onProgress, onError,
  };

  // Stable wrappers created once — attached to the DOM once, never replaced
  const stableHandlers = useRef(null);
  if (!stableHandlers.current) {
    stableHandlers.current = Object.fromEntries(
      ["onTimeUpdate","onLoadedMetadata","handleSongEnd","onCanPlay","onWaiting","onPlaying","onProgress","onError"]
        .map(name => [name, (...a) => handlerRefs.current[name](...a)])
    );
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const h = stableHandlers.current;
    audio.addEventListener("timeupdate",     h.onTimeUpdate);
    audio.addEventListener("loadedmetadata", h.onLoadedMetadata);
    audio.addEventListener("ended",          h.handleSongEnd);
    audio.addEventListener("canplay",        h.onCanPlay);
    audio.addEventListener("waiting",        h.onWaiting);
    audio.addEventListener("playing",        h.onPlaying);
    audio.addEventListener("progress",       h.onProgress);
    audio.addEventListener("error",          h.onError);
    return () => {
      audio.removeEventListener("timeupdate",     h.onTimeUpdate);
      audio.removeEventListener("loadedmetadata", h.onLoadedMetadata);
      audio.removeEventListener("ended",          h.handleSongEnd);
      audio.removeEventListener("canplay",        h.onCanPlay);
      audio.removeEventListener("waiting",        h.onWaiting);
      audio.removeEventListener("playing",        h.onPlaying);
      audio.removeEventListener("progress",       h.onProgress);
      audio.removeEventListener("error",          h.onError);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Controls ───────────────────────────────────────────
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !song) return;
    if (audioError) {
      // Retry: reload the src
      setAudioError(false);
      setIsBuffering(true);
      audio.load();
      audio.play().then(() => { setIsPlaying(true); setUserStarted(true); }).catch(() => {});
      return;
    }
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setGlobalTime(audio.currentTime);
    } else {
      audio.play()
        .then(() => { setIsPlaying(true); setUserStarted(true); })
        .catch(() => {});
    }
  };

  const skip = async (dir) => {
    if (!queue.length) return;

    if (dir === 1 && song) {
      const skippedId = song.id;
      const isLast    = queue.length === 1;

      if (user?.email) {
        try { await http.post("/auth/queue/remove", { songId: skippedId }); } catch {}
      }

      const newQueue = queue.filter(s => s.id !== skippedId);
      setQueue(newQueue);
      setGlobalTime(0);

      if (isLast) {
        setIsPlaying(false); setCurrentIndex(0);
        if (audioRef.current) audioRef.current.pause();
        return;
      }

      let nextIdx = currentIndex;
      if (isShuffling && newQueue.length > 1) {
        do { nextIdx = Math.floor(Math.random() * newQueue.length); }
        while (nextIdx === currentIndex);
      }
      if (nextIdx >= newQueue.length) nextIdx = 0;
      setCurrentIndex(nextIdx);
      return;
    }

    // Skip backward: move index, no removal
    setGlobalTime(0);
    setCurrentIndex((currentIndex + dir + queue.length) % queue.length);
  };

  const seekToTime = (t) => {
    const audio = audioRef.current;
    const dur = audio?.duration || duration;
    if (!audio || !dur) return;
    const clamped = Math.max(0, Math.min(t, dur));
    audio.currentTime = clamped;
    setLocalTime(clamped);
    setLocalProgress((clamped / dur) * 100);
    setGlobalTime(clamped);
  };

  const seek = (e) => {
    seekToTime((parseFloat(e.target.value) / 100) * (audioRef.current?.duration || duration));
  };

  const handleShareClick = async () => {
    if (!song) return;
    try {
      const res = await http.get(`/auth/music/songs/${song.id}/lyrics`);
      setSharedLyrics(parseLRC(res.data?.raw || ""));
    } catch { setSharedLyrics(null); }
    setShareOpen(true);
  };

  // ── Sub-components ─────────────────────────────────────
  const ProgressBar = ({ height = 5 }) => (
    <div style={{ position: "relative", height, background: "rgba(255,255,255,0.1)", cursor: "pointer" }}>
      <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${bufferedProgress}%`, background: "rgba(255,255,255,0.15)", transition: "width 0.5s linear" }} />
      <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${localProgress}%`, background: "#C8FF00", transition: "width 0.1s" }} />
      {isBuffering && (
        <div style={{ position: "absolute", top: "50%", left: `${localProgress}%`, transform: "translate(-50%,-50%)", width: 10, height: 10, borderRadius: "50%", background: "rgba(204,255,0,0.4)", animation: "pulse-dot 1s infinite" }} />
      )}
      <input
        type="range" min="0" max="100" value={localProgress}
        onChange={seek}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
      />
    </div>
  );

  const Ctrl = ({ icon: Icon, onClick, active, size = 20 }) => (
    <button
      onClick={onClick}
      style={{ background: "transparent", border: "none", cursor: "pointer", color: active ? "#C8FF00" : "#fff", opacity: active ? 1 : 0.4, transition: "0.2s" }}
    >
      <Icon size={size} strokeWidth={active ? 3 : 2} />
    </button>
  );

  const PlayPauseButton = ({ size = 56, iconSize = 28 }) => (
    <button
      onClick={togglePlay}
      style={{ width: size, height: size, background: audioError ? "rgba(255,80,80,0.9)" : "#C8FF00", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      title={audioError ? "Retry" : isPlaying ? "Pause" : "Play"}
    >
      {audioError
        ? <AlertCircle size={iconSize - 2} color="#fff" />
        : isBuffering
          ? <Loader2 size={iconSize - 2} color="#000" style={{ animation: "spin 0.8s linear infinite" }} />
          : isPlaying
            ? <Pause size={iconSize} color="#000" fill="#000" />
            : <Play  size={iconSize} color="#000" fill="#000" style={{ marginLeft: 3 }} />
      }
    </button>
  );

  const TransportControls = ({ mode = "full" }) => (
    <div className="pp-transport" style={{ padding: "16px 20px 24px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "var(--bg-player, #0d0d18)" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ position: "relative", height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, cursor: "pointer", marginBottom: 6 }}>
          <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${bufferedProgress}%`, background: "rgba(255,255,255,0.08)", borderRadius: 2 }} />
          <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${localProgress}%`, background: "#C8FF00", borderRadius: 2, transition: "width 0.1s" }} />
          <input type="range" min="0" max="100" value={localProgress} onChange={seek} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)" }}>
          <span>{fmt(localTime)}</span><span>{fmt(duration)}</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => setIsShuffling(!isShuffling)} aria-label="Shuffle" title="Shuffle" style={{ background: "transparent", border: "none", cursor: "pointer", color: isShuffling ? "#C8FF00" : "rgba(255,255,255,0.3)", transition: "color 0.2s", padding: 4 }}>
          <Shuffle size={16} strokeWidth={isShuffling ? 2.5 : 2} />
        </button>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <button onClick={() => skip(-1)} aria-label="Previous track" title="Previous track" style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 4 }}>
            <SkipBack size={20} strokeWidth={2} />
          </button>
          <PlayPauseButton size={52} iconSize={24} />
          <button onClick={() => skip(1)} aria-label="Next track" title="Next track" style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 4 }}>
            <SkipForward size={20} strokeWidth={2} />
          </button>
        </div>
        <button onClick={() => setIsLooping(!isLooping)} aria-label="Repeat" title="Repeat" style={{ background: "transparent", border: "none", cursor: "pointer", color: isLooping ? "#C8FF00" : "rgba(255,255,255,0.3)", transition: "color 0.2s", padding: 4 }}>
          <Repeat size={16} strokeWidth={isLooping ? 2.5 : 2} />
        </button>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: forceBar ? "transparent" : "var(--bg-player, #0d0d18)", color: "var(--text-primary, #fff)" }}>
      <style>{`
        @keyframes pulse-dot {
          0%,100% { opacity:0.3; transform:translate(-50%,-50%) scale(1); }
          50% { opacity:1; transform:translate(-50%,-50%) scale(1.5); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .rating-btn--up:hover { background: rgba(200,255,0,0.1) !important; color: #C8FF00 !important; }
        .rating-btn--down:hover { background: rgba(239,68,68,0.1) !important; color: #ef4444 !important; }
        .rating-btn:focus-visible { outline: 2px solid #C8FF00; outline-offset: 2px; }
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

          {/* Tab bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 16px 12px", flexShrink: 0 }}>
            <div className="pp-tab-bar" style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 3 }}>
              {["player", "queue", "lyrics"].map(m => (
                <button key={m} onClick={() => setPanelMode(m)}
                  className={`pp-tab${panelMode === m ? " pp-tab--active" : ""}`}
                  style={{
                    background: panelMode === m ? "rgba(200,255,0,0.12)" : "transparent",
                    border: "none",
                    color: panelMode === m ? "#C8FF00" : "rgba(255,255,255,0.38)",
                    fontWeight: 700, textTransform: "uppercase", fontSize: 9,
                    cursor: "pointer", letterSpacing: "0.1em",
                    padding: "6px 11px", borderRadius: 8,
                    transition: "all 0.18s"
                  }}>{m}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={handleShareClick} title="Share"
                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.28)", cursor: "pointer", padding: 4, transition: "color 0.18s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.28)"}
              ><Share2 size={14} /></button>
              <button onClick={onToggleDock} title="Collapse"
                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.28)", cursor: "pointer", padding: 4, transition: "color 0.18s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.28)"}
              >{isMobileView ? <ChevronDown size={18} /> : <Minimize2 size={14} />}</button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", minHeight: 0 }} className="scrollbar-hide">
            <AnimatePresence mode="wait">

              {panelMode === "player" && (
                <motion.div key="panel-player"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  style={{ padding: "8px 16px 24px", flex: 1, display: "flex", flexDirection: "column" }}
                >
                  {song ? (
                    <>
                      {/* Album art */}
                      <AnimatePresence mode="wait">
                        <motion.div key={`art-${song.id}`}
                          initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                          style={{ width: "100%", aspectRatio: "1", borderRadius: 16, overflow: "hidden", marginBottom: 20, flexShrink: 0, background: "#111", boxShadow: "0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)" }}
                        >
                          <AlbumArt src={song.cover_url} title={song.album_title || song.title} size="100%" radius="0" />
                        </motion.div>
                      </AnimatePresence>

                      {/* Song info */}
                      <AnimatePresence mode="wait">
                        <motion.div key={`info-${song.id}`}
                          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                          transition={{ duration: 0.22 }}
                          style={{ marginBottom: 18 }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                            <h2 className="pp-title" style={{ fontSize: "1.15rem", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em", margin: 0, overflow: "hidden", whiteSpace: "nowrap", flex: 1, minWidth: 0, textOverflow: "ellipsis", color: "#fff" }}>{song.title}</h2>
                            <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                              <button onClick={() => song && setAddToPlaylistSong({ id: song.id, title: song.title })} title="Add to playlist"
                                style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.28)", transition: "color 0.18s", padding: 4 }}
                                onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.28)"}
                              ><PlusCircle size={16} /></button>
                              <button onClick={toggleFav} disabled={favLoading}
                                aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
                                title={isFav ? "Remove from favourites" : "Add to favourites"}
                                style={{ background: "transparent", border: "none", cursor: "pointer", color: isFav ? "#C8FF00" : "rgba(255,255,255,0.28)", transition: "color 0.18s, transform 0.15s", transform: favLoading ? "scale(0.85)" : "scale(1)", padding: 4 }}
                              ><Heart size={16} fill={isFav ? "currentColor" : "none"} strokeWidth={2.5} /></button>
                            </div>
                          </div>
                          <p style={{ color: "#C8FF00", fontWeight: 600, fontSize: "0.75rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "0.01em" }}>{song.artist_name}</p>
                        </motion.div>
                      </AnimatePresence>

                      {/* Progress */}
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ position: "relative", height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, cursor: "pointer", marginBottom: 6 }}>
                          <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${bufferedProgress}%`, background: "rgba(255,255,255,0.07)", borderRadius: 2, transition: "width 0.5s" }} />
                          <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${localProgress}%`, background: "#C8FF00", borderRadius: 2, transition: "width 0.1s" }} />
                          {isBuffering && <div style={{ position: "absolute", top: "50%", left: `${localProgress}%`, transform: "translate(-50%,-50%)", width: 8, height: 8, borderRadius: "50%", background: "rgba(200,255,0,0.5)", animation: "pulse-dot 1s infinite" }} />}
                          <input type="range" min="0" max="100" value={localProgress} onChange={seek} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", margin: 0 }} />
                        </div>
                        <div className="pp-muted" style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", fontVariantNumeric: "tabular-nums" }}>
                          <span>{fmt(localTime)}</span><span>{fmt(duration)}</span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <button onClick={() => setIsShuffling(!isShuffling)} aria-label="Shuffle" title="Shuffle" style={{ background: "transparent", border: "none", cursor: "pointer", color: isShuffling ? "#C8FF00" : "rgba(255,255,255,0.3)", transition: "color 0.18s", padding: 4 }}>
                          <Shuffle size={16} strokeWidth={isShuffling ? 2.5 : 2} />
                        </button>
                        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                          <motion.button whileTap={{ scale: 0.88 }} onClick={() => skip(-1)} aria-label="Previous track" title="Previous track" style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 4, display: "flex" }}>
                            <SkipBack size={22} strokeWidth={2} />
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay}
                            style={{ width: 54, height: 54, background: audioError ? "rgba(255,80,80,0.9)" : "#C8FF00", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(200,255,0,0.28)" }}
                          >
                            {audioError ? <AlertCircle size={22} color="#fff" />
                              : isBuffering ? <Loader2 size={22} color="#000" style={{ animation: "spin 0.8s linear infinite" }} />
                              : isPlaying ? <Pause size={22} color="#000" fill="#000" />
                              : <Play size={22} color="#000" fill="#000" style={{ marginLeft: 3 }} />
                            }
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.88 }} onClick={() => skip(1)} aria-label="Next track" title="Next track" style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 4, display: "flex" }}>
                            <SkipForward size={22} strokeWidth={2} />
                          </motion.button>
                        </div>
                        <button onClick={() => setIsLooping(!isLooping)} aria-label="Repeat" title="Repeat" style={{ background: "transparent", border: "none", cursor: "pointer", color: isLooping ? "#C8FF00" : "rgba(255,255,255,0.3)", transition: "color 0.18s", padding: 4 }}>
                          <Repeat size={16} strokeWidth={isLooping ? 2.5 : 2} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.15)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Select a track
                    </div>
                  )}
                </motion.div>
              )}

              {panelMode === "queue" && (
                <motion.div key="panel-queue"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  style={{ padding: "8px 12px 24px" }}
                >
                  {queue.length === 0 ? (
                    <p style={{ color: "rgba(255,255,255,0.18)", fontWeight: 700, textTransform: "uppercase", fontSize: 10, textAlign: "center", paddingTop: 48, letterSpacing: "0.1em" }}>Queue is empty</p>
                  ) : queue.map((track, i) => (
                    <motion.div key={`${track.id}-${i}`}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                      onClick={() => { setGlobalTime(0); setCurrentIndex(i); }}
                      className={`pp-queue-track${currentIndex === i ? " pp-queue-track--active" : ""}`}
                      style={{ display: "flex", gap: 10, padding: "9px 10px", borderRadius: 11, background: currentIndex === i ? "rgba(200,255,0,0.06)" : "transparent", border: `1px solid ${currentIndex === i ? "rgba(200,255,0,0.15)" : "transparent"}`, cursor: "pointer", marginBottom: 3, transition: "background 0.18s, border-color 0.18s" }}
                    >
                      <AlbumArt src={track.cover_url} title={track.album_title || track.title} size={38} radius="8px" />
                      <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
                        <p className={`pp-queue-title${currentIndex === i ? " pp-queue-title--active" : ""}`} style={{ fontWeight: 700, fontSize: 12, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: currentIndex === i ? "#C8FF00" : "#fff" }}>{track.title}</p>
                        <p className="pp-queue-artist" style={{ fontWeight: 500, fontSize: 10, color: "rgba(255,255,255,0.38)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist_name}</p>
                      </div>
                      {currentIndex === i && (
                        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C8FF00", animation: "pulse-dot 1.2s ease-in-out infinite" }} />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {panelMode === "lyrics" && (
                <motion.div key="panel-lyrics"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}
                >
                  <LyricsPanel songId={song?.id} currentTime={localTime} onSeek={seekToTime} onLyricsAvailable={setHasLyrics} />
                  <TransportControls mode="lyrics" />
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── BAR MODE ── */}
      {forceBar && (
        <div style={{ padding: isMobile ? "8px 10px" : "10px 14px", background: "transparent", display: "flex", alignItems: "center", width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 14, background: "var(--bg-card, #18181b)", borderRadius: 100, boxShadow: "0 2px 24px rgba(0,0,0,0.28)", padding: isMobile ? "6px 14px 6px 6px" : "8px 20px 8px 8px", width: "100%", minWidth: 0, overflow: "hidden" }}>
            {song ? (
              <>
                {/* Album art */}
                <AlbumArt
                  src={song.cover_url}
                  title={song.album_title || song.title}
                  size={isMobile ? 44 : 50}
                  radius="50%"
                  style={{ cursor: isMobile ? "pointer" : "default" }}
                  onClick={() => isMobile && onToggleDock()}
                />

                {/* Song info + rating */}
                {!isMobile && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, width: 220, flexShrink: 0 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, margin: 0, color: "var(--text-primary, #fff)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</p>
                      <p style={{ fontWeight: 400, fontSize: 11, margin: "2px 0 0", color: "var(--text-muted, rgba(255,255,255,0.5))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.artist_name}</p>
                    </div>
                    <RatingWidget currentRating={currentRating} onRate={handleRate} size={15} />
                  </div>
                )}

                {/* Playback controls */}
                <div style={{ display: "flex", gap: isMobile ? 10 : 14, alignItems: "center", flexShrink: 0 }}>
                  <button onClick={() => skip(-1)} aria-label="Previous track" title="Previous track" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}>
                    <SkipBack size={isMobile ? 16 : 18} color="var(--text-primary, #fff)" strokeWidth={2} />
                  </button>
                  <button onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}>
                    {audioError
                      ? <AlertCircle size={isMobile ? 18 : 20} color="#C8FF00" />
                      : isBuffering
                        ? <Loader2 size={isMobile ? 18 : 20} color="var(--text-primary, #fff)" style={{ animation: "spin 0.8s linear infinite" }} />
                        : isPlaying
                          ? <Pause size={isMobile ? 18 : 20} color="var(--text-primary, #fff)" fill="var(--text-primary, #fff)" />
                          : <Play  size={isMobile ? 18 : 20} color="var(--text-primary, #fff)" fill="var(--text-primary, #fff)" style={{ marginLeft: 2 }} />
                    }
                  </button>
                  <button onClick={() => skip(1)} aria-label="Next track" title="Next track" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}>
                    <SkipForward size={isMobile ? 16 : 18} color="var(--text-primary, #fff)" strokeWidth={2} />
                  </button>
                </div>

                {/* Progress bar */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 10, color: "var(--text-muted, rgba(255,255,255,0.4))", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{fmt(localTime)}</span>
                  <div style={{ flex: 1, position: "relative", height: 4, background: "rgba(255,255,255,0.12)", borderRadius: 2, cursor: "pointer" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${bufferedProgress}%`, background: "rgba(255,255,255,0.1)", borderRadius: 2, transition: "width 0.5s linear" }} />
                    <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${localProgress}%`, background: "#C8FF00", borderRadius: 2, transition: "width 0.1s" }} />
                    <input type="range" min="0" max="100" value={localProgress} onChange={seek} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", margin: 0 }} />
                  </div>
                  <span style={{ fontSize: 10, color: "var(--text-muted, rgba(255,255,255,0.4))", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{fmt(duration)}</span>
                </div>

                {/* Volume */}
                {!isMobile && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <Volume2 size={15} color="var(--text-muted, rgba(255,255,255,0.4))" aria-hidden="true" />
                    <div style={{ width: 64, position: "relative", height: 4, background: "rgba(255,255,255,0.12)", borderRadius: 2, cursor: "pointer" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${volume * 100}%`, background: "#C8FF00", borderRadius: 2 }} />
                      <input type="range" min="0" max="100" value={volume * 100} onChange={e => handleVolume(e.target.value / 100)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", margin: 0 }} />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: isMobile ? 8 : 12, alignItems: "center", flexShrink: 0 }}>
                  <button onClick={toggleFav} disabled={favLoading}
                    aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
                    title={isFav ? "Remove from favourites" : "Add to favourites"}
                    style={{ background: "none", border: "none", cursor: favLoading ? "default" : "pointer", padding: 2, display: "flex", transform: favLoading ? "scale(0.85)" : "scale(1)", transition: "transform 0.15s" }}>
                    <Heart size={isMobile ? 16 : 18} fill={isFav ? "#C8FF00" : "none"} color={isFav ? "#C8FF00" : "#ccc"} strokeWidth={2.5} />
                  </button>
                  {!isMobile && (
                    <>
                      <button onClick={() => setIsLooping(!isLooping)} aria-label="Repeat" title="Repeat" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
                        <Repeat size={16} color={isLooping ? "#C8FF00" : "var(--text-muted, rgba(255,255,255,0.4))"} strokeWidth={2} />
                      </button>
                      {/* Mic button — toggles lyrics side panel (does NOT open full panel) */}
                      <button
                        onClick={() => hasLyrics && setSidePanel(v => v === "lyrics" ? null : "lyrics")}
                        aria-label="Show lyrics"
                        title={hasLyrics ? "Lyrics" : "No lyrics available"}
                        style={{
                          background: sidePanel === "lyrics" ? "rgba(200,255,0,0.18)" : "none",
                          border: "none", cursor: "pointer", padding: "4px 6px",
                          borderRadius: 6, display: "flex", transition: "background 0.18s",
                        }}
                      >
                        {hasLyrics
                          ? <Mic2 size={16} color={sidePanel === "lyrics" ? "#111" : "#ccc"} strokeWidth={2} />
                          : <MicOff size={16} color="#ddd" strokeWidth={1.5} />
                        }
                      </button>
                      {/* Queue button — toggles queue side panel (does NOT open full panel) */}
                      <button
                        onClick={() => setSidePanel(v => v === "queue" ? null : "queue")}
                        aria-label="View queue"
                        title="Queue"
                        style={{
                          background: sidePanel === "queue" ? "rgba(200,255,0,0.18)" : "none",
                          border: "none", cursor: "pointer", padding: "4px 6px",
                          borderRadius: 6, display: "flex", transition: "background 0.18s",
                        }}
                      >
                        <ListMusic size={16} color={sidePanel === "queue" ? "#111" : "#ccc"} strokeWidth={2} />
                      </button>
                      {/* Open full player panel */}
                      <button onClick={() => { setSidePanel(null); setPanelMode("player"); onToggleDock(); }} title="Open full player" aria-label="Open full player" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
                        <Maximize2 size={16} color="#ccc" strokeWidth={2} />
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <p style={{ flex: 1, textAlign: "center", color: "var(--text-muted, rgba(255,255,255,0.4))", fontSize: 12, fontWeight: 500, margin: 0 }}>Nothing playing</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
