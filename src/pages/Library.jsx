import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useUser }   from "../context/UserContext";
import { usePlayer } from "../context/PlayerContext";
import { Music, Heart, Clock, Plus, Share2, Trash2, Globe, Lock, Library as LibraryIcon, Play } from "lucide-react";
import http from "../services/http";
import toast from "react-hot-toast";
import { songDefaults, fmtDuration } from "../utils/songUtils";
import AlbumArt from "../components/common/AlbumArt";

const TABS = [
  { id:"playlists",  label:"Playlists",  icon:Music  },
  { id:"albums",     label:"Albums",     icon:LibraryIcon},
  { id:"favourites", label:"Favourites", icon:Heart  },
  { id:"history",    label:"History",    icon:Clock  },
];

export default function Library() {
  const { user } = useUser();
  const { setCurrentSongId, setQueueUpdated, setUserStarted, setIsPlaying } = usePlayer();
  const navigate = useNavigate();
  const email = user?.email;

  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "playlists";

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  const [playlists, setPlaylists] = useState([]);
  const [favs,      setFavs     ] = useState([]);
  const [albums,    setAlbums   ] = useState([]);
  const [history,   setHistory  ] = useState([]);
  const [loading,   setLoading  ] = useState(true);
  const [showCreate,setShowCreate] = useState(false);
  const [newName,   setNewName  ] = useState("");
  const [creating,  setCreating ] = useState(false);

  useEffect(() => {
    if (!email) return;
    setLoading(true);
    const load = async () => {
      try {
        if (tab === "playlists") {
          const r = await http.get("/auth/playlists")
            .catch(() => ({ data:[] }));
          setPlaylists(r.data || []);

        } else if (tab === "albums") {
          const r = await http.get("/auth/music/albums");
          setAlbums(r.data || []);

        } else if (tab === "favourites") {
          const r = await http.get("/auth/favourites");
          const ids = r.data.favourites || [];
          const detailed = await Promise.all(ids.slice(0, 50).map(async id => {
            try { const s = await http.get(`/auth/music/songs/${id}`); return songDefaults({id,...s.data}); }
            catch { return null; }
          }));
          setFavs(detailed.filter(Boolean));

        } else {
          const r = await http.get("/auth/play-history")
            .catch(() => ({ data:[] }));
          setHistory(r.data || []);
        }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [tab, email]);

  const createPlaylist = async e => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const r = await http.post("/auth/playlists", { name:newName.trim() });
      setPlaylists(prev => [r.data, ...prev]);
      setShowCreate(false); setNewName("");
      toast.success("Playlist created!");
    } catch { toast.error("Failed to create playlist"); }
    finally { setCreating(false); }
  };

  const deletePlaylist = async (id) => {
    if (!window.confirm("Delete this playlist?")) return;
    try {
      await http.delete(`/auth/playlists/${id}`).catch(()=>{});
      setPlaylists(prev => prev.filter(p => p.id !== id));
      toast.success("Playlist deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const toggleShare = async (id, currentState) => {
    try {
      await http.patch(`/auth/playlists/${id}`, { is_public:!currentState }).catch(()=>{});
      setPlaylists(prev => prev.map(p => p.id===id ? {...p, isShared:!p.isShared, is_public:!currentState} : p));
      toast.success(!currentState ? "Playlist is now public" : "Playlist is now private");
    } catch {}
  };

  const playSong = id => {
    if (!email) return;
    setCurrentSongId(id);
    setUserStarted(true);
    setIsPlaying(true);
    http.post("/auth/queue/add", { songIds: [id], album: false })
      .then(() => setQueueUpdated(p => !p))
      .catch(() => {});
  };

  const playAlbum = async albumId => {
    if (!email) { toast.error("Please login to play music"); return; }
    try {
      const res = await http.get("/auth/music/songs", { params: { album_id: albumId } });
      const songs = res.data || [];
      if (!songs.length) { toast.error("This album has no tracks"); return; }
      setCurrentSongId(songs[0].id);
      setUserStarted(true);
      setIsPlaying(true);
      http.post("/auth/queue/add", { songIds: songs.map(s => s.id), album: true })
        .then(() => setQueueUpdated(p => !p))
        .catch(() => {});
    } catch (err) {
      console.error("playAlbum:", err);
      toast.error("Failed to play album");
    }
  };

  return (
    <div className="lib-page">
      {/* Hero header */}
      <div className="lib-hero">
        <div className="lib-eyebrow">
          <span className="lib-eyebrow-dot" />
          <span className="lib-eyebrow-text">Collection</span>
        </div>
        <h1 className="lib-title">Your Library</h1>
        {loading ? (
          <div className="lib-skeleton-bone" style={{ width: 180, height: 12, borderRadius: 6 }} />
        ) : (
          <p className="lib-subtitle">
            {tab === 'playlists' ? `${playlists.length} playlists` :
             tab === 'albums' ? `${albums.length} albums` :
             tab === 'favourites' ? `${favs.length} favourites` :
             `${history.length} played`}
          </p>
        )}
      </div>

      {/* Tab bar */}
      <div className="lib-tab-bar" role="tablist" aria-label="Library sections">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              aria-controls={`lib-panel-${t.id}`}
              onClick={() => handleTabChange(t.id)}
              className={`lib-tab${active ? " lib-tab--active" : ""}`}
            >
              <Icon size={14} aria-hidden="true" />
              {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {Array.from({length:6}).map((_,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"10px 12px" }}>
                  <div className="lib-skeleton-bone" style={{ width:48, height:48, borderRadius:10, flexShrink:0 }} />
                  <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                    <div className="lib-skeleton-bone" style={{ width:"55%", height:14 }} />
                    <div className="lib-skeleton-bone" style={{ width:"30%", height:10 }} />
                  </div>
                  <div className="lib-skeleton-bone" style={{ width:40, height:10 }} />
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={tab}
            id={`lib-panel-${tab}`}
            role="tabpanel"
            initial={{opacity:0,y:8}}
            animate={{opacity:1,y:0}}
            exit={{opacity:0,y:-8}}
            transition={{duration:.2}}
          >

            {/* Playlists */}
            {tab === "playlists" && (
              <div>
                <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14 }}>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="lib-create-btn"
                    aria-label="Create new playlist"
                  >
                    <Plus size={14} aria-hidden="true" /> Create Playlist
                  </button>
                </div>

                {playlists.length === 0 ? (
                  <div className="lib-empty">
                    <Music size={48} className="lib-empty-icon" aria-hidden="true" />
                    <p className="lib-empty-title">No Playlists</p>
                    <p className="lib-empty-sub">Create your first playlist to get started</p>
                  </div>
                ) : (
                  <Reorder.Group axis="y" values={playlists} onReorder={(newOrder) => {
                    setPlaylists(newOrder);
                    // TODO: backend reorder endpoint not yet implemented
                  }} style={{ display:"flex", flexDirection:"column", gap:6, listStyle:"none", padding:0, margin:0 }}>
                    {playlists.map((p, i) => (
                      <Reorder.Item key={p.id} value={p} style={{ listStyle:"none" }}>
                        <div
                          className="lib-playlist-card lib-stagger-item"
                          style={{ animationDelay:`${i * 50}ms` }}
                          onClick={() => navigate(`/playlist/${p.id}`)}
                          role="button"
                          tabIndex={0}
                          aria-label={`Open playlist ${p.name}`}
                          onKeyDown={e => e.key === "Enter" && navigate(`/playlist/${p.id}`)}
                        >
                          <div className="lib-playlist-icon">
                            <Music size={20} aria-hidden="true" />
                          </div>
                          <div className="lib-playlist-info">
                            <p className="lib-playlist-name">{p.name}</p>
                            <p className="lib-playlist-count">
                              {p.songCount||p.song_count||0} {(p.songCount||p.song_count||0)===1?"song":"songs"}
                            </p>
                          </div>
                          <div className="lib-playlist-actions" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => toggleShare(p.id, p.isShared||p.is_public)}
                              className={`lib-action-btn${(p.isShared||p.is_public) ? " lib-action-btn--active" : ""}`}
                              title={(p.isShared||p.is_public) ? "Make private" : "Make public"}
                              aria-label={(p.isShared||p.is_public) ? "Make playlist private" : "Make playlist public"}
                            >
                              {(p.isShared||p.is_public) ? <Globe size={14} aria-hidden="true" /> : <Lock size={14} aria-hidden="true" />}
                            </button>
                            <button
                              onClick={() => deletePlaylist(p.id)}
                              className="lib-action-btn lib-action-btn--danger"
                              title="Delete playlist"
                              aria-label={`Delete playlist ${p.name}`}
                            >
                              <Trash2 size={14} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}
              </div>
            )}

            {/* Albums */}
            {tab === "albums" && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ margin: "0 0 4px", fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary, #fff)", letterSpacing: "-0.02em" }}>
                    Browse Albums
                  </h2>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted, rgba(255,255,255,0.4))", fontWeight: 500 }}>
                    All albums in the catalog
                  </p>
                </div>
                {albums.length === 0 ? (
                  <div className="lib-empty">
                    <LibraryIcon size={48} className="lib-empty-icon" aria-hidden="true" />
                    <p className="lib-empty-title">No Albums</p>
                    <p className="lib-empty-sub">No albums in the catalog yet</p>
                  </div>
                ) : (
                  <div className="lib-album-grid">
                    {albums.map((al, i) => (
                      <div
                        key={al.id}
                        className="lib-album-card lib-stagger-item"
                        style={{ animationDelay:`${i * 60}ms` }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Play album ${al.title} by ${al.artist_name}`}
                      >
                        <div className="lib-album-art-wrap">
                          <AlbumArt src={al.cover_url} title={al.title} size="100%" radius="0" className="lib-album-art" />
                          <div className="lib-album-overlay">
                            <button className="lib-album-play-btn" aria-label={`Play ${al.title}`} onClick={e => { e.stopPropagation(); playAlbum(al.id); }}>
                              <Play size={20} fill="currentColor" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        <p className="lib-album-title">{al.title}</p>
                        <p className="lib-album-artist">{al.artist_name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Favourites */}
            {tab === "favourites" && (
              <div>
                {favs.length === 0 ? (
                  <div className="lib-empty">
                    <Heart size={48} className="lib-empty-icon" aria-hidden="true" />
                    <p className="lib-empty-title">No Favourites</p>
                    <p className="lib-empty-sub">Like songs to see them here</p>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                    {favs.map((s, i) => (
                      <div
                        key={s.id}
                        className="lib-track-row lib-stagger-item"
                        style={{ animationDelay:`${i * 40}ms` }}
                        onClick={() => playSong(s.id)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Play ${s.title} by ${s.artist_name}`}
                        onKeyDown={e => e.key === "Enter" && playSong(s.id)}
                      >
                        <span className="lib-track-index">{String(i+1).padStart(2,"0")}</span>
                        <AlbumArt src={s.cover_url} title={s.album_title || s.title} size={40} radius="6px" className="lib-track-thumb" />
                        <div className="lib-track-info">
                          <p className="lib-track-title">{s.title}</p>
                          <p className="lib-track-artist">{s.artist_name}</p>
                        </div>
                        <span className="lib-track-duration">{fmtDuration(s.duration_seconds)}</span>
                        <Heart size={14} className="lib-track-heart" fill="currentColor" aria-label="Favourited" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* History */}
            {tab === "history" && (
              <div>
                {history.length === 0 ? (
                  <div className="lib-empty">
                    <Clock size={48} className="lib-empty-icon" aria-hidden="true" />
                    <p className="lib-empty-title">No History</p>
                    <p className="lib-empty-sub">Start listening to build your history</p>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                    {history.map((s, i) => (
                      <div
                        key={`${s.id}-${i}`}
                        className="lib-track-row lib-stagger-item"
                        style={{ animationDelay:`${i * 40}ms` }}
                        onClick={() => playSong(s.id)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Play ${s.title} by ${s.artist_name}`}
                        onKeyDown={e => e.key === "Enter" && playSong(s.id)}
                      >
                        <span className="lib-track-index">{String(i+1).padStart(2,"0")}</span>
                        <AlbumArt src={s.cover_url} title={s.album_title || s.title} size={40} radius="6px" className="lib-track-thumb" />
                        <div className="lib-track-info">
                          <p className="lib-track-title">{s.title}</p>
                          <p className="lib-track-artist">{s.artist_name}</p>
                        </div>
                        <span className="lib-track-duration">{fmtDuration(s.duration_seconds)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Create playlist modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="lib-modal-overlay"
              onClick={() => setShowCreate(false)}
            />
            <motion.div
              initial={{opacity:0,scale:.95,y:16}}
              animate={{opacity:1,scale:1,y:0}}
              exit={{opacity:0,scale:.95,y:16}}
              className="lib-modal"
            >
              <h2 className="lib-modal-title">New Playlist</h2>
              <form onSubmit={createPlaylist}>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="My Awesome Playlist"
                  autoFocus
                  className="lib-modal-input"
                  aria-label="Playlist name"
                />
                <div className="lib-modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="lib-modal-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newName.trim()||creating}
                    className="lib-modal-submit"
                  >
                    {creating ? "Creating…" : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
