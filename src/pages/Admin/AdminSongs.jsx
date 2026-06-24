import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FiTrash2, FiPlus, FiMusic, FiSearch, FiLink, FiDisc, FiMic, FiAlertCircle, FiFileText, FiEdit2, FiEye, FiEyeOff, FiUploadCloud, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_CONFIG } from '../../config';
import {
  Card, PageHeader, Btn, Tag, Empty, SkeletonRows,
  Th, Td, Tr, TableWrap, Modal, Input, FormRow, ModalFooter, Cover, Pagination, card
} from './AdminUI';
import { songDefaults } from '../../utils/songUtils';

const fmt = (s) => s ? `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}` : '—';

/* ── accent tokens for Songs page (pink) ─────────────────────────────────── */
const ACC = {
  dark: '#f472b6',
  light: '#db2777',
};

const iStyle = {
  width:'100%',
  background:'var(--a-bg3)',
  border:'1px solid var(--a-border)',
  borderRadius:8,
  padding:'8px 12px',
  color:'var(--a-text)',
  fontSize:13,
  outline:'none',
  fontFamily:'inherit',
  transition:'border-color .12s',
};

const EMPTY_FORM = { title:'', audiourl:'', cover_url:'', duration_seconds:'', artist_id:'', album_id:'', genre_id:'', is_explicit:false, is_visible:true };

/* ── Toggle ──────────────────────────────────────────────────────────────── */
function Toggle({ label, checked, onChange, description }) {
  return (
    <div
      className="a-songs-toggle"
      onClick={() => onChange(!checked)}
      style={{
        display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
        borderRadius:8, cursor:'pointer', userSelect:'none',
        background: checked ? 'rgba(244,114,182,.06)' : 'var(--a-bg3)',
        border: `1px solid ${checked ? 'rgba(244,114,182,.25)' : 'var(--a-border)'}`,
        transition:'all .15s',
      }}
    >
      <div style={{
        width:36, height:20, borderRadius:10, position:'relative', flexShrink:0,
        background: checked ? '#f472b6' : 'var(--a-border2)',
        border: `1px solid ${checked ? '#f472b6' : 'var(--a-border3)'}`,
        transition:'all .2s',
      }}>
        <div style={{
          position:'absolute', top:2, left: checked ? 18 : 2,
          width:14, height:14, borderRadius:'50%', background:'#fff',
          transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.4)',
        }}/>
      </div>
      <div>
        <p style={{ margin:0, fontSize:12, fontWeight:600, color: checked ? 'var(--a-text)' : 'var(--a-muted)' }}>{label}</p>
        {description && <p style={{ margin:0, fontSize:10, color:'var(--a-faint)', marginTop:1 }}>{description}</p>}
      </div>
    </div>
  );
}

/* ── AudioUploader ───────────────────────────────────────────────────────── */
function AudioUploader({ api, onComplete }) {
  const [mode, setMode]         = useState('url');   // 'url' | 'upload'
  const [urlVal, setUrlVal]     = useState('');
  const [file, setFile]         = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  // Detect duration from a File object using HTML5 Audio API (client-side, no server needed)
  const getDuration = (f) => new Promise((resolve) => {
    const url = URL.createObjectURL(f);
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(audio.duration) || 0);
    });
    audio.addEventListener('error', () => { URL.revokeObjectURL(url); resolve(0); });
  });

  const handleFile = (f) => {
    if (!f) return;
    setFile(f); setDone(false); setError(''); setProgress(0);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setProgress(0); setError('');
    try {
      const duration = await getDuration(file);
      const fd = new FormData();
      fd.append('audio', file);
      // Upload with axios so we get progress
      const { default: axios } = await import('axios');
      const { API_CONFIG } = await import('../../config');
      const token = localStorage.getItem('admin_token');
      const res = await axios.post(`${API_CONFIG.ADMIN_URL}/upload-audio`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 100)),
        withCredentials: true,
      });
      setDone(true);
      onComplete({ audiourl: res.data.audiourl, duration_seconds: duration });
    } catch (e) {
      setError(e.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleUrlCommit = () => {
    if (urlVal.trim()) onComplete({ audiourl: urlVal.trim() });
  };

  const tabStyle = (active) => ({
    flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontSize: 11, fontWeight: 700, fontFamily: "'Syne',sans-serif", letterSpacing: '0.08em',
    background: active ? 'var(--a-bg2)' : 'transparent',
    color: active ? 'var(--a-text)' : 'var(--a-muted)',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,.15)' : 'none',
    transition: 'all .15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 10, color: 'var(--a-muted)', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600, fontFamily: "'Syne',sans-serif" }}>
        Audio Source *
      </label>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 3, padding: 3, borderRadius: 8, background: 'var(--a-bg3)', border: '1px solid var(--a-border)' }}>
        <button type="button" style={tabStyle(mode === 'url')} onClick={() => setMode('url')}>
          🔗 Paste URL
        </button>
        <button type="button" style={tabStyle(mode === 'upload')} onClick={() => setMode('upload')}>
          ☁ Upload File
        </button>
      </div>

      {/* URL mode */}
      {mode === 'url' && (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={urlVal} onChange={e => setUrlVal(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
            style={{ ...iStyle, flex: 1 }}
            onFocus={e => e.target.style.borderColor = '#f472b6'}
            onBlur={e => { e.target.style.borderColor = 'var(--a-border)'; handleUrlCommit(); }}
            onKeyDown={e => e.key === 'Enter' && handleUrlCommit()}
          />
        </div>
      )}

      {/* Upload mode */}
      {mode === 'upload' && (
        <div>
          {!file ? (
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              style={{
                border: `2px dashed ${dragging ? '#f472b6' : 'var(--a-border3)'}`,
                borderRadius: 10, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
                background: dragging ? 'rgba(244,114,182,.04)' : 'var(--a-bg3)',
                transition: 'all .15s',
              }}
            >
              <FiUploadCloud size={24} style={{ color: 'var(--a-muted)', marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--a-text2)' }}>Drop audio file here</p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--a-faint)' }}>MP3, M4A, FLAC, WAV, OGG, AAC · max 100 MB</p>
              <input ref={inputRef} type="file" accept="audio/*,.mp3,.m4a,.flac,.wav,.ogg,.aac" hidden
                onChange={e => handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div style={{ border: '1px solid var(--a-border)', borderRadius: 10, padding: '12px 14px', background: 'var(--a-bg3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: done ? 0 : 10 }}>
                <FiMusic size={16} style={{ color: done ? '#34d399' : '#f472b6', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--a-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                  <p style={{ margin: 0, fontSize: 10, color: 'var(--a-muted)' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                {!uploading && !done && (
                  <button type="button" onClick={() => { setFile(null); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--a-muted)', padding: 0 }}>
                    <FiX size={14} />
                  </button>
                )}
                {done && <FiCheck size={16} style={{ color: '#34d399', flexShrink: 0 }} />}
              </div>

              {!done && (
                <>
                  {uploading && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ height: 4, borderRadius: 4, background: 'var(--a-border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#f472b6,#a78bfa)', borderRadius: 4, transition: 'width .2s' }} />
                      </div>
                      <p style={{ margin: '5px 0 0', fontSize: 10, color: 'var(--a-muted)', textAlign: 'right' }}>{progress}% · Uploading to Drive…</p>
                    </div>
                  )}
                  {error && <p style={{ margin: '0 0 8px', fontSize: 11, color: '#f87171' }}>{error}</p>}
                  {!uploading && (
                    <button type="button" onClick={handleUpload}
                      style={{ width: '100%', padding: '8px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif", background: 'linear-gradient(90deg,#f472b6,#a78bfa)', color: '#fff', letterSpacing: '0.05em' }}>
                      Upload to Google Drive
                    </button>
                  )}
                </>
              )}
              {done && (
                <p style={{ margin: '6px 0 0', fontSize: 11, color: '#34d399', fontWeight: 600 }}>
                  ✓ Uploaded — URL &amp; duration filled automatically
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
const AdminSongs = ({ api }) => {
  const [songs,      setSongs     ] = useState([]);
  const [albums,     setAlbums    ] = useState([]);
  const [artists,    setArtists   ] = useState([]);
  const [genres,     setGenres    ] = useState([]);
  const [loading,    setLoading   ] = useState(true);
  const [search,     setSearch    ] = useState('');
  const [filter,     setFilter    ] = useState('all');
  const [page,       setPage      ] = useState(1);
  const itemsPerPage = 10;

  const [showAdd,    setShowAdd   ] = useState(false);
  const [saving,     setSaving    ] = useState(false);
  const [form,       setForm      ] = useState(EMPTY_FORM);

  const [mapModal,    setMapModal  ] = useState(null);
  const [mapAlbumId,  setMapAlbumId] = useState('');
  const [mapArtistId, setMapArtistId]=useState('');
  const [mapSearch,   setMapSearch ] = useState('');
  const [mapping,     setMapping   ] = useState(false);

  const [lyricsModal,  setLyricsModal ] = useState(null);
  const [lyricsText,   setLyricsText  ] = useState('');
  const [lyricsSaving, setLyricsSaving] = useState(false);
  const [lyricsLoading,setLyricsLoading]=useState(false);

  const [editingSong, setEditingSong] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, al, ar] = await Promise.all([
        api.get('/songs'), api.get('/albums'), api.get('/artists')
      ]);
      setSongs(s.data); setAlbums(al.data); setArtists(ar.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
    api.get('/genres').then(g => setGenres(g.data || [])).catch(() => {});
  }, [api]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const saveSong = async () => {
    if (!form.title || !form.audiourl) { toast.error('Title and audio URL required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration_seconds: parseInt(form.duration_seconds) || 0,
        genre_id:   form.genre_id   || null,
        artist_id:  form.artist_id  || null,
        album_id:   form.album_id   || null,
        is_explicit: !!form.is_explicit,
        is_visible:  !!form.is_visible,
      };
      if (editingSong) {
        await api.patch(`/songs/${editingSong.id}`, payload);
        toast.success('Song updated');
      } else {
        await api.post('/songs', payload);
        toast.success('Song added');
      }
      setShowAdd(false); setEditingSong(null); setForm(EMPTY_FORM);
      fetchAll();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const openEdit = (s) => {
    setEditingSong(s);
    setForm({
      title:            s.title            || '',
      audiourl:         s.audiourl         || '',
      cover_url:        s.cover_url        || '',
      duration_seconds: s.duration_seconds || '',
      artist_id:        s.artist_id        || '',
      album_id:         s.album_id         || '',
      genre_id:         s.genre_id         || '',
      is_explicit:      !!s.is_explicit,
      is_visible:       s.is_visible !== false,
    });
    setShowAdd(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this song?')) return;
    try { await api.delete(`/songs/${id}`); setSongs(s=>s.filter(x=>x.id!==id)); toast.success('Deleted'); }
    catch { toast.error('Deletion failed'); }
  };

  const toggleVisibility = async (song) => {
    const next = !song.is_visible;
    try {
      await api.patch(`/songs/${song.id}`, { is_visible: next });
      setSongs(prev => prev.map(s => s.id === song.id ? { ...s, is_visible: next } : s));
      toast.success(next ? 'Song is now visible' : 'Song hidden from users');
    } catch { toast.error('Failed to update visibility'); }
  };

  const openMap = (song, type) => { setMapModal({song,type}); setMapAlbumId(song.album_id||''); setMapArtistId(song.artist_id||''); setMapSearch(''); };

  const saveMapping = async () => {
    if (!mapModal) return;
    setMapping(true);
    try {
      const payload = mapModal.type==='album' ? {album_id:mapAlbumId||null} : {artist_id:mapArtistId||null};
      await api.patch(`/songs/${mapModal.song.id}`, payload);
      setSongs(prev=>prev.map(s=>{
        if (s.id!==mapModal.song.id) return s;
        if (mapModal.type==='album') { const al=albums.find(a=>a.id===mapAlbumId); return {...s,album_id:mapAlbumId||null,album_title:al?.title||null}; }
        const ar=artists.find(a=>a.id===mapArtistId); return {...s,artist_id:mapArtistId||null,artist_name:ar?.name||null};
      }));
      toast.success(mapModal.type==='album'?'Album mapped':'Artist mapped');
      setMapModal(null);
    } catch (e) { toast.error(e.response?.data?.error||'Mapping failed'); }
    finally { setMapping(false); }
  };

  const openLyrics = async (song) => {
    setLyricsModal({ song }); setLyricsText(''); setLyricsLoading(true);
    try {
      const r = await axios.get(`${API_CONFIG.MUSIC_URL}/songs/${song.id}/lyrics`);
      setLyricsText(r.data.raw || '');
    } catch (e) {
      if (e.response?.status!==404) toast.error('Could not load existing lyrics');
    } finally { setLyricsLoading(false); }
  };

  const saveLyrics = async () => {
    if (!lyricsModal) return;
    setLyricsSaving(true);
    try {
      await api.patch(`/songs/${lyricsModal.song.id}`, { lyrics: lyricsText||null });
      toast.success('Lyrics saved');
      setLyricsModal(null);
    } catch { toast.error('Failed to save lyrics'); }
    finally { setLyricsSaving(false); }
  };

  const FILTERS = [
    { id:'all',       label:'All'       },
    { id:'no-album',  label:'No Album'  },
    { id:'no-artist', label:'No Artist' },
    { id:'no-lyrics', label:'No Lyrics' },
    { id:'hidden',    label:'Hidden'    },
  ];

  const filtered = songs.filter(s => {
    const q = search.toLowerCase();
    const mQ = !q || s.title?.toLowerCase().includes(q) || s.artist_name?.toLowerCase().includes(q) || s.album_title?.toLowerCase().includes(q) || s.genre?.toLowerCase().includes(q);
    const mF = filter==='no-album'  ? !s.album_id
             : filter==='no-artist' ? !s.artist_id
             : filter==='no-lyrics' ? !s.has_lyrics
             : filter==='hidden'    ? s.is_visible === false
             : true;
    return mQ && mF;
  });

  const totalFiltered = filtered.length;
  const paginated = filtered.slice((page-1)*itemsPerPage, page*itemsPerPage);

  useEffect(() => { setPage(1); }, [search, filter]);

  const unmappedAlbum  = songs.filter(s=>!s.album_id).length;
  const unmappedArtist = songs.filter(s=>!s.artist_id).length;
  const noLyrics       = songs.filter(s=>!s.has_lyrics).length;
  const hiddenCount    = songs.filter(s=>s.is_visible === false).length;

  const filteredAlbums  = albums.filter(a=>!mapSearch||a.title?.toLowerCase().includes(mapSearch.toLowerCase())||a.artist_name?.toLowerCase().includes(mapSearch.toLowerCase()));
  const filteredArtists = artists.filter(a=>!mapSearch||a.name?.toLowerCase().includes(mapSearch.toLowerCase()));

  /* icon-button used inside table rows */
  const iconBtn = (handler, title, hoverColor, hoverBg, hoverBorder, baseColor) => ({
    padding:'5px 8px', borderRadius:6, background:'transparent', border:'1px solid transparent',
    cursor:'pointer', color: baseColor || 'var(--a-faint)', transition:'all .12s', display:'inline-flex',
  });

  const mapBtn = (type, noVal, song) => (
    <button onClick={()=>openMap(song,type)} title={`Map ${type}`}
      style={{
        padding:'3px 6px', borderRadius:5, display:'inline-flex', cursor:'pointer', transition:'all .12s',
        background: noVal ? (type==='album'?'rgba(245,158,11,.1)':'rgba(167,139,250,.1)') : 'transparent',
        border: `1px solid ${noVal ? (type==='album'?'rgba(245,158,11,.3)':'rgba(167,139,250,.3)') : 'transparent'}`,
        color: noVal ? (type==='album'?'#f59e0b':'#a78bfa') : 'var(--a-faint)',
      }}
      onMouseEnter={e=>{
        const c=type==='album'?'#f59e0b':'#a78bfa',b=type==='album'?'rgba(245,158,11,.3)':'rgba(167,139,250,.3)',bg=type==='album'?'rgba(245,158,11,.1)':'rgba(167,139,250,.1)';
        e.currentTarget.style.color=c; e.currentTarget.style.borderColor=b; e.currentTarget.style.background=bg;
      }}
      onMouseLeave={e=>{
        if(!noVal){ e.currentTarget.style.color='var(--a-faint)'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.background='transparent'; }
      }}
    >
      {type==='album'?<FiDisc size={11}/>:<FiMic size={11}/>}
    </button>
  );

  return (
    <div className="a-songs">
      <style>{`
        .a-songs .row-icon-btn { padding:5px 8px;border-radius:6px;background:transparent;border:1px solid transparent;cursor:pointer;color:var(--a-faint);transition:all .12s;display:inline-flex; }
        .a-songs .row-icon-btn:hover { border-color:var(--a-border3); background:var(--a-hover); color:var(--a-text2); }
        .a-songs .row-icon-btn.danger:hover { color:#f87171!important;border-color:rgba(248,113,113,.25)!important;background:rgba(248,113,113,.08)!important; }
        .a-songs .row-icon-btn.edit:hover { color:#60a5fa!important;border-color:rgba(96,165,250,.25)!important;background:rgba(96,165,250,.08)!important; }
        .a-songs .row-icon-btn.lyrics:hover { color:#34d399!important;border-color:rgba(52,211,153,.25)!important;background:rgba(52,211,153,.08)!important; }
        .a-songs .row-icon-btn.vis-hidden { color:#f87171; }
        .a-songs .row-icon-btn.vis-hidden:hover { color:#86efac!important;border-color:rgba(134,239,172,.25)!important;background:rgba(134,239,172,.08)!important; }
        .a-songs .filter-pill { padding:5px 12px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:11px;font-weight:600;letter-spacing:.04em;transition:all .12s; }
        .a-songs .filter-pill.active { border:1px solid rgba(244,114,182,.4);background:rgba(244,114,182,.1);color:#f472b6; }
        .a-songs .filter-pill.inactive { border:1px solid var(--a-border);background:transparent;color:var(--a-muted); }
        .a-songs .filter-pill.inactive:hover { border-color:var(--a-border3);color:var(--a-text2); }
        .a-songs .map-row { display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;cursor:pointer;transition:all .12s; }
        .a-songs .map-row:hover:not(.sel) { background:var(--a-hover); }
        [data-admin-theme="dark"] .a-songs { --acc:#f472b6; }
        [data-admin-theme="light"] .a-songs { --acc:#db2777; }
      `}</style>

      <PageHeader
        title="Songs"
        subtitle={`${songs.length} tracks in catalog`}
        action={<Btn icon={FiPlus} onClick={()=>{ setEditingSong(null); setForm(EMPTY_FORM); setShowAdd(true); }}>Add Song</Btn>}
      />

      {/* ── Alert banners ─────────────────────────────────────────── */}
      {(unmappedAlbum>0||unmappedArtist>0||noLyrics>0||hiddenCount>0) && (
        <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
          {unmappedAlbum>0 && (
            <div onClick={()=>setFilter(f=>f==='no-album'?'all':'no-album')}
              style={{ display:'flex',alignItems:'center',gap:8,padding:'7px 14px',borderRadius:8,cursor:'pointer',transition:'all .12s',
                background:filter==='no-album'?'rgba(245,158,11,.12)':'rgba(245,158,11,.06)',
                border:`1px solid ${filter==='no-album'?'rgba(245,158,11,.4)':'rgba(245,158,11,.2)'}` }}>
              <FiAlertCircle size={13} style={{ color:'#f59e0b' }}/>
              <span style={{ fontSize:12, color:'#f59e0b', fontWeight:600 }}>{unmappedAlbum} without album</span>
            </div>
          )}
          {unmappedArtist>0 && (
            <div onClick={()=>setFilter(f=>f==='no-artist'?'all':'no-artist')}
              style={{ display:'flex',alignItems:'center',gap:8,padding:'7px 14px',borderRadius:8,cursor:'pointer',transition:'all .12s',
                background:filter==='no-artist'?'rgba(167,139,250,.12)':'rgba(167,139,250,.06)',
                border:`1px solid ${filter==='no-artist'?'rgba(167,139,250,.4)':'rgba(167,139,250,.2)'}` }}>
              <FiAlertCircle size={13} style={{ color:'#a78bfa' }}/>
              <span style={{ fontSize:12, color:'#a78bfa', fontWeight:600 }}>{unmappedArtist} without artist</span>
            </div>
          )}
          {noLyrics>0 && (
            <div onClick={()=>setFilter(f=>f==='no-lyrics'?'all':'no-lyrics')}
              style={{ display:'flex',alignItems:'center',gap:8,padding:'7px 14px',borderRadius:8,cursor:'pointer',transition:'all .12s',
                background:filter==='no-lyrics'?'rgba(52,211,153,.12)':'rgba(52,211,153,.06)',
                border:`1px solid ${filter==='no-lyrics'?'rgba(52,211,153,.4)':'rgba(52,211,153,.2)'}` }}>
              <FiFileText size={13} style={{ color:'#34d399' }}/>
              <span style={{ fontSize:12, color:'#34d399', fontWeight:600 }}>{noLyrics} without lyrics</span>
            </div>
          )}
          {hiddenCount>0 && (
            <div onClick={()=>setFilter(f=>f==='hidden'?'all':'hidden')}
              style={{ display:'flex',alignItems:'center',gap:8,padding:'7px 14px',borderRadius:8,cursor:'pointer',transition:'all .12s',
                background:filter==='hidden'?'rgba(248,113,113,.12)':'rgba(248,113,113,.06)',
                border:`1px solid ${filter==='hidden'?'rgba(248,113,113,.4)':'rgba(248,113,113,.2)'}` }}>
              <FiEyeOff size={13} style={{ color:'#f87171' }}/>
              <span style={{ fontSize:12, color:'#f87171', fontWeight:600 }}>{hiddenCount} hidden</span>
            </div>
          )}
        </div>
      )}

      {/* ── Search + filter bar ───────────────────────────────────── */}
      <Card style={{ marginBottom:16 }} p={14}>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <FiSearch size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--a-faint)' }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search songs, artists, albums, genres..."
              style={{ ...iStyle, paddingLeft:30, fontSize:12 }}
              onFocus={e=>e.target.style.borderColor='#f472b6'}
              onBlur={e=>e.target.style.borderColor='var(--a-border)'}
            />
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {FILTERS.map(fi=>(
              <button key={fi.id} onClick={()=>setFilter(fi.id)}
                className={`filter-pill ${filter===fi.id?'active':'inactive'}`}>
                {fi.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Table ────────────────────────────────────────────────── */}
      <div style={{ ...card, overflow:'hidden' }}>
        <TableWrap>
          <thead><tr>
            <Th>Track</Th><Th>Artist</Th><Th>Album</Th><Th>Genre</Th>
            <Th>Duration</Th><Th>Plays</Th><Th right>Actions</Th>
          </tr></thead>
          {loading ? <SkeletonRows cols={7} rows={itemsPerPage}/> : (
            <tbody>
              {paginated.length===0 ? <tr><td colSpan={7}><Empty message="No songs found"/></td></tr> : paginated.map(raw => {
                const s = songDefaults(raw);
                const noAlbum = !raw.album_id, noArtist = !raw.artist_id;
                const isHidden = raw.is_visible === false;
                return (
                  <Tr key={s.id} style={{ opacity: isHidden ? 0.55 : 1 }}>
                    <Td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <Cover src={s.cover_url} size={34} radius={6} fallback={<FiMusic size={13} style={{ color:'var(--a-faint)' }}/>}/>
                        <div>
                          <p style={{ margin:0, fontSize:13, fontWeight:600, color:'var(--a-text)' }}>{s.title}</p>
                          <div style={{ display:'flex', gap:4, marginTop:2, flexWrap:'wrap' }}>
                            {s.is_explicit && <Tag color="#f59e0b">Explicit</Tag>}
                            {isHidden && <Tag color="#f87171">Hidden</Tag>}
                            {raw.has_lyrics && <Tag color="#34d399">Lyrics</Tag>}
                          </div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        {noArtist ? <Tag color="#a78bfa">No Artist</Tag> : <span style={{ fontSize:13, color:'var(--a-text2)' }}>{s.artist_name}</span>}
                        {mapBtn('artist', noArtist, raw)}
                      </div>
                    </Td>
                    <Td>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        {noAlbum ? <Tag color="#f59e0b">No Album</Tag> : <span style={{ fontSize:13, color:'var(--a-text2)' }}>{s.album_title}</span>}
                        {mapBtn('album', noAlbum, raw)}
                      </div>
                    </Td>
                    <Td muted>{raw.genre || <span style={{ color:'var(--a-faint)', fontSize:11 }}>—</span>}</Td>
                    <Td muted>{fmt(s.duration_seconds)}</Td>
                    <Td muted>{s.play_count?.toLocaleString()||0}</Td>
                    <Td right>
                      <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                        <button onClick={()=>toggleVisibility(raw)} title={isHidden ? 'Show in app' : 'Hide from app'}
                          className={`row-icon-btn ${isHidden ? 'vis-hidden' : ''}`}>
                          {isHidden ? <FiEyeOff size={13}/> : <FiEye size={13}/>}
                        </button>
                        <button onClick={()=>openEdit(raw)} title="Edit song" className="row-icon-btn edit">
                          <FiEdit2 size={13}/>
                        </button>
                        <button onClick={()=>openLyrics(raw)} title="Edit lyrics" className="row-icon-btn lyrics">
                          <FiFileText size={13}/>
                        </button>
                        <button onClick={()=>handleDelete(s.id)} className="row-icon-btn danger">
                          <FiTrash2 size={13}/>
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          )}
        </TableWrap>
        <Pagination current={page} total={totalFiltered} limit={itemsPerPage} onPageChange={setPage}/>
      </div>

      {/* ══ ADD / EDIT SONG ══════════════════════════════════════════ */}
      <Modal open={showAdd} onClose={()=>{ setShowAdd(false); setEditingSong(null); }} title={editingSong?`Edit — "${editingSong.title}"`:'Add New Song'}>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <Input label="Title *" value={form.title} onChange={e=>f('title',e.target.value)} placeholder="Song title"/>
          <AudioUploader
            api={api}
            onComplete={({ audiourl, duration_seconds }) => {
              if (audiourl) f('audiourl', audiourl);
              if (duration_seconds) f('duration_seconds', String(duration_seconds));
            }}
          />
          {form.audiourl && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:7, background:'rgba(52,211,153,.06)', border:'1px solid rgba(52,211,153,.2)' }}>
              <FiCheck size={12} style={{ color:'#34d399', flexShrink:0 }} />
              <span style={{ fontSize:11, color:'var(--a-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{form.audiourl}</span>
              <button type="button" onClick={()=>f('audiourl','')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--a-muted)', padding:0, flexShrink:0 }}><FiX size={12}/></button>
            </div>
          )}
          <FormRow>
            <Input label="Cover Image URL" value={form.cover_url} onChange={e=>f('cover_url',e.target.value)} placeholder="https://..."/>
            <Input label="Duration (seconds)" type="number" value={form.duration_seconds} onChange={e=>f('duration_seconds',e.target.value)} placeholder="215"/>
          </FormRow>
          <FormRow>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:10, color:'var(--a-muted)', letterSpacing:'.12em', textTransform:'uppercase', fontWeight:600, fontFamily:"'Syne',sans-serif" }}>Artist</label>
              <select value={form.artist_id} onChange={e=>f('artist_id',e.target.value)} style={iStyle}
                onFocus={e=>e.target.style.borderColor='#f472b6'} onBlur={e=>e.target.style.borderColor='var(--a-border)'}>
                <option value="">— None —</option>{artists.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:10, color:'var(--a-muted)', letterSpacing:'.12em', textTransform:'uppercase', fontWeight:600, fontFamily:"'Syne',sans-serif" }}>Album</label>
              <select value={form.album_id} onChange={e=>f('album_id',e.target.value)} style={iStyle}
                onFocus={e=>e.target.style.borderColor='#f472b6'} onBlur={e=>e.target.style.borderColor='var(--a-border)'}>
                <option value="">— None —</option>{albums.map(a=><option key={a.id} value={a.id}>{a.title}{a.artist_name?` (${a.artist_name})`:''}</option>)}
              </select>
            </div>
          </FormRow>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={{ fontSize:10, color:'var(--a-muted)', letterSpacing:'.12em', textTransform:'uppercase', fontWeight:600, fontFamily:"'Syne',sans-serif" }}>Genre</label>
            <select value={form.genre_id} onChange={e=>f('genre_id',e.target.value)} style={iStyle}
              onFocus={e=>e.target.style.borderColor='#f472b6'} onBlur={e=>e.target.style.borderColor='var(--a-border)'}>
              <option value="">— None —</option>{genres.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <FormRow>
            <Toggle label="Show in App" checked={form.is_visible} onChange={v=>f('is_visible',v)} description="When off, users cannot see or play this song"/>
            <Toggle label="Explicit Content" checked={form.is_explicit} onChange={v=>f('is_explicit',v)} description="Marks the track with an Explicit badge"/>
          </FormRow>
        </div>
        <ModalFooter onCancel={()=>{ setShowAdd(false); setEditingSong(null); }} onSubmit={saveSong} loading={saving} submitLabel={editingSong?'Update Song':'Add Song'}/>
      </Modal>

      {/* ══ MAP MODAL ════════════════════════════════════════════════ */}
      <Modal open={!!mapModal} onClose={()=>setMapModal(null)} title={mapModal?`Map ${mapModal.type==='album'?'Album':'Artist'} → "${mapModal.song?.title}"`:''} maxWidth={520}>
        {mapModal&&(
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:8, marginBottom:16, background:'var(--a-bg3)', border:'1px solid var(--a-border)' }}>
              <Cover src={mapModal.song.cover_url} size={38} radius={6} fallback={<FiMusic size={14} style={{ color:'var(--a-faint)' }}/>}/>
              <div>
                <p style={{ margin:0, fontSize:13, fontWeight:600, color:'var(--a-text)' }}>{mapModal.song.title}</p>
                <p style={{ margin:'2px 0 0', fontSize:11, color:'var(--a-muted)' }}>
                  Current {mapModal.type}: {mapModal.type==='album'?(mapModal.song.album_title||'Not mapped'):(mapModal.song.artist_name||'Not mapped')}
                </p>
              </div>
            </div>
            <div style={{ position:'relative', marginBottom:12 }}>
              <FiSearch size={12} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--a-faint)' }}/>
              <input value={mapSearch} onChange={e=>setMapSearch(e.target.value)} autoFocus placeholder={`Search ${mapModal.type}s…`}
                style={{ ...iStyle, paddingLeft:30, fontSize:12 }}
                onFocus={e=>e.target.style.borderColor='#f472b6'} onBlur={e=>e.target.style.borderColor='var(--a-border)'}/>
            </div>
            {(()=>{ const isClear=mapModal.type==='album'?!mapAlbumId:!mapArtistId; return (
              <div onClick={()=>mapModal.type==='album'?setMapAlbumId(''):setMapArtistId('')}
                className="map-row"
                style={{ marginBottom:6, background:isClear?'rgba(244,114,182,.08)':'transparent', border:`1px solid ${isClear?'rgba(244,114,182,.25)':'var(--a-border)'}` }}>
                <div style={{ width:32, height:32, borderRadius:6, background:'var(--a-bg4)', border:'1px solid var(--a-border3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <FiLink size={12} style={{ color:'var(--a-muted)' }}/>
                </div>
                <div>
                  <p style={{ margin:0, fontSize:13, fontWeight:500, color:'var(--a-text2)' }}>Remove {mapModal.type} mapping</p>
                  <p style={{ margin:0, fontSize:10, color:'var(--a-faint)' }}>Set to unassigned</p>
                </div>
                {isClear&&<span style={{ marginLeft:'auto', width:8, height:8, borderRadius:'50%', background:'#f472b6' }}/>}
              </div>
            );})()}
            <div style={{ maxHeight:300, overflowY:'auto', display:'flex', flexDirection:'column', gap:3 }}>
              {(mapModal.type==='album'?filteredAlbums:filteredArtists).length===0&&(
                <p style={{ textAlign:'center', fontSize:13, color:'var(--a-faint)', padding:'20px 0' }}>No {mapModal.type}s found</p>
              )}
              {mapModal.type==='album'?filteredAlbums.map(al=>{ const sel=mapAlbumId===al.id; return (
                <div key={al.id} onClick={()=>setMapAlbumId(al.id)} className="map-row"
                  style={{ background:sel?'rgba(244,114,182,.08)':'transparent', border:`1px solid ${sel?'rgba(244,114,182,.25)':'transparent'}` }}>
                  <Cover src={al.cover_url} size={32} radius={5} fallback={<FiDisc size={11} style={{ color:'var(--a-faint)' }}/>}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:13, fontWeight:600, color:'var(--a-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{al.title}</p>
                    <p style={{ margin:0, fontSize:11, color:'var(--a-muted)' }}>{al.artist_name||'Unknown'} · {al.song_count||0} tracks</p>
                  </div>
                  {sel&&<span style={{ width:8, height:8, borderRadius:'50%', background:'#f472b6', flexShrink:0 }}/>}
                </div>); })
              :filteredArtists.map(ar=>{ const sel=mapArtistId===ar.id; return (
                <div key={ar.id} onClick={()=>setMapArtistId(ar.id)} className="map-row"
                  style={{ background:sel?'rgba(167,139,250,.08)':'transparent', border:`1px solid ${sel?'rgba(167,139,250,.25)':'transparent'}` }}>
                  <Cover src={ar.image_url} size={32} radius={16} fallback={<FiMic size={11} style={{ color:'var(--a-faint)' }}/>}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:13, fontWeight:600, color:'var(--a-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ar.name}</p>
                    <p style={{ margin:0, fontSize:11, color:'var(--a-muted)' }}>{ar.song_count||0} songs</p>
                  </div>
                  {sel&&<span style={{ width:8, height:8, borderRadius:'50%', background:'#a78bfa', flexShrink:0 }}/>}
                </div>); })}
            </div>
          </div>
        )}
        <ModalFooter onCancel={()=>setMapModal(null)} onSubmit={saveMapping} loading={mapping} submitLabel={mapModal?.type==='album'?'Save Album Mapping':'Save Artist Mapping'}/>
      </Modal>

      {/* ══ LYRICS MODAL ════════════════════════════════════════════ */}
      <Modal open={!!lyricsModal} onClose={()=>setLyricsModal(null)} title={lyricsModal?`Lyrics — "${lyricsModal.song?.title}"`:''} maxWidth={600}>
        {lyricsModal&&(
          <div>
            <div style={{ padding:'10px 14px', borderRadius:8, marginBottom:14, background:'rgba(52,211,153,.06)', border:'1px solid rgba(52,211,153,.2)' }}>
              <p style={{ margin:'0 0 6px', fontSize:12, fontWeight:700, color:'#34d399' }}>LRC Format (synchronized) — recommended</p>
              <pre style={{ margin:0, fontSize:11, color:'var(--a-muted)', fontFamily:'monospace', lineHeight:1.8 }}>{`[00:12.50] First line\n[00:16.00] Second line`}</pre>
              <p style={{ margin:'8px 0 0', fontSize:11, color:'var(--a-faint)' }}>Plain text (no timestamps) is also supported.</p>
            </div>
            {lyricsLoading ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:'var(--a-muted)', fontSize:13 }}>Loading…</div>
            ) : (
              <textarea value={lyricsText} onChange={e=>setLyricsText(e.target.value)}
                placeholder={`[00:12.50] First line\n[00:16.00] Second line`}
                rows={16} style={{ ...iStyle, resize:'vertical', lineHeight:1.7, fontFamily:'monospace', fontSize:12 }}
                onFocus={e=>e.target.style.borderColor='#f472b6'} onBlur={e=>e.target.style.borderColor='var(--a-border)'}
              />
            )}
            <p style={{ margin:'8px 0 0', fontSize:11, color:'var(--a-faint)' }}>
              Lines: {lyricsText.split('\n').filter(Boolean).length} · Chars: {lyricsText.length}
              {lyricsText && <> · <button onClick={()=>setLyricsText('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#f87171', fontSize:11, padding:0, fontFamily:'inherit' }}>Clear</button></>}
            </p>
          </div>
        )}
        <ModalFooter onCancel={()=>setLyricsModal(null)} onSubmit={saveLyrics} loading={lyricsSaving} submitLabel="Save Lyrics"/>
      </Modal>
    </div>
  );
};

export default AdminSongs;
