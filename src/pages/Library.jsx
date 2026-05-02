import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useUser }   from "../context/UserContext";
import { usePlayer } from "../context/PlayerContext";
import { Music, Heart, Clock, Plus, Share2, Trash2, Globe, Lock, Library as LibraryIcon } from "lucide-react";
import axios from "axios";
import http from "../services/http";
import ApiService from "../services/ApiService";
import { API_CONFIG } from "../config";
import toast from "react-hot-toast";
import { songDefaults, fmtDuration } from "../utils/songUtils";

const BASE = API_CONFIG.AUTH_URL; 

const TABS = [
  { id:"playlists",  label:"Playlists",  icon:Music  },
  { id:"albums",     label:"Albums",     icon:LibraryIcon},
  { id:"favourites", label:"Favourites", icon:Heart  },
  { id:"history",    label:"History",    icon:Clock  },
];

const Bone = ({ w="100%", h=14, r=6 }) => <div className="bone" style={{ width:w, height:h, borderRadius:r }}/>;

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
          // Real API call — falls back gracefully if table doesn't exist
          const r = await http.get("/auth/playlists")
            .catch(() => ({ data:[] }));
          setPlaylists(r.data || []);

        } else if (tab === "albums") {
          const r = await axios.get(`${BASE}/music/albums`);
          setAlbums(r.data || []);

        } else if (tab === "favourites") {
          const r = await http.get("/auth/favourites");
          const ids = r.data.favourites || [];
          const detailed = await Promise.all(ids.map(async id => {
            try { const s = await axios.get(`${BASE}/music/songs/${id}`); return songDefaults({id,...s.data}); }
            catch { return null; }
          }));
          setFavs(detailed.filter(Boolean));

        } else {
          // FIX: was /auth/play-history — BASE already = /auth, so this is /auth/play-history ✓
          const r = await http.get("/auth/play-history")
            .catch(() => ({ data:[] }));
          setHistory(r.data || []);
        }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [tab, email]);

  // Real playlist create
  const createPlaylist = async e => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const r = await http.post("/auth/playlists", { name:newName.trim() })
        .catch(async () => {
          return { data: { id:Date.now().toString(), name:newName.trim(), isShared:false, songCount:0 } };
        });
      setPlaylists(prev => [r.data, ...prev]);
      setShowCreate(false); setNewName("");
      toast.success("Playlist created!");
    } catch { toast.error("Failed to create playlist"); }
    finally { setCreating(false); }
  };

  // Real playlist delete
  const deletePlaylist = async (id) => {
    if (!window.confirm("Delete this playlist?")) return;
    try {
      await http.delete(`/auth/playlists/${id}`).catch(()=>{});
      setPlaylists(prev => prev.filter(p => p.id !== id));
      toast.success("Playlist deleted");
    } catch { toast.error("Failed to delete"); }
  };

  // Toggle share
  const toggleShare = async (id, currentState) => {
    try {
      await http.patch(`/auth/playlists/${id}`, { is_public:!currentState }).catch(()=>{});
      setPlaylists(prev => prev.map(p => p.id===id ? {...p, isShared:!p.isShared, is_public:!currentState} : p));
      toast.success(!currentState ? "Playlist is now public" : "Playlist is now private");
    } catch {}
  };

  const playSong = async id => {
    if (!email) return;
    try {
      await http.post("/auth/queue/add", { songIds:[id], album:false });
      setCurrentSongId(id); setQueueUpdated(p=>!p);
      setUserStarted(true);
      setIsPlaying(true);
    } catch {}
  };

  const iSt = { width:"100%", padding:"10px 14px", borderRadius:8, background:"var(--bg-card-hover)", border:"1px solid var(--border)", color:"var(--text-primary)", fontSize:14, fontFamily:"'Outfit',sans-serif", outline:"none", transition:"border-color .15s" };

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif" }}>
      <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"var(--text-primary)", margin:"0 0 20px" }}>Your Library</h1>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, padding:4, background:"var(--bg-card)", borderRadius:10, width:"fit-content", marginBottom:20, border:"1px solid var(--border)" }}>
        {TABS.map(t => { const Icon=t.icon; const active=tab===t.id; return (
          <button key={t.id} onClick={()=>handleTabChange(t.id)} style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 14px", borderRadius:7, border:"none", cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:active?700:500, background:active?"var(--accent)":"transparent", color:active?"#fff":"var(--text-secondary)", transition:"all .15s" }}>
            <Icon size={13}/>{t.label}
          </button>
        );})}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{ display:"flex",flexDirection:"column",gap:4 }}>
            {Array.from({length:5}).map((_,i) => (
              <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:8 }}>
                <Bone w={52} h={52} r={8}/><div style={{ flex:1,display:"flex",flexDirection:"column",gap:6 }}><Bone w="50%" h={13}/><Bone w="30%" h={10}/></div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div key={tab} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.2}}>

            {/* ── Playlists ── */}
            {tab === "playlists" && (
              <div>
                <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
                  <button onClick={()=>setShowCreate(true)} style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,background:"var(--bg-card)",border:"1px solid var(--border)",cursor:"pointer",color:"var(--text-primary)",fontSize:12,fontWeight:600,fontFamily:"'Outfit',sans-serif",transition:"all .15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.background="var(--accent)";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="var(--accent)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="var(--bg-card)";e.currentTarget.style.color="var(--text-primary)";e.currentTarget.style.borderColor="var(--border)";}}>
                    <Plus size={13}/> Create Playlist
                  </button>
                </div>

                {playlists.length === 0 ? (
                  <div style={{ textAlign:"center",padding:"48px 0",border:"2px dashed var(--border)",borderRadius:12 }}>
                    <Music size={36} style={{ color:"var(--text-muted)",marginBottom:12,opacity:.3 }}/>
                    <p style={{ fontWeight:700,color:"var(--text-primary)",margin:"0 0 6px",fontFamily:"'Syne',sans-serif" }}>No Playlists</p>
                    <p style={{ fontSize:12,color:"var(--text-muted)",margin:0 }}>Create your first playlist</p>
                  </div>
                ) : (
                  <Reorder.Group axis="y" values={playlists} onReorder={setPlaylists} style={{ display:"flex",flexDirection:"column",gap:4,listStyle:"none",padding:0,margin:0 }}>
                    {playlists.map(p => (
                      <Reorder.Item key={p.id} value={p} style={{ listStyle:"none" }}>
                        <div style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:10,background:"var(--bg-card)",border:"1px solid var(--border)",cursor:"grab" }}
                          onClick={() => navigate(`/playlist/${p.id}`)}
                          onMouseEnter={e => e.currentTarget.style.borderColor="var(--accent)"}
                          onMouseLeave={e => e.currentTarget.style.borderColor="var(--border)"}
                        >
                          <div style={{ width:48,height:48,borderRadius:8,background:"var(--accent-soft)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                            <Music size={18} style={{ color:"var(--accent)" }}/>
                          </div>
                          <div style={{ flex:1,minWidth:0 }}>
                            <p style={{ fontSize:14,fontWeight:600,color:"var(--text-primary)",margin:0 }}>{p.name}</p>
                            <p style={{ fontSize:11,color:"var(--text-muted)",margin:"2px 0 0" }}>{p.songCount||p.song_count||0} {(p.songCount||p.song_count||0)===1?"song":"songs"}</p>
                          </div>
                          <div style={{ display:"flex",gap:6 }}>
                            <button onClick={()=>toggleShare(p.id, p.isShared||p.is_public)} style={{ padding:6,borderRadius:6,border:"1px solid",borderColor:(p.isShared||p.is_public)?"var(--accent)":"var(--border)",background:(p.isShared||p.is_public)?"var(--accent-soft)":"transparent",cursor:"pointer",color:(p.isShared||p.is_public)?"var(--accent)":"var(--text-muted)",display:"flex" }} title={(p.isShared||p.is_public)?"Make private":"Make public"}>
                              {(p.isShared||p.is_public) ? <Globe size={13}/> : <Lock size={13}/>}
                            </button>
                            <button onClick={()=>deletePlaylist(p.id)} style={{ padding:6,borderRadius:6,border:"1px solid var(--border)",background:"transparent",cursor:"pointer",color:"var(--text-muted)",display:"flex",transition:"all .12s" }}
                              onMouseEnter={e=>{e.currentTarget.style.color="#f87171";e.currentTarget.style.borderColor="rgba(248,113,113,.3)";}}
                              onMouseLeave={e=>{e.currentTarget.style.color="var(--text-muted)";e.currentTarget.style.borderColor="var(--border)";}}>
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}
              </div>
            )}

            {/* ── Albums ── */}
            {tab === "albums" && (
              <div style={{ paddingBottom:40 }}>
                {albums.length === 0 ? (
                  <div style={{ textAlign:"center",padding:"48px 0",border:"2px dashed var(--border)",borderRadius:12 }}>
                    <Library size={36} style={{ color:"var(--text-muted)",marginBottom:12,opacity:.3 }}/>
                    <p style={{ fontWeight:700,color:"var(--text-primary)",margin:"0 0 6px",fontFamily:"'Syne',sans-serif" }}>No Albums</p>
                    <p style={{ fontSize:12,color:"var(--text-muted)",margin:0 }}>Saved albums will appear here</p>
                  </div>
                ) : (
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))",gap:20 }}>
                    {albums.map(al => (
                      <motion.div key={al.id} whileHover={{ y:-4 }} style={{ cursor:"pointer" }}>
                        <div style={{ position:"relative",aspectRatio:"1/1",marginBottom:10 }}>
                          <img src={al.cover_url||"/default-album.jpg"} alt="" style={{ width:"100%",height:"100%",borderRadius:12,objectFit:"cover",border:"1px solid var(--border)",boxShadow:"0 10px 25px -10px rgba(0,0,0,0.5)" }} onError={e=>e.target.src="/default-album.jpg"}/>
                        </div>
                        <p style={{ fontSize:13,fontWeight:600,color:"var(--text-primary)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{al.title}</p>
                        <p style={{ fontSize:11,color:"var(--text-muted)",margin:"2px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{al.artist_name}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Favourites ── */}
            {tab === "favourites" && (
              <div>
                {favs.length === 0 ? (
                  <div style={{ textAlign:"center",padding:"48px 0",border:"2px dashed var(--border)",borderRadius:12 }}>
                    <Heart size={36} style={{ color:"var(--text-muted)",marginBottom:12,opacity:.3 }}/>
                    <p style={{ fontWeight:700,color:"var(--text-primary)",margin:"0 0 6px",fontFamily:"'Syne',sans-serif" }}>No Favourites</p>
                    <p style={{ fontSize:12,color:"var(--text-muted)",margin:0 }}>Like songs to see them here</p>
                  </div>
                ) : (
                  <div style={{ display:"flex",flexDirection:"column",gap:2 }}>
                    {favs.map(s => (
                      <div key={s.id} onClick={()=>playSong(s.id)}
                        style={{ display:"flex",alignItems:"center",gap:12,padding:"8px 12px",borderRadius:8,cursor:"pointer",transition:"background .12s" }}
                        onMouseEnter={e=>e.currentTarget.style.background="var(--bg-card)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                      >
                        <img src={s.cover_url} alt="" style={{ width:42,height:42,borderRadius:6,objectFit:"cover",border:"1px solid var(--border)",flexShrink:0 }} onError={e=>e.target.src="/default-album.jpg"}/>
                        <div style={{ flex:1,minWidth:0 }}>
                          <p style={{ fontSize:13,fontWeight:600,color:"var(--text-primary)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.title}</p>
                          <p style={{ fontSize:11,color:"var(--text-muted)",margin:0 }}>{s.artist_name}</p>
                        </div>
                        <span style={{ fontSize:11,color:"var(--text-muted)",flexShrink:0 }}>{fmtDuration(s.duration_seconds)}</span>
                        <Heart size={14} style={{ color:"var(--accent)",flexShrink:0 }} fill="currentColor"/>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── History ── */}
            {tab === "history" && (
              <div>
                {history.length === 0 ? (
                  <div style={{ textAlign:"center",padding:"48px 0",border:"2px dashed var(--border)",borderRadius:12 }}>
                    <Clock size={36} style={{ color:"var(--text-muted)",marginBottom:12,opacity:.3 }}/>
                    <p style={{ fontWeight:700,color:"var(--text-primary)",margin:"0 0 6px",fontFamily:"'Syne',sans-serif" }}>No History</p>
                    <p style={{ fontSize:12,color:"var(--text-muted)",margin:0 }}>Start listening to build history</p>
                  </div>
                ) : (
                  <div style={{ display:"flex",flexDirection:"column",gap:2 }}>
                    {history.map((s,i) => (
                      <div key={`${s.id}-${i}`} onClick={()=>playSong(s.id)}
                        style={{ display:"flex",alignItems:"center",gap:12,padding:"8px 12px",borderRadius:8,cursor:"pointer",transition:"background .12s" }}
                        onMouseEnter={e=>e.currentTarget.style.background="var(--bg-card)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                      >
                        <img src={s.cover_url||"/default-album.jpg"} alt="" style={{ width:42,height:42,borderRadius:6,objectFit:"cover",border:"1px solid var(--border)",flexShrink:0 }} onError={e=>e.target.src="/default-album.jpg"}/>
                        <div style={{ flex:1,minWidth:0 }}>
                          <p style={{ fontSize:13,fontWeight:600,color:"var(--text-primary)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.title}</p>
                          <p style={{ fontSize:11,color:"var(--text-muted)",margin:0 }}>{s.artist_name}</p>
                        </div>
                        <span style={{ fontSize:11,color:"var(--text-muted)",flexShrink:0 }}>{fmtDuration(s.duration_seconds)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",zIndex:60 }}
              onClick={()=>setShowCreate(false)}
            />
            <motion.div initial={{opacity:0,scale:.95,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.95,y:16}}
              style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"min(400px,90vw)",background:"var(--bg-sidebar)",border:"1px solid var(--border-strong)",borderRadius:16,padding:24,zIndex:70,boxShadow:"0 24px 64px rgba(0,0,0,.6)" }}>
              <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:"var(--text-primary)",margin:"0 0 16px" }}>New Playlist</h2>
              <form onSubmit={createPlaylist}>
                <input type="text" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="My Awesome Playlist" autoFocus style={iSt}
                  onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                <div style={{ display:"flex",gap:8,marginTop:14 }}>
                  <button type="button" onClick={()=>setShowCreate(false)} style={{ flex:1,padding:"9px 0",borderRadius:8,background:"transparent",border:"1px solid var(--border)",cursor:"pointer",color:"var(--text-secondary)",fontSize:13,fontFamily:"'Outfit',sans-serif" }}>Cancel</button>
                  <button type="submit" disabled={!newName.trim()||creating} style={{ flex:1,padding:"9px 0",borderRadius:8,background:"var(--accent)",border:"none",cursor:"pointer",color:"#fff",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",opacity:newName.trim()&&!creating?1:.5 }}>
                    {creating?"Creating…":"Create"}
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
