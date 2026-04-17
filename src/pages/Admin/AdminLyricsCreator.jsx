import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiMusic, FiSearch, FiPlay, FiPause, FiSkipBack, FiSkipForward,
  FiVolume2, FiVolumeX, FiLoader, FiSave, FiDownload, FiGlobe,
  FiChevronRight, FiZap, FiEdit3, FiCheck, FiX, FiClock
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Card, PageHeader, Btn, Tag, Cover } from './AdminUI';
import { API_CONFIG } from '../../config';
import { songDefaults } from '../../utils/songUtils';

// ─── Styles ───────────────────────────────────────────────────────────────────
const iStyle = {
  width: '100%', background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 8,
  padding: '8px 12px', color: '#f9fafb', fontSize: 13, outline: 'none',
  fontFamily: 'inherit', transition: 'border-color .12s',
};

const LANGUAGES = [
  { code: '', label: 'Auto Detect' },
  { code: 'ta', label: 'Tamil' },
  { code: 'hi', label: 'Hindi' },
  { code: 'te', label: 'Telugu' },
  { code: 'en', label: 'English' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ko', label: 'Korean' },
  { code: 'ja', label: 'Japanese' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'ar', label: 'Arabic' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'de', label: 'German' },
  { code: 'ru', label: 'Russian' },
  { code: 'zh', label: 'Chinese' },
  { code: 'tr', label: 'Turkish' },
  { code: 'bn', label: 'Bengali' },
];

const fmt = (s) => {
  if (s == null || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

// ─── Song Selector (Left Panel) ───────────────────────────────────────────────
const SongSelector = ({ songs, loading, selected, onSelect, search, setSearch }) => (
  <div style={{
    width: 280, minWidth: 280, background: '#0a0a0a', borderRight: '1px solid #151515',
    display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px 0 0 12px',
    overflow: 'hidden'
  }}>
    {/* Search */}
    <div style={{ padding: 12, borderBottom: '1px solid #151515' }}>
      <div style={{ position: 'relative' }}>
        <FiSearch size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#374151' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search songs..."
          style={{ ...iStyle, paddingLeft: 30, fontSize: 12 }}
          onFocus={e => e.target.style.borderColor = '#ec4899'}
          onBlur={e => e.target.style.borderColor = '#1f1f1f'}
        />
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 10, color: '#374151', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600 }}>
        {songs.length} tracks
      </p>
    </div>

    {/* Song List */}
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 6px' }}>
      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#374151', fontSize: 12 }}>Loading songs...</div>
      ) : songs.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#374151', fontSize: 12 }}>No songs found</div>
      ) : songs.map(raw => {
        const s = songDefaults(raw);
        const isActive = selected?.id === s.id;
        return (
          <div key={s.id} onClick={() => onSelect(raw)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
              borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
              background: isActive ? 'rgba(236,72,153,.1)' : 'transparent',
              border: `1px solid ${isActive ? 'rgba(236,72,153,.2)' : 'transparent'}`,
              marginBottom: 2,
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#111'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? 'rgba(236,72,153,.1)' : 'transparent'; }}
          >
            <Cover src={s.cover_url} size={36} radius={6} fallback={<FiMusic size={13} style={{ color: '#374151' }} />} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: 0, fontSize: 12, fontWeight: 600,
                color: isActive ? '#f9fafb' : '#9ca3af',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>{s.title}</p>
              <p style={{
                margin: '2px 0 0', fontSize: 10,
                color: isActive ? '#6b7280' : '#374151',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>{s.artist_name || 'Unknown Artist'}</p>
            </div>
            {isActive && <FiChevronRight size={12} style={{ color: '#ec4899', flexShrink: 0 }} />}
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Audio Player (Center Panel) ──────────────────────────────────────────────
const AudioPlayer = ({ song, language, setLanguage, onGetLyrics, generating, audioRef, isPlaying, setIsPlaying, currentTime, duration }) => {
  const s = song ? songDefaults(song) : null;
  const progressRef = useRef(null);

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * duration;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const skip = (sec) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + sec));
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 28px', background: '#080808', justifyContent: 'center',
      minHeight: 0
    }}>

      {!song ? (
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 16, margin: '0 auto 18px',
            background: 'linear-gradient(135deg, rgba(236,72,153,.1), rgba(99,102,241,.1))',
            border: '1px solid rgba(236,72,153,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <FiMusic size={28} style={{ color: '#4b5563' }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#4b5563', margin: '0 0 6px', fontFamily: "'Syne', sans-serif" }}>
            Select a Song
          </p>
          <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.6 }}>
            Choose a track from the left panel to start generating lyrics with AI
          </p>
        </div>
      ) : (
        <>
          {/* Cover Art */}
          <div style={{
            width: 160, height: 160, borderRadius: 16, overflow: 'hidden',
            background: '#111', border: '1px solid #1a1a1a', marginBottom: 20,
            boxShadow: '0 20px 60px rgba(0,0,0,.5)',
            position: 'relative'
          }}>
            {s.cover_url ? (
              <img src={s.cover_url} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiMusic size={40} style={{ color: '#222' }} />
              </div>
            )}
            {/* Playing glow */}
            {isPlaying && <div style={{
              position: 'absolute', inset: -2, borderRadius: 18,
              border: '2px solid rgba(236,72,153,.4)',
              animation: 'pulse 2s ease-in-out infinite',
              pointerEvents: 'none'
            }} />}
          </div>

          {/* Song Info */}
          <p style={{
            margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#f9fafb',
            fontFamily: "'Syne', sans-serif", textAlign: 'center', maxWidth: 300,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>{s.title}</p>
          <p style={{ margin: '0 0 20px', fontSize: 12, color: '#4b5563', textAlign: 'center' }}>
            {s.artist_name || 'Unknown Artist'}
          </p>

          {/* Progress Bar */}
          <div style={{ width: '100%', maxWidth: 360, marginBottom: 12 }}>
            <div ref={progressRef} onClick={handleSeek}
              style={{
                height: 4, borderRadius: 2, background: '#1a1a1a', cursor: 'pointer',
                position: 'relative', overflow: 'hidden'
              }}>
              <div style={{
                height: '100%', borderRadius: 2, width: `${progress}%`,
                background: 'linear-gradient(90deg, #ec4899, #a855f7)',
                transition: 'width .1s linear'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 10, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{fmt(currentTime)}</span>
              <span style={{ fontSize: 10, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{fmt(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <button onClick={() => skip(-10)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', transition: 'color .12s', padding: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = '#9ca3af'} onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}>
              <FiSkipBack size={18} />
            </button>
            <button onClick={togglePlay}
              style={{
                width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #ec4899, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(236,72,153,.3)',
                transition: 'transform .12s, box-shadow .12s'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(236,72,153,.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(236,72,153,.3)'; }}
            >
              {isPlaying ? <FiPause size={20} style={{ color: '#fff' }} /> : <FiPlay size={20} style={{ color: '#fff', marginLeft: 2 }} />}
            </button>
            <button onClick={() => skip(10)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', transition: 'color .12s', padding: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = '#9ca3af'} onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}>
              <FiSkipForward size={18} />
            </button>
          </div>

          {/* Language Selector */}
          <div style={{ marginBottom: 16, width: '100%', maxWidth: 280 }}>
            <label style={{ fontSize: 10, color: '#4b5563', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <FiGlobe size={11} /> Language Hint
            </label>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              style={{ ...iStyle, fontSize: 12 }}
              onFocus={e => e.target.style.borderColor = '#ec4899'}
              onBlur={e => e.target.style.borderColor = '#1f1f1f'}
            >
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}{l.code ? ` (${l.code})` : ''}</option>)}
            </select>
          </div>

          {/* Get Lyrics Button */}
          <button onClick={onGetLyrics} disabled={generating}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 10, border: 'none', cursor: generating ? 'wait' : 'pointer',
              background: generating ? '#1a1a1a' : 'linear-gradient(135deg, #ec4899, #6366f1)',
              color: generating ? '#6b7280' : '#fff', fontSize: 14, fontWeight: 700,
              fontFamily: "'Syne', sans-serif", letterSpacing: '-0.01em',
              boxShadow: generating ? 'none' : '0 4px 24px rgba(236,72,153,.3)',
              transition: 'all .2s', width: '100%', maxWidth: 280, justifyContent: 'center'
            }}
            onMouseEnter={e => { if (!generating) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(236,72,153,.4)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = generating ? 'none' : '0 4px 24px rgba(236,72,153,.3)'; }}
          >
            {generating ? (
              <>
                <div style={{
                  width: 16, height: 16, border: '2px solid #333', borderTop: '2px solid #ec4899',
                  borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                }} />
                Transcribing...
              </>
            ) : (
              <>
                <FiZap size={16} />
                Get Lyrics
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
};

// ─── LRC parser helper ────────────────────────────────────────────────────────
const LRC_RE = /^\[(\d{1,2}):(\d{2}(?:[.:]+\d+)?)\]\s?(.*)/;

function parseLrcLines(lrcText) {
  if (!lrcText) return [];
  return lrcText.split('\n').map((raw, idx) => {
    const m = raw.match(LRC_RE);
    if (m) {
      const time = parseInt(m[1]) * 60 + parseFloat(m[2].replace(':', '.'));
      return { idx, time, text: m[3] || '', raw };
    }
    return { idx, time: null, text: raw.trim(), raw };
  }).filter(l => l.text || l.time !== null);
}

function findActiveLine(parsed, currentTime) {
  if (!parsed.length || currentTime <= 0) return -1;
  let active = -1;
  for (let i = 0; i < parsed.length; i++) {
    if (parsed[i].time !== null && parsed[i].time <= currentTime) active = i;
  }
  return active;
}

// ─── Lyrics Editor (Right Panel) ──────────────────────────────────────────────
const LyricsEditor = ({ lrc, setLrc, song, onSave, saving, lrcMeta, currentTime, isPlaying, audioRef }) => {
  const lineCount = lrc ? lrc.split('\n').filter(Boolean).length : 0;
  const charCount = lrc ? lrc.length : 0;
  const [editMode, setEditMode] = useState(false);
  const syncScrollRef = useRef(null);
  const activeLineRef = useRef(null);

  // Parse LRC for sync view
  const parsed = React.useMemo(() => parseLrcLines(lrc), [lrc]);
  const activeIdx = findActiveLine(parsed, currentTime);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current && syncScrollRef.current && isPlaying && !editMode) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIdx, isPlaying, editMode]);

  // Seek to timestamp on line click
  const handleLineClick = (time) => {
    if (audioRef?.current && time !== null) {
      audioRef.current.currentTime = time;
      if (!isPlaying) audioRef.current.play();
    }
  };

  const isMusic = (text) => /^♪/.test(text?.trim());

  return (
    <div style={{
      width: 340, minWidth: 340, background: '#0a0a0a', borderLeft: '1px solid #151515',
      display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '0 12px 12px 0',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #151515' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#e5e7eb', fontFamily: "'Syne', sans-serif" }}>
            Lyrics Editor
          </h3>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {lrc && (
              <button onClick={() => setEditMode(!editMode)}
                style={{
                  padding: '3px 10px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                  fontFamily: 'inherit', cursor: 'pointer', transition: 'all .12s',
                  background: editMode ? 'rgba(99,102,241,.12)' : 'rgba(236,72,153,.12)',
                  border: `1px solid ${editMode ? 'rgba(99,102,241,.3)' : 'rgba(236,72,153,.3)'}`,
                  color: editMode ? '#818cf8' : '#ec4899', letterSpacing: '.04em', textTransform: 'uppercase'
                }}>
                {editMode ? 'Sync View' : 'Edit'}
              </button>
            )}
            {lrcMeta && <Tag color="#2dd4bf">{lrcMeta.language || 'auto'}</Tag>}
          </div>
        </div>
        {lrcMeta && (
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            <span style={{ fontSize: 10, color: '#374151' }}>
              <FiClock size={9} style={{ marginRight: 3 }} />{lrcMeta.wordCount} words
            </span>
            <span style={{ fontSize: 10, color: '#374151' }}>{lineCount} lines</span>
            <span style={{ fontSize: 10, color: '#374151' }}>{charCount} chars</span>
          </div>
        )}
      </div>

      {/* Editor / Sync View */}
      <div style={{ flex: 1, padding: '12px 12px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!lrc && !song ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <FiEdit3 size={28} style={{ color: '#1f1f1f', marginBottom: 12 }} />
            <p style={{ fontSize: 12, color: '#374151', textAlign: 'center', lineHeight: 1.6 }}>
              Generated lyrics will appear here.<br />You can edit them before saving.
            </p>
          </div>
        ) : editMode ? (
          /* ── Edit Mode (textarea) ── */
          <>
            <div style={{
              padding: '6px 10px', borderRadius: 6, marginBottom: 8,
              background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.15)',
              fontSize: 10, color: '#818cf8', lineHeight: 1.4
            }}>
              <strong>Edit Mode</strong> — Modify timestamps and lyrics directly.
            </div>
            <textarea
              value={lrc || ''}
              onChange={e => setLrc(e.target.value)}
              style={{
                ...iStyle, flex: 1, resize: 'none', lineHeight: 1.9,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 12,
                borderRadius: 8, minHeight: 0
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#1f1f1f'}
              placeholder="[00:12.50] First line of lyrics&#10;[00:16.00] Second line..."
            />
          </>
        ) : (
          /* ── Sync View (highlighted lyrics) ── */
          <div ref={syncScrollRef} style={{
            flex: 1, overflowY: 'auto', borderRadius: 8,
            background: '#070707', border: '1px solid #1a1a1a', padding: '10px 0',
          }}>
            {parsed.map((line, i) => {
              const isActive = i === activeIdx;
              const isMusicLine = isMusic(line.text);
              const isPast = activeIdx >= 0 && i < activeIdx;
              return (
                <div
                  key={i}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => handleLineClick(line.time)}
                  style={{
                    padding: '6px 14px',
                    cursor: line.time !== null ? 'pointer' : 'default',
                    transition: 'all .2s ease',
                    background: isActive
                      ? 'linear-gradient(90deg, rgba(236,72,153,.12), rgba(99,102,241,.08))'
                      : 'transparent',
                    borderLeft: isActive ? '3px solid #ec4899' : '3px solid transparent',
                    position: 'relative',
                  }}
                >
                  {/* Timestamp */}
                  {line.time !== null && (
                    <span style={{
                      fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                      color: isActive ? '#ec4899' : '#2a2a2a',
                      fontWeight: 600, letterSpacing: '.03em',
                      transition: 'color .2s',
                      marginRight: 8,
                    }}>
                      {fmt(line.time)}
                    </span>
                  )}
                  {/* Lyric text */}
                  <span style={{
                    fontSize: isMusicLine ? 11 : 13,
                    fontWeight: isActive ? 700 : (isPast ? 400 : 500),
                    color: isMusicLine
                      ? (isActive ? '#a78bfa' : '#2d2d3d')
                      : isActive
                        ? '#f9fafb'
                        : isPast
                          ? '#3a3a3a'
                          : '#6b7280',
                    fontStyle: isMusicLine ? 'italic' : 'normal',
                    transition: 'all .25s ease',
                    letterSpacing: isActive ? '0.01em' : '0',
                  }}>
                    {line.text}
                  </span>
                  {/* Playing indicator */}
                  {isActive && isPlaying && (
                    <span style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      display: 'flex', gap: 2, alignItems: 'flex-end', height: 12
                    }}>
                      {[0, 1, 2].map(b => (
                        <span key={b} style={{
                          width: 2, borderRadius: 1, background: '#ec4899',
                          animation: `eqBar 0.6s ease-in-out ${b * 0.15}s infinite alternate`,
                        }} />
                      ))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div style={{
        padding: '12px 14px', borderTop: '1px solid #151515',
        display: 'flex', gap: 8, alignItems: 'center'
      }}>
        {lrc && (
          <>
            <button onClick={() => setLrc('')}
              style={{
                padding: '7px 12px', borderRadius: 6, background: 'transparent',
                border: '1px solid #1f1f1f', cursor: 'pointer', color: '#4b5563',
                fontSize: 11, fontWeight: 600, fontFamily: 'inherit', transition: 'all .12s',
                display: 'flex', alignItems: 'center', gap: 5
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1f1f1f'; e.currentTarget.style.color = '#4b5563'; }}
            >
              <FiX size={12} /> Clear
            </button>
            <button onClick={() => {
              const blob = new Blob([lrc], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${song?.title || 'lyrics'}.lrc`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success('LRC file downloaded');
            }}
              style={{
                padding: '7px 12px', borderRadius: 6, background: 'transparent',
                border: '1px solid #1f1f1f', cursor: 'pointer', color: '#4b5563',
                fontSize: 11, fontWeight: 600, fontFamily: 'inherit', transition: 'all .12s',
                display: 'flex', alignItems: 'center', gap: 5
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1f1f1f'; e.currentTarget.style.color = '#4b5563'; }}
            >
              <FiDownload size={12} /> .LRC
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={onSave} disabled={saving || !song}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none', cursor: saving ? 'wait' : 'pointer',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s',
                boxShadow: '0 2px 12px rgba(16,185,129,.25)',
                opacity: (saving || !song) ? 0.5 : 1
              }}
              onMouseEnter={e => { if (!saving && song) e.currentTarget.style.boxShadow = '0 4px 20px rgba(16,185,129,.4)'; }}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(16,185,129,.25)'}
            >
              {saving ? (
                <>
                  <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave size={13} /> Save to Song
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
const AdminLyricsCreator = ({ api }) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [language, setLanguage] = useState('');

  // Player state
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Lyrics state
  const [lrc, setLrc] = useState('');
  const [lrcMeta, setLrcMeta] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch songs
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/songs');
        setSongs(data);
      } catch { toast.error('Failed to load songs'); }
      finally { setLoading(false); }
    })();
  }, [api]);

  // Filter songs
  const filtered = songs.filter(s => {
    const q = search.toLowerCase();
    return !q || s.title?.toLowerCase().includes(q) || s.artist_name?.toLowerCase().includes(q);
  });

  // Audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onDur = () => setDuration(audio.duration);
    const onEnd = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onDur);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onDur);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [selected]);

  // Select song
  const handleSelect = useCallback((song) => {
    setSelected(song);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    // Don't clear lyrics — user might want to compare
  }, []);

  // Get Lyrics
  const handleGetLyrics = async () => {
    if (!selected) return;
    setGenerating(true);
    setLrc('');
    setLrcMeta(null);

    try {
      const { data } = await api.post('/lyricgen', {
        songId: selected.id,
        language: language || undefined,
      });

      setLrc(data.lrc || '');
      setLrcMeta({
        language: data.language,
        wordCount: data.wordCount,
        unmatched: data.unmatched || 0,
      });
      toast.success(`Lyrics generated! (${data.wordCount} words, ${data.language})`);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Generation failed';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  // Save lyrics to song
  const handleSave = async () => {
    if (!selected || !lrc) return;
    setSaving(true);
    try {
      await api.patch(`/songs/${selected.id}`, { lyrics: lrc });
      toast.success('Lyrics saved to song!');
    } catch {
      toast.error('Failed to save lyrics');
    } finally {
      setSaving(false);
    }
  };

  // Build audio stream URL
  const audioSrc = selected ? `${API_CONFIG.MUSIC_URL}/stream/${selected.id}` : '';

  return (
    <div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes pulse { 0%, 100% { opacity: 0.4 } 50% { opacity: 1 } }
        @keyframes eqBar {
          0% { height: 3px; }
          100% { height: 12px; }
        }
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>

      <PageHeader
        title="Lyrics Creator"
        subtitle="AI-powered lyrics generation with Groq × Whisper"
      />

      {/* Hidden audio element */}
      {selected && (
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="metadata"
          crossOrigin="anonymous"
        />
      )}

      {/* 3-Panel Layout */}
      <div style={{
        display: 'flex', border: '1px solid #1a1a1a', borderRadius: 12,
        overflow: 'hidden', background: '#080808',
        height: 'calc(100vh - 200px)'
      }}>
        {/* Left — Song Selector */}
        <SongSelector
          songs={filtered}
          loading={loading}
          selected={selected}
          onSelect={handleSelect}
          search={search}
          setSearch={setSearch}
        />

        {/* Center — Player + Get Lyrics */}
        <AudioPlayer
          song={selected}
          language={language}
          setLanguage={setLanguage}
          onGetLyrics={handleGetLyrics}
          generating={generating}
          audioRef={audioRef}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          currentTime={currentTime}
          duration={duration}
        />

        {/* Right — Lyrics Editor */}
        <LyricsEditor
          lrc={lrc}
          setLrc={setLrc}
          song={selected}
          onSave={handleSave}
          saving={saving}
          lrcMeta={lrcMeta}
          currentTime={currentTime}
          isPlaying={isPlaying}
          audioRef={audioRef}
        />
      </div>
    </div>
  );
};

export default AdminLyricsCreator;
