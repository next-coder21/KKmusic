import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiMusic, FiSearch, FiPlay, FiPause, FiSkipBack, FiSkipForward,
  FiLoader, FiSave, FiDownload, FiGlobe, FiChevronRight, FiZap,
  FiEdit3, FiX, FiClock, FiAlignLeft, FiCheck, FiWifi, FiWifiOff,
  FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Card, PageHeader, Btn, Tag, Cover } from './AdminUI';
import { API_CONFIG } from '../../config';
import { songDefaults } from '../../utils/songUtils';

// ─── Constants ─────────────────────────────────────────────────────────────────

const iStyle = {
  width: '100%',
  background: 'var(--a-bg3)',
  border: '1px solid var(--a-border)',
  borderRadius: 8,
  padding: '8px 12px',
  color: 'var(--a-text)',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color .12s',
};

const LANGUAGES = [
  { code: '', label: 'Auto Detect' },
  { code: 'ta', label: 'Tamil' },
  { code: 'ta-en', label: 'Tanglish (Tamil + English)' },
  { code: 'hi', label: 'Hindi' },
  { code: 'hi-en', label: 'Hinglish (Hindi + English)' },
  { code: 'en', label: 'English' },
  { code: 'te', label: 'Telugu' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'kn', label: 'Kannada' },
  { code: 'bn', label: 'Bengali' },
  { code: 'ko', label: 'Korean' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'ar', label: 'Arabic' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'de', label: 'German' },
  { code: 'ru', label: 'Russian' },
  { code: 'tr', label: 'Turkish' },
];

const GENERATION_STEPS = [
  { key: 'download', label: 'Downloading audio' },
  { key: 'demucs',   label: 'Isolating vocals (Demucs)' },
  { key: 'whisper',  label: 'Transcribing with Whisper' },
  { key: 'build',    label: 'Building LRC' },
];

const fmt = (s) => {
  if (s == null || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

// ─── Song Selector ─────────────────────────────────────────────────────────────

const SongSelector = ({ songs, loading, selected, onSelect, search, setSearch }) => (
  <div style={{
    width: 272, minWidth: 272,
    background: 'var(--a-bg3)',
    borderRight: '1px solid var(--a-border)',
    display: 'flex', flexDirection: 'column', height: '100%',
    borderRadius: '12px 0 0 12px', overflow: 'hidden',
  }}>
    <div style={{ padding: '12px 10px 10px', borderBottom: '1px solid var(--a-border)' }}>
      <div style={{ position: 'relative' }}>
        <FiSearch size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--a-faint)' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search songs…"
          style={{ ...iStyle, paddingLeft: 28, fontSize: 12 }}
          onFocus={e => e.target.style.borderColor = '#818cf8'}
          onBlur={e => e.target.style.borderColor = 'var(--a-border)'}
        />
      </div>
      <p style={{ margin: '7px 0 0', fontSize: 10, color: 'var(--a-faint)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, fontFamily: "'Syne',sans-serif" }}>
        {songs.length} tracks
      </p>
    </div>
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 6px' }}>
      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--a-faint)', fontSize: 12 }}>Loading songs…</div>
      ) : songs.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--a-faint)', fontSize: 12 }}>No songs found</div>
      ) : songs.map(raw => {
        const s = songDefaults(raw);
        const isActive = selected?.id === s.id;
        return (
          <div key={s.id} onClick={() => onSelect(raw)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px',
              borderRadius: 8, cursor: 'pointer', transition: 'all .13s',
              background: isActive ? 'rgba(129,140,248,.1)' : 'transparent',
              border: `1px solid ${isActive ? 'rgba(129,140,248,.2)' : 'transparent'}`,
              marginBottom: 2,
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--a-hover)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
          >
            <Cover src={s.cover_url} size={34} radius={6} fallback={<FiMusic size={12} style={{ color: 'var(--a-faint)' }} />} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: isActive ? 'var(--a-text)' : 'var(--a-text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.title}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 10, color: isActive ? 'var(--a-muted)' : 'var(--a-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.artist_name || 'Unknown Artist'}
              </p>
            </div>
            {isActive && <FiChevronRight size={11} style={{ color: '#818cf8', flexShrink: 0 }} />}
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Generation Steps Indicator ────────────────────────────────────────────────

const StepsIndicator = ({ activeStep }) => (
  <div style={{ width: '100%', maxWidth: 300, marginBottom: 20 }}>
    {GENERATION_STEPS.map((step, i) => {
      const isDone = i < activeStep;
      const isActive = i === activeStep;
      return (
        <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isDone ? 'rgba(16,185,129,.15)' : isActive ? 'rgba(129,140,248,.12)' : 'var(--a-bg3)',
            border: `1px solid ${isDone ? 'rgba(16,185,129,.4)' : isActive ? 'rgba(129,140,248,.4)' : 'var(--a-border)'}`,
            transition: 'all .3s',
          }}>
            {isDone ? (
              <FiCheck size={10} style={{ color: '#10b981' }} />
            ) : isActive ? (
              <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid var(--a-border3)', borderTop: '1.5px solid #818cf8', animation: 'spin 0.8s linear infinite' }} />
            ) : null}
          </div>
          <span style={{
            fontSize: 11, fontWeight: isActive ? 600 : 400,
            color: isDone ? '#10b981' : isActive ? '#818cf8' : 'var(--a-faint)',
            transition: 'color .3s',
          }}>
            {step.label}
          </span>
        </div>
      );
    })}
  </div>
);

// ─── Audio Player (Center Panel) ──────────────────────────────────────────────

const AudioPlayer = ({
  song, language, setLanguage, onGetLyrics, generating,
  audioRef, isPlaying, setIsPlaying, currentTime, duration,
  demucsStatus, userLyrics, setUserLyrics, genStep,
}) => {
  const s = song ? songDefaults(song) : null;
  const [showLyricsInput, setShowLyricsInput] = useState(false);

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
      padding: '20px 24px', background: 'var(--a-bg)', justifyContent: 'center',
      minHeight: 0, overflowY: 'auto',
    }}>
      {!song ? (
        <div style={{ textAlign: 'center', maxWidth: 300 }}>
          <div style={{
            width: 68, height: 68, borderRadius: 16, margin: '0 auto 16px',
            background: 'rgba(129,140,248,.08)',
            border: '1px solid rgba(129,140,248,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FiMusic size={26} style={{ color: 'var(--a-faint)' }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--a-muted)', margin: '0 0 6px', fontFamily: "'Syne', sans-serif" }}>
            Select a Song
          </p>
          <p style={{ fontSize: 12, color: 'var(--a-faint)', margin: 0, lineHeight: 1.6 }}>
            Choose a track from the left panel to start generating lyrics with AI
          </p>
        </div>
      ) : (
        <>
          {/* Demucs status badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, marginBottom: 16,
            padding: '4px 10px', borderRadius: 20,
            background: demucsStatus === 'online'
              ? 'rgba(16,185,129,.08)' : demucsStatus === 'offline'
              ? 'rgba(239,68,68,.06)' : 'var(--a-bg3)',
            border: `1px solid ${demucsStatus === 'online' ? 'rgba(16,185,129,.25)' : demucsStatus === 'offline' ? 'rgba(239,68,68,.2)' : 'var(--a-border)'}`,
          }}>
            {demucsStatus === 'online' ? (
              <FiWifi size={10} style={{ color: '#10b981' }} />
            ) : demucsStatus === 'offline' ? (
              <FiWifiOff size={10} style={{ color: '#ef4444' }} />
            ) : (
              <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid var(--a-border3)', borderTop: '1.5px solid var(--a-muted)', animation: 'spin 1s linear infinite' }} />
            )}
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '.05em',
              color: demucsStatus === 'online' ? '#10b981' : demucsStatus === 'offline' ? '#ef4444' : 'var(--a-faint)',
            }}>
              {demucsStatus === 'online' ? 'Demucs Ready' : demucsStatus === 'offline' ? 'Demucs Offline' : 'Checking Demucs…'}
            </span>
          </div>

          {/* Cover Art */}
          <div style={{
            width: 148, height: 148, borderRadius: 14, overflow: 'hidden',
            background: 'var(--a-bg3)', border: '1px solid var(--a-border)', marginBottom: 18,
            boxShadow: '0 16px 48px rgba(0,0,0,.4)', position: 'relative',
          }}>
            {s.cover_url ? (
              <img src={s.cover_url} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiMusic size={38} style={{ color: 'var(--a-border3)' }} />
              </div>
            )}
            {isPlaying && (
              <div style={{
                position: 'absolute', inset: -2, borderRadius: 16,
                border: '2px solid rgba(129,140,248,.35)',
                animation: 'pulse 2s ease-in-out infinite', pointerEvents: 'none',
              }} />
            )}
          </div>

          {/* Song Info */}
          <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: 'var(--a-text)', fontFamily: "'Syne', sans-serif", textAlign: 'center', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.title}
          </p>
          <p style={{ margin: '0 0 18px', fontSize: 12, color: 'var(--a-muted)', textAlign: 'center' }}>
            {s.artist_name || 'Unknown Artist'}
          </p>

          {/* Progress Bar */}
          <div style={{ width: '100%', maxWidth: 340, marginBottom: 10 }}>
            <div onClick={handleSeek} style={{ height: 4, borderRadius: 2, background: 'var(--a-border)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 2, width: `${progress}%`, background: 'linear-gradient(90deg, #818cf8, #a78bfa)', transition: 'width .1s linear' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 10, color: 'var(--a-faint)', fontVariantNumeric: 'tabular-nums' }}>{fmt(currentTime)}</span>
              <span style={{ fontSize: 10, color: 'var(--a-faint)', fontVariantNumeric: 'tabular-nums' }}>{fmt(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <button onClick={() => skip(-10)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--a-muted)', transition: 'color .12s', padding: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--a-text2)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--a-muted)'}>
              <FiSkipBack size={17} />
            </button>
            <button onClick={togglePlay}
              style={{ width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #818cf8, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px rgba(129,140,248,.3)', transition: 'transform .12s, box-shadow .12s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 26px rgba(129,140,248,.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(129,140,248,.3)'; }}
            >
              {isPlaying ? <FiPause size={19} style={{ color: '#fff' }} /> : <FiPlay size={19} style={{ color: '#fff', marginLeft: 2 }} />}
            </button>
            <button onClick={() => skip(10)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--a-muted)', transition: 'color .12s', padding: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--a-text2)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--a-muted)'}>
              <FiSkipForward size={17} />
            </button>
          </div>

          {/* Language Selector */}
          <div style={{ marginBottom: 12, width: '100%', maxWidth: 280 }}>
            <label style={{ fontSize: 10, color: 'var(--a-muted)', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5, fontFamily: "'Syne',sans-serif" }}>
              <FiGlobe size={10} /> Language Hint
            </label>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              style={{ ...iStyle, fontSize: 12 }}
              onFocus={e => e.target.style.borderColor = '#818cf8'}
              onBlur={e => e.target.style.borderColor = 'var(--a-border)'}
            >
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>

          {/* Optional: Paste your own lyrics */}
          <div style={{ width: '100%', maxWidth: 280, marginBottom: 16 }}>
            <button
              onClick={() => setShowLyricsInput(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                border: '1px solid var(--a-border)', borderRadius: 6, cursor: 'pointer',
                padding: '6px 10px', color: 'var(--a-muted)', fontSize: 11, fontWeight: 600,
                fontFamily: 'inherit', width: '100%', transition: 'all .12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--a-border3)'; e.currentTarget.style.color = 'var(--a-text2)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--a-border)'; e.currentTarget.style.color = 'var(--a-muted)'; }}
            >
              <FiAlignLeft size={11} />
              <span style={{ flex: 1, textAlign: 'left' }}>
                {userLyrics ? 'Lyrics provided (alignment mode)' : 'Paste your own lyrics (optional)'}
              </span>
              {showLyricsInput ? <FiChevronUp size={11} /> : <FiChevronDown size={11} />}
            </button>

            {showLyricsInput && (
              <div style={{ marginTop: 8 }}>
                <div style={{ padding: '5px 8px', borderRadius: 5, marginBottom: 6, background: 'rgba(129,140,248,.06)', border: '1px solid rgba(129,140,248,.15)', fontSize: 10, color: '#818cf8', lineHeight: 1.5 }}>
                  Paste lyrics line-by-line. Whisper will timestamp each line.
                </div>
                <textarea
                  value={userLyrics}
                  onChange={e => setUserLyrics(e.target.value)}
                  placeholder={"Line one of the song\nLine two of the song\n…"}
                  rows={5}
                  style={{ ...iStyle, resize: 'vertical', fontSize: 12, lineHeight: 1.7, borderRadius: 6, fontFamily: "'JetBrains Mono', monospace" }}
                  onFocus={e => e.target.style.borderColor = '#818cf8'}
                  onBlur={e => e.target.style.borderColor = 'var(--a-border)'}
                />
                {userLyrics && (
                  <button onClick={() => setUserLyrics('')}
                    style={{ marginTop: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--a-faint)', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3, padding: 0, transition: 'color .12s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--a-faint)'}
                  >
                    <FiX size={10} /> Clear lyrics
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Generation steps or Get Lyrics button */}
          {generating ? (
            <div style={{ width: '100%', maxWidth: 280 }}>
              <StepsIndicator activeStep={genStep} />
              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--a-muted)', fontStyle: 'italic' }}>
                {demucsStatus === 'online' ? 'Vocal isolation + transcription in progress…' : 'Transcribing audio…'}
              </div>
            </div>
          ) : (
            <button onClick={onGetLyrics} disabled={generating}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 10,
                border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
                color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: "'Syne', sans-serif",
                letterSpacing: '-0.01em', boxShadow: '0 4px 24px rgba(129,140,248,.3)',
                transition: 'all .2s', width: '100%', maxWidth: 280, justifyContent: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(129,140,248,.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(129,140,248,.3)'; }}
            >
              <FiZap size={16} />
              {userLyrics ? 'Align Lyrics' : 'Generate Lyrics'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

// ─── LRC parser ────────────────────────────────────────────────────────────────

const LRC_RE = /^\[(\d{1,2}):(\d{2}(?:[.:]\d+)?)\]\s?(.*)/;

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

  const parsed = React.useMemo(() => parseLrcLines(lrc), [lrc]);
  const activeIdx = findActiveLine(parsed, currentTime);

  useEffect(() => {
    if (activeLineRef.current && syncScrollRef.current && isPlaying && !editMode) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIdx, isPlaying, editMode]);

  const handleLineClick = (time) => {
    if (audioRef?.current && time !== null) {
      audioRef.current.currentTime = time;
      if (!isPlaying) audioRef.current.play();
    }
  };

  const isMusic = (text) => /^♪/.test(text?.trim());

  return (
    <div style={{
      width: 340, minWidth: 340,
      background: 'var(--a-bg3)',
      borderLeft: '1px solid var(--a-border)',
      display: 'flex', flexDirection: 'column', height: '100%',
      borderRadius: '0 12px 12px 0', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--a-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--a-text)', fontFamily: "'Syne', sans-serif" }}>
            Lyrics Editor
          </h3>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {lrc && (
              <button onClick={() => setEditMode(!editMode)}
                style={{
                  padding: '3px 9px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                  fontFamily: 'inherit', cursor: 'pointer', transition: 'all .12s',
                  background: editMode ? 'rgba(129,140,248,.1)' : 'rgba(129,140,248,.08)',
                  border: `1px solid ${editMode ? 'rgba(129,140,248,.3)' : 'rgba(129,140,248,.2)'}`,
                  color: '#818cf8', letterSpacing: '.04em', textTransform: 'uppercase',
                }}>
                {editMode ? 'Sync View' : 'Edit'}
              </button>
            )}
            {lrcMeta?.language && (
              <span style={{
                padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                background: lrcMeta.isCodeMixed ? 'rgba(251,191,36,.08)' : 'rgba(52,211,153,.08)',
                border: `1px solid ${lrcMeta.isCodeMixed ? 'rgba(251,191,36,.3)' : 'rgba(52,211,153,.25)'}`,
                color: lrcMeta.isCodeMixed ? '#fbbf24' : '#34d399',
                fontFamily: 'inherit',
              }}>
                {lrcMeta.language}{lrcMeta.isCodeMixed ? '+en' : ''}
              </span>
            )}
          </div>
        </div>
        {lrcMeta && (
          <div style={{ display: 'flex', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: 'var(--a-faint)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <FiClock size={9} />{lrcMeta.wordCount} words
            </span>
            <span style={{ fontSize: 10, color: 'var(--a-faint)' }}>{lineCount} lines</span>
            {lrcMeta.lineLimits && (
              <span style={{ fontSize: 10, color: 'var(--a-faint)' }} title="Auto-detected words per line">
                {lrcMeta.lineLimits.MIN_LINE_WORDS}–{lrcMeta.lineLimits.MAX_LINE_WORDS} w/line
              </span>
            )}
            {lrcMeta.demucsUsed && (
              <span style={{ fontSize: 10, color: '#10b981', display: 'flex', alignItems: 'center', gap: 3 }}>
                <FiCheck size={9} /> Demucs
              </span>
            )}
            {lrcMeta.quality != null && (
              <span style={{ fontSize: 10, color: lrcMeta.quality >= 0.7 ? '#10b981' : lrcMeta.quality >= 0.5 ? '#fbbf24' : '#f87171' }} title="Transcription confidence score">
                {Math.round(lrcMeta.quality * 100)}% confident
              </span>
            )}
            {lrcMeta.passes > 1 && (
              <span style={{ fontSize: 10, color: '#a78bfa' }} title="Two-pass refinement was used">
                {lrcMeta.passes}-pass
              </span>
            )}
            {lrcMeta.vocalRegions > 0 && (
              <span style={{ fontSize: 10, color: 'var(--a-faint)' }} title="Distinct vocal regions detected">
                {lrcMeta.vocalRegions} region{lrcMeta.vocalRegions !== 1 ? 's' : ''}
              </span>
            )}
            {lrcMeta.unmatched > 0 && (
              <span style={{ fontSize: 10, color: '#f59e0b' }}>
                {lrcMeta.unmatched} unmatched
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '10px 10px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!lrc ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <FiEdit3 size={26} style={{ color: 'var(--a-border3)', marginBottom: 12 }} />
            <p style={{ fontSize: 12, color: 'var(--a-faint)', textAlign: 'center', lineHeight: 1.7 }}>
              Generated lyrics will appear here.<br />Click a line to seek, edit before saving.
            </p>
          </div>
        ) : editMode ? (
          <>
            <div style={{ padding: '5px 9px', borderRadius: 6, marginBottom: 8, background: 'rgba(129,140,248,.05)', border: '1px solid rgba(129,140,248,.12)', fontSize: 10, color: '#818cf8', lineHeight: 1.4 }}>
              <strong>Edit Mode</strong> — Modify timestamps and lyrics directly. Format: <code>[MM:SS.cc] Text</code>
            </div>
            <textarea
              value={lrc || ''}
              onChange={e => setLrc(e.target.value)}
              style={{ ...iStyle, flex: 1, resize: 'none', lineHeight: 1.9, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 12, borderRadius: 8, minHeight: 0 }}
              onFocus={e => e.target.style.borderColor = '#818cf8'}
              onBlur={e => e.target.style.borderColor = 'var(--a-border)'}
              placeholder="[00:12.50] First line&#10;[00:16.00] Second line…"
            />
          </>
        ) : (
          <div ref={syncScrollRef} style={{ flex: 1, overflowY: 'auto', borderRadius: 8, background: 'var(--a-bg)', border: '1px solid var(--a-border)', padding: '8px 0' }}>
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
                    padding: '5px 13px', cursor: line.time !== null ? 'pointer' : 'default',
                    transition: 'all .2s ease',
                    background: isActive ? 'rgba(129,140,248,.08)' : 'transparent',
                    borderLeft: isActive ? '3px solid #818cf8' : '3px solid transparent',
                    position: 'relative',
                  }}
                >
                  {line.time !== null && (
                    <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: isActive ? '#818cf8' : 'var(--a-border3)', fontWeight: 600, letterSpacing: '.03em', transition: 'color .2s', marginRight: 7 }}>
                      {fmt(line.time)}
                    </span>
                  )}
                  <span style={{
                    fontSize: isMusicLine ? 11 : 13,
                    fontWeight: isActive ? 700 : isPast ? 400 : 500,
                    color: isMusicLine
                      ? (isActive ? '#a78bfa' : 'var(--a-border3)')
                      : isActive ? 'var(--a-text)' : isPast ? 'var(--a-border3)' : 'var(--a-muted)',
                    fontStyle: isMusicLine ? 'italic' : 'normal',
                    transition: 'all .25s ease',
                    letterSpacing: isActive ? '0.01em' : '0',
                  }}>
                    {line.text}
                  </span>
                  {isActive && isPlaying && (
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 2, alignItems: 'flex-end', height: 12 }}>
                      {[0, 1, 2].map(b => (
                        <span key={b} style={{ width: 2, borderRadius: 1, background: '#818cf8', animation: `eqBar 0.6s ease-in-out ${b * 0.15}s infinite alternate` }} />
                      ))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--a-border)', display: 'flex', gap: 7, alignItems: 'center' }}>
        {lrc && (
          <>
            <button onClick={() => setLrc('')}
              style={{ padding: '6px 11px', borderRadius: 6, background: 'transparent', border: '1px solid var(--a-border)', cursor: 'pointer', color: 'var(--a-muted)', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', transition: 'all .12s', display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.color = '#f87171'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--a-border)'; e.currentTarget.style.color = 'var(--a-muted)'; }}
            >
              <FiX size={11} /> Clear
            </button>
            <button onClick={() => {
              const blob = new Blob([lrc], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${song?.title || 'lyrics'}.lrc`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success('LRC downloaded');
            }}
              style={{ padding: '6px 11px', borderRadius: 6, background: 'transparent', border: '1px solid var(--a-border)', cursor: 'pointer', color: 'var(--a-muted)', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', transition: 'all .12s', display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#818cf8'; e.currentTarget.style.color = '#818cf8'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--a-border)'; e.currentTarget.style.color = 'var(--a-muted)'; }}
            >
              <FiDownload size={11} /> .LRC
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={onSave} disabled={saving || !song}
              style={{
                padding: '7px 16px', borderRadius: 7, border: 'none', cursor: saving ? 'wait' : 'pointer',
                background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s',
                boxShadow: '0 2px 12px rgba(16,185,129,.2)', opacity: (saving || !song) ? 0.5 : 1,
              }}
              onMouseEnter={e => { if (!saving && song) e.currentTarget.style.boxShadow = '0 4px 18px rgba(16,185,129,.35)'; }}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(16,185,129,.2)'}
            >
              {saving ? (
                <>
                  <div style={{ width: 11, height: 11, border: '2px solid rgba(255,255,255,.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Saving…
                </>
              ) : (
                <><FiSave size={12} /> Save to Song</>
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
  const [userLyrics, setUserLyrics] = useState('');

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [lrc, setLrc] = useState('');
  const [lrcMeta, setLrcMeta] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [demucsStatus, setDemucsStatus] = useState('checking');

  // Check Demucs health on mount and when a song is selected
  const checkDemucs = useCallback(async () => {
    setDemucsStatus('checking');
    try {
      await fetch('http://127.0.0.1:8005/health', { signal: AbortSignal.timeout(2500) });
      setDemucsStatus('online');
    } catch {
      setDemucsStatus('offline');
    }
  }, []);

  useEffect(() => { checkDemucs(); }, [checkDemucs]);

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

  const handleSelect = useCallback((song) => {
    setSelected(song);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  // Simulate step progression during generation
  const startStepTimer = useCallback((hasDemucs) => {
    setGenStep(0);
    const timings = hasDemucs
      ? [1200, 3000, 8000]
      : [1200, 1400, 6000];
    let step = 0;
    const timers = [];
    timings.forEach((delay, i) => {
      timers.push(setTimeout(() => setGenStep(i + 1), delay));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleGetLyrics = async () => {
    if (!selected) return;
    setGenerating(true);
    setLrc('');
    setLrcMeta(null);

    const cleanup = startStepTimer(demucsStatus === 'online');

    try {
      const { data } = await api.post('/lyricgen', {
        songId: selected.id,
        language: language || undefined,
        lyrics: userLyrics.trim() || undefined,
      });

      setGenStep(4);
      setLrc(data.lrc || '');
      setLrcMeta({
        language: data.language,
        isCodeMixed: data.isCodeMixed,
        demucsUsed: data.demucsUsed,
        wordCount: data.wordCount,
        unmatched: data.unmatched || 0,
        lineLimits: data.lineLimits,
        quality: data.quality,
        passes: data.passes,
        vocalRegions: data.vocalRegions,
      });

      const modeBadge = data.demucsUsed ? ' · Demucs' : '';
      const codeBadge = data.isCodeMixed ? ` · ${data.language}+en` : ` · ${data.language}`;
      const qualityBadge = data.quality != null ? ` · ${Math.round(data.quality * 100)}% quality` : '';
      const passesBadge = data.passes > 1 ? ` · ${data.passes} passes` : '';
      toast.success(`Done — ${data.wordCount} words${codeBadge}${modeBadge}${qualityBadge}${passesBadge}`);

      checkDemucs();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Generation failed';
      toast.error(msg);
    } finally {
      cleanup();
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selected || !lrc) return;
    setSaving(true);
    try {
      await api.patch(`/songs/${selected.id}`, { lyrics: lrc });
      toast.success('Lyrics saved!');
    } catch {
      toast.error('Failed to save lyrics');
    } finally {
      setSaving(false);
    }
  };

  const audioSrc = selected ? `${API_CONFIG.MUSIC_URL}/stream/${selected.id}` : '';

  return (
    <div className="a-lyrics">
      <style>{`
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:.35} 50%{opacity:1} }
        @keyframes eqBar { 0%{height:3px} 100%{height:12px} }
        [data-admin-theme="dark"] .a-lyrics { --acc:#818cf8; }
        [data-admin-theme="light"] .a-lyrics { --acc:#4f46e5; }
      `}</style>

      <PageHeader
        title="Lyrics Creator"
        subtitle="Demucs vocal isolation → Groq Whisper transcription → LRC"
      />

      {selected && (
        <audio ref={audioRef} src={audioSrc} preload="metadata" crossOrigin="anonymous" />
      )}

      <div style={{
        display: 'flex',
        border: '1px solid var(--a-border)',
        borderRadius: 12,
        overflow: 'hidden',
        background: 'var(--a-bg)',
        height: 'calc(100vh - 200px)',
      }}>
        <SongSelector
          songs={filtered} loading={loading} selected={selected}
          onSelect={handleSelect} search={search} setSearch={setSearch}
        />
        <AudioPlayer
          song={selected} language={language} setLanguage={setLanguage}
          onGetLyrics={handleGetLyrics} generating={generating}
          audioRef={audioRef} isPlaying={isPlaying} setIsPlaying={setIsPlaying}
          currentTime={currentTime} duration={duration}
          demucsStatus={demucsStatus}
          userLyrics={userLyrics} setUserLyrics={setUserLyrics}
          genStep={genStep}
        />
        <LyricsEditor
          lrc={lrc} setLrc={setLrc} song={selected}
          onSave={handleSave} saving={saving} lrcMeta={lrcMeta}
          currentTime={currentTime} isPlaying={isPlaying} audioRef={audioRef}
        />
      </div>
    </div>
  );
};

export default AdminLyricsCreator;
