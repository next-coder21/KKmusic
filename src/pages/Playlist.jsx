import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Shuffle, Music, Trash2, Clock, ListMusic, MoreHorizontal, PlusCircle } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import { useUser } from "../context/UserContext";
import http from "../services/http";
import toast from "react-hot-toast";
import { fmtDuration } from "../utils/songUtils";
import AlbumArt from "../components/common/AlbumArt";

const Bone = ({ w = "100%", h = 14, r = 6 }) => (
  <div className="bone" style={{ width: w, height: h, borderRadius: r }} />
);

export default function PlaylistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { setCurrentSongId, setQueueUpdated, setUserStarted, setIsPlaying, setAddToPlaylistSong } = usePlayer();

  const [playlist, setPlaylist] = useState(null);
  const [songs,    setSongs]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [removing, setRemoving] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const [newName,  setNewName]  = useState("");
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [plRes, songRes] = await Promise.all([
          http.get("/auth/playlists"),
          http.get(`/auth/playlists/${id}/songs`),
        ]);
        const pl = (plRes.data || []).find(p => p.id === id);
        if (!pl) { navigate("/library?tab=playlists", { replace: true }); return; }
        setPlaylist(pl);
        setNewName(pl.name);
        setSongs(songRes.data || []);
      } catch {
        toast.error("Failed to load playlist");
        navigate("/library?tab=playlists", { replace: true });
      } finally { setLoading(false); }
    };
    load();
  }, [id, user]);

  const playSong = (songId) => {
    setCurrentSongId(songId);
    setUserStarted(true);
    setIsPlaying(true);
    http.post("/auth/queue/add", { songIds: [songId] })
      .then(() => setQueueUpdated(p => !p))
      .catch(() => {});
  };

  const playAll = (shuffle = false) => {
    if (!songs.length) return;
    const ids = shuffle
      ? [...songs].sort(() => Math.random() - 0.5).map(s => s.id)
      : songs.map(s => s.id);
    setCurrentSongId(ids[0]);
    setUserStarted(true);
    setIsPlaying(true);
    http.post("/auth/queue/add", { songIds: ids })
      .then(() => setQueueUpdated(p => !p))
      .catch(() => {});
  };

  const removeSong = async (songId) => {
    setRemoving(songId);
    try {
      await http.delete(`/auth/playlists/${id}/songs/${songId}`);
      setSongs(prev => prev.filter(s => s.id !== songId));
      setPlaylist(prev => prev ? { ...prev, songCount: Math.max(0, (prev.songCount ?? 1) - 1) } : prev);
      toast.success("Removed from playlist");
    } catch { toast.error("Failed to remove"); }
    finally { setRemoving(null); }
  };

  const saveRename = async () => {
    if (!newName.trim() || newName.trim() === playlist?.name) { setRenaming(false); return; }
    setSaving(true);
    try {
      await http.patch(`/auth/playlists/${id}`, { name: newName.trim() });
      setPlaylist(prev => ({ ...prev, name: newName.trim() }));
      setRenaming(false);
      toast.success("Renamed");
    } catch { toast.error("Failed to rename"); }
    finally { setSaving(false); }
  };

  const totalDuration = songs.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Bone w={160} h={20} r={8} />
      <div style={{ display: "flex", gap: 24, alignItems: "flex-end", margin: "24px 0" }}>
        <Bone w={140} h={140} r={12} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          <Bone w="50%" h={28} /><Bone w="30%" h={14} />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px" }}>
          <Bone w={42} h={42} r={6} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Bone w="55%" h={12} /><Bone w="35%" h={10} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <style>{`
        .bone {
          background: var(--skeleton-base, rgba(255,255,255,0.05));
          background: linear-gradient(90deg,
            var(--skeleton-base, rgba(255,255,255,0.05)) 25%,
            var(--skeleton-shine, rgba(255,255,255,0.10)) 50%,
            var(--skeleton-base, rgba(255,255,255,0.05)) 75%
          );
          background-size: 400px 100%;
          animation: shimmer 1.4s infinite linear;
          border-radius: 6px;
        }
      `}</style>
      {/* Back */}
      <button
        onClick={() => navigate("/library?tab=playlists")}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 24, padding: 0, fontFamily: "inherit", transition: "color .12s" }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
      >
        <ArrowLeft size={15} /> Back to Library
      </button>

      {/* Hero */}
      <div style={{ display: "flex", gap: 24, alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap" }}>
        <div style={{
          width: 140, height: 140, borderRadius: 14, flexShrink: 0,
          background: "var(--bg-card, rgba(255,255,255,0.04))",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid var(--border)",
          boxShadow: "0 16px 40px rgba(0,0,0,.4)",
          overflow: "hidden",
        }}>
          {songs[0]?.cover_url ? (
            <AlbumArt src={songs[0].cover_url} title={songs[0]?.album_title || songs[0]?.title} size="100%" radius="0" />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: 'var(--text-muted)' }}>
              <Music size={48} />
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", margin: "0 0 6px" }}>Playlist</p>

          {renaming ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") saveRename();
                  if (e.key === "Escape") { setRenaming(false); setNewName(playlist?.name || ""); }
                }}
                style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Syne',sans-serif", background: "transparent", border: "none", borderBottom: "2px solid var(--accent)", color: "var(--text-primary)", outline: "none", flex: 1, letterSpacing: "-0.03em", padding: "0 0 2px" }}
              />
              <button onClick={saveRename} disabled={saving} style={{ padding: "6px 14px", borderRadius: 7, background: "var(--accent)", border: "none", color: "#000", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}>
                {saving ? "…" : "Save"}
              </button>
              <button onClick={() => { setRenaming(false); setNewName(playlist?.name || ""); }} style={{ padding: "6px 10px", borderRadius: 7, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <ArrowLeft size={12} />
              </button>
            </div>
          ) : (
            <h1
              onClick={() => setRenaming(true)}
              title="Click to rename"
              style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px", cursor: "text", letterSpacing: "-0.03em" }}
            >
              {playlist?.name}
            </h1>
          )}

          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
            {songs.length} {songs.length === 1 ? "song" : "songs"}
            {totalDuration > 0 && ` · ${fmtDuration(totalDuration)}`}
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button onClick={() => playAll(false)} disabled={!songs.length} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 20px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#000", fontSize: 13, fontWeight: 700, cursor: songs.length ? "pointer" : "not-allowed", opacity: songs.length ? 1 : 0.4, fontFamily: "inherit" }}>
              <Play size={14} fill="currentColor" /> Play All
            </button>
            <button onClick={() => playAll(true)} disabled={!songs.length} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", fontSize: 13, fontWeight: 600, cursor: songs.length ? "pointer" : "not-allowed", opacity: songs.length ? 1 : 0.4, fontFamily: "inherit", transition: "background .12s" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Shuffle size={14} /> Shuffle
            </button>
          </div>
        </div>
      </div>

      {/* Songs */}
      {songs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", border: "2px dashed var(--border)", borderRadius: 12 }}>
          <Music size={36} style={{ color: "var(--text-muted)", marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px", fontFamily: "'Syne',sans-serif" }}>No songs yet</p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Use the "+" menu on any song to add it here.</p>
        </div>
      ) : (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "28px 1fr auto 56px 36px", gap: 10, padding: "6px 12px", marginBottom: 4, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
            <span>#</span><span>Title</span><span>Album</span>
            <span style={{ display: "flex", justifyContent: "center" }}><Clock size={11} /></span>
            <span />
          </div>
          <AnimatePresence>
            {songs.map((song, i) => (
              <SongRow
                key={song.id}
                rank={i + 1}
                song={song}
                removing={removing === song.id}
                onPlay={() => playSong(song.id)}
                onRemove={() => removeSong(song.id)}
                onAddToPlaylist={() => setAddToPlaylistSong({ id: song.id, title: song.title })}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function SongRow({ rank, song, removing, onPlay, onRemove, onAddToPlaylist }) {
  const [hovered,  setHovered]  = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: removing ? 0.3 : 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
      onClick={onPlay}
      style={{ display: "grid", gridTemplateColumns: "28px 1fr auto 56px 36px", gap: 10, padding: "8px 12px", borderRadius: 8, cursor: "pointer", alignItems: "center", background: hovered ? "var(--bg-card)" : "transparent", transition: "background .12s", position: "relative" }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {hovered ? <Play size={11} style={{ color: "var(--accent)" }} /> : rank}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <AlbumArt src={song.cover_url} title={song.album_title || song.title} size={38} radius="6px" style={{ border: "1px solid var(--border)" }} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{song.artist_name}</p>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{song.album_title}</p>
      <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", margin: 0 }}>{fmtDuration(song.duration_seconds)}</p>

      <div style={{ display: "flex", justifyContent: "center", position: "relative" }} onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(p => !p)}
          aria-label="Song options"
          title="Song options"
          style={{ background: "none", border: "none", cursor: "pointer", color: hovered ? "var(--text-muted)" : "transparent", display: "flex", padding: 3, borderRadius: 5, transition: "color .12s" }}
        >
          <MoreHorizontal size={14} />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ duration: 0.12 }}
              style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "var(--bg-sidebar)", border: "1px solid var(--border-strong)", borderRadius: 9, padding: 4, zIndex: 50, minWidth: 170, boxShadow: "0 8px 24px rgba(0,0,0,.5)" }}
            >
              <MenuItem icon={<PlusCircle size={13} />} label="Add to playlist" onClick={onAddToPlaylist} />
              <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
              <MenuItem icon={<Trash2 size={13} />} label="Remove from playlist" onClick={onRemove} danger />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 6, border: "none", background: hov ? (danger ? "rgba(248,113,113,.08)" : "var(--bg-card-hover)") : "transparent", cursor: "pointer", color: danger ? (hov ? "#f87171" : "var(--text-muted)") : "var(--text-primary)", fontSize: 12, fontWeight: 500, fontFamily: "inherit", textAlign: "left" }}
    >
      {icon} {label}
    </button>
  );
}
