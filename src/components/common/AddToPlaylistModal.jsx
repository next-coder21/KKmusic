import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Check, Music, ListMusic } from "lucide-react";
import { usePlayer } from "../../context/PlayerContext";
import http from "../../services/http";
import toast from "react-hot-toast";

export default function AddToPlaylistModal() {
  const { addToPlaylistSong, setAddToPlaylistSong } = usePlayer();

  const [playlists, setPlaylists]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [adding, setAdding]         = useState(null);   // playlist id being added to
  const [added, setAdded]           = useState({});     // { [playlistId]: true }
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName]       = useState("");
  const [creating, setCreating]     = useState(false);

  const isOpen = !!addToPlaylistSong;

  useEffect(() => {
    if (!isOpen) return;
    setAdded({});
    setLoading(true);
    http.get("/auth/playlists")
      .then(r => setPlaylists(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  const close = () => {
    setAddToPlaylistSong(null);
    setShowCreate(false);
    setNewName("");
  };

  const addToPlaylist = async (playlistId) => {
    if (!addToPlaylistSong?.id || adding) return;
    setAdding(playlistId);
    try {
      await http.post(`/auth/playlists/${playlistId}/songs`, { songId: addToPlaylistSong.id });
      setAdded(prev => ({ ...prev, [playlistId]: true }));
      toast.success("Added to playlist");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add");
    } finally {
      setAdding(null);
    }
  };

  const createAndAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const r = await http.post("/auth/playlists", { name: newName.trim() });
      const pl = r.data;
      setPlaylists(prev => [pl, ...prev]);
      setNewName(""); setShowCreate(false);
      await addToPlaylist(pl.id);
    } catch {
      toast.error("Failed to create playlist");
    } finally { setCreating(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", backdropFilter: "blur(4px)", zIndex: 200 }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(380px, 92vw)",
              background: "var(--bg-sidebar)",
              border: "1px solid var(--border-strong)",
              borderRadius: 16, zIndex: 201,
              boxShadow: "0 24px 64px rgba(0,0,0,.7)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Add to Playlist</h2>
                {addToPlaylistSong?.title && (
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>
                    {addToPlaylistSong.title}
                  </p>
                )}
              </div>
              <button onClick={close} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", padding: 4, borderRadius: 6 }}>
                <X size={16} />
              </button>
            </div>

            {/* New playlist button */}
            <div style={{ padding: "10px 16px 0" }}>
              {!showCreate ? (
                <button
                  onClick={() => setShowCreate(true)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 9,
                    background: "var(--bg-card)", border: "1px dashed var(--border)",
                    cursor: "pointer", color: "var(--accent)", fontSize: 12, fontWeight: 700,
                    fontFamily: "inherit", transition: "border-color .15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                >
                  <Plus size={14} /> New Playlist
                </button>
              ) : (
                <form onSubmit={createAndAdd} style={{ display: "flex", gap: 8 }}>
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Playlist name…"
                    style={{
                      flex: 1, padding: "9px 12px", borderRadius: 8,
                      background: "var(--bg-card-hover)", border: "1px solid var(--border)",
                      color: "var(--text-primary)", fontSize: 12, fontFamily: "inherit",
                      outline: "none",
                    }}
                    onFocus={e => e.target.style.borderColor = "var(--accent)"}
                    onBlur={e => e.target.style.borderColor = "var(--border)"}
                  />
                  <button type="submit" disabled={!newName.trim() || creating}
                    style={{ padding: "9px 14px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: newName.trim() && !creating ? 1 : 0.5, fontFamily: "inherit" }}>
                    {creating ? "…" : "Create"}
                  </button>
                  <button type="button" onClick={() => { setShowCreate(false); setNewName(""); }}
                    style={{ padding: "9px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <X size={13} />
                  </button>
                </form>
              )}
            </div>

            {/* Playlist list */}
            <div style={{ maxHeight: 280, overflowY: "auto", padding: "10px 16px 16px" }}>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 4 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: 52, borderRadius: 9, background: "var(--bg-card)" }} className="bone" />
                  ))}
                </div>
              ) : playlists.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 12 }}>
                  <ListMusic size={28} style={{ opacity: 0.25, marginBottom: 8 }} />
                  <p style={{ margin: 0 }}>No playlists yet</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {playlists.map(pl => {
                    const done   = !!added[pl.id];
                    const busy   = adding === pl.id;
                    return (
                      <button
                        key={pl.id}
                        onClick={() => !done && addToPlaylist(pl.id)}
                        disabled={busy || done}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 12,
                          padding: "9px 12px", borderRadius: 9,
                          background: done ? "rgba(var(--accent-rgb),.08)" : "var(--bg-card)",
                          border: `1px solid ${done ? "var(--accent)" : "var(--border)"}`,
                          cursor: done ? "default" : "pointer",
                          textAlign: "left", transition: "background .12s, border-color .12s",
                        }}
                        onMouseEnter={e => { if (!done) e.currentTarget.style.background = "var(--bg-card-hover)"; }}
                        onMouseLeave={e => { if (!done) e.currentTarget.style.background = "var(--bg-card)"; }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 7, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Music size={14} style={{ color: "var(--accent)" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pl.name}</p>
                          <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>{pl.songCount ?? pl.song_count ?? 0} songs</p>
                        </div>
                        {done ? (
                          <Check size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
                        ) : busy ? (
                          <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--accent)", display: "inline-block", animation: "spin .6s linear infinite", flexShrink: 0 }} />
                        ) : (
                          <Plus size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
