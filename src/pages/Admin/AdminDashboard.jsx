import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  FiUsers, FiMusic, FiMic, FiDisc, FiAlertTriangle,
  FiPlay, FiArrowRight, FiZap, FiRadio, FiFlag, FiActivity,
  FiTag, FiBell, FiHeart, FiSearch, FiEye, FiClock, FiWifi, FiList,
  FiRefreshCw, FiShield, FiTrendingUp, FiBookOpen, FiAlertCircle, FiCpu
} from 'react-icons/fi';

/* ── count-up hook ── */
const useCountUp = (target, duration = 1000) => {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (target == null) return;
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setVal(Math.floor(target * e));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return target == null ? null : val;
};

/* ── tiny SVG waveform decoration ── */
const Wave = ({ color }) => (
  <svg viewBox="0 0 120 28" fill="none" style={{ width: '100%', height: 20, display: 'block' }} aria-hidden="true" preserveAspectRatio="none">
    <polyline
      points="0,22 8,10 16,18 24,6 32,14 40,4 48,16 56,8 64,20 72,6 80,16 88,10 96,18 104,8 112,14 120,10"
      stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" fill="none" opacity="0.4"
    />
    <polyline
      points="0,22 8,10 16,18 24,6 32,14 40,4 48,16 56,8 64,20 72,6 80,16 88,10 96,18 104,8 112,14 120,10"
      stroke={color} strokeWidth="0.5" strokeLinejoin="round" strokeLinecap="round" fill="none" opacity="0.12"
      transform="translate(0,6)"
    />
  </svg>
);

/* ── stat card ── */
const CARDS_META = [
  { key: 'totalUsers',     label: 'Total Users',    sublabel: 'registered',   icon: FiUsers,         dark: '#60a5fa', light: '#2563eb', glyph: 'U', wide: true  },
  { key: 'totalSongs',     label: 'Tracks',         sublabel: 'in library',   icon: FiMusic,         dark: '#f472b6', light: '#db2777', glyph: 'T', wide: false },
  { key: 'totalArtists',   label: 'Artists',        sublabel: 'active',       icon: FiMic,           dark: '#a78bfa', light: '#7c3aed', glyph: 'A', wide: false },
  { key: 'totalPlays',     label: 'Total Streams',  sublabel: 'all time',     icon: FiActivity,      dark: '#34d399', light: '#059669', glyph: 'S', wide: true  },
  { key: 'totalAlbums',    label: 'Albums',         sublabel: 'published',    icon: FiDisc,          dark: '#fb923c', light: '#ea580c', glyph: 'L', wide: false },
  { key: 'pendingReports', label: 'Reports',        sublabel: 'pending',      icon: FiAlertTriangle, dark: '#f87171', light: '#dc2626', glyph: 'R', wide: false },
];

const TRENDS = [12, 5, 8, 24, 3, -2];

/* ── secondary stat card metadata ── */
const SECONDARY_CARDS_META = [
  { key: 'totalGenres',          label: 'Genres',            sublabel: 'catalogued',    icon: FiTag,      dark: '#38bdf8', light: '#0284c7', glyph: 'G', wide: false },
  { key: 'totalAnnouncements',   label: 'Announcements',     sublabel: 'published',     icon: FiBell,     dark: '#fbbf24', light: '#d97706', glyph: 'N', wide: false },
  { key: 'totalArtistFollows',   label: 'Artist Follows',    sublabel: 'total',         icon: FiHeart,    dark: '#f472b6', light: '#db2777', glyph: 'F', wide: false },
  { key: 'totalSearches',        label: 'Searches',          sublabel: 'all time',      icon: FiSearch,   dark: '#a78bfa', light: '#7c3aed', glyph: 'Q', wide: false },
  { key: 'totalAdImpressions',   label: 'Ad Impressions',    sublabel: 'served',        icon: FiEye,      dark: '#34d399', light: '#059669', glyph: 'I', wide: false },
  { key: 'totalListeningMinutes',label: 'Listening Minutes', sublabel: 'streamed',      icon: FiClock,    dark: '#fb923c', light: '#ea580c', glyph: 'M', wide: false },
  { key: 'activeUserSessions',   label: 'Active Sessions',   sublabel: 'right now',     icon: FiWifi,     dark: '#60a5fa', light: '#2563eb', glyph: 'V', wide: false },
  { key: 'albumSongEntries',     label: 'Album Entries',     sublabel: 'song–album',    icon: FiList,     dark: '#c084fc', light: '#9333ea', glyph: 'E', wide: false },
];

const SECONDARY_TRENDS = [7, 15, 11, 32, 4, 9, 18, 6];

const StatCard = ({ meta, value, index, trendValue }) => {
  const count = useCountUp(value, 900 + index * 70);
  const rawTrend = trendValue != null ? trendValue : TRENDS[index] ?? 0;
  const trendUp = rawTrend >= 0;
  const trend = Math.abs(rawTrend);

  return (
    <div
      className={`sc ${meta.wide ? 'sc-wide' : ''}`}
      style={{ '--dk': meta.dark, '--lk': meta.light, animationDelay: `${index * 65}ms` }}
    >
      {/* ghost letter */}
      <span className="sc-ghost" aria-hidden="true">{meta.glyph}</span>

      <div className="sc-inner">
        <div className="sc-row1">
          <div className="sc-icon" aria-hidden="true"><meta.icon size={12} /></div>
          <span className={`sc-pill ${trendUp ? 'pill-up' : 'pill-dn'}`} aria-label={`${trendUp ? 'Up' : 'Down'} ${trend}%`}>
            <svg width="7" height="7" viewBox="0 0 8 8" fill="none" aria-hidden="true">
              <path d={trendUp ? 'M1 7L7 1M7 1H2M7 1V6' : 'M1 1L7 7M7 7H2M7 7V2'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {trend}%
          </span>
        </div>

        <div className="sc-num">{count != null ? count.toLocaleString() : '—'}</div>

        <div className="sc-labels">
          <span className="sc-label">{meta.label}</span>
          <span className="sc-sub">{meta.sublabel}</span>
        </div>

        {meta.wide && (
          <div className="sc-wave"><Wave color="var(--dk)" /></div>
        )}
      </div>

      <div className="sc-bar-track" aria-hidden="true">
        <div className="sc-bar-fill" />
      </div>
    </div>
  );
};

/* ── song row ── */
const SongRow = ({ rank, song, maxPlays, index }) => {
  const pct = maxPlays > 0 ? (song.play_count / maxPlays) * 100 : 0;
  return (
    <div className="sr" style={{ animationDelay: `${index * 55}ms` }}>
      <span className="sr-bg-rank" aria-hidden="true">{String(rank).padStart(2, '0')}</span>
      <span className="sr-num" aria-label={`Rank ${rank}`}>{rank}</span>
      <div className="sr-art">
        {song.cover_url
          ? <img src={song.cover_url} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <FiMusic size={12} aria-hidden="true" style={{ color: 'var(--a-muted)' }} />}
      </div>
      <div className="sr-info">
        <p className="sr-title">{song.title}</p>
        <p className="sr-artist">{song.artist_name || 'Unknown'}</p>
      </div>
      <div className="sr-right" aria-label={`${song.play_count?.toLocaleString()} plays`}>
        <div className="sr-track">
          <div className="sr-fill" style={{ '--w': `${pct}%` }} aria-hidden="true" />
        </div>
        <span className="sr-plays">{song.play_count?.toLocaleString()}</span>
      </div>
    </div>
  );
};

/* ── AI insight card config ── */
const AI_CARDS = [
  {
    key: 'health',
    title: 'Platform Health',
    icon: FiShield,
    dark: '#34d399',
    light: '#059669',
    model: 'llama-3.3-70b',
    render: (d) => ({
      badge: d.label,
      badgeColor: { Excellent: '#34d399', Good: '#60a5fa', Fair: '#fbbf24', Poor: '#f87171' }[d.label] || '#a78bfa',
      meta: `Score: ${d.score}/100`,
      text: d.insight,
    }),
  },
  {
    key: 'growth',
    title: 'Growth Outlook',
    icon: FiTrendingUp,
    dark: '#60a5fa',
    light: '#2563eb',
    model: 'llama-3.1-8b',
    render: (d) => ({
      badge: d.outlook,
      badgeColor: { Bullish: '#34d399', Neutral: '#fbbf24', Bearish: '#f87171' }[d.outlook] || '#a78bfa',
      meta: `Confidence: ${d.confidence}%`,
      text: d.reason,
    }),
  },
  {
    key: 'content',
    title: 'Content Intelligence',
    icon: FiBookOpen,
    dark: '#a78bfa',
    light: '#7c3aed',
    model: 'llama-4-scout',
    render: (d) => ({
      badge: d.priority,
      badgeColor: { High: '#f87171', Medium: '#fbbf24', Low: '#34d399' }[d.priority] || '#60a5fa',
      meta: `Focus: ${d.category}`,
      text: d.action,
    }),
  },
  {
    key: 'risk',
    title: 'Risk Assessment',
    icon: FiAlertCircle,
    dark: '#fb923c',
    light: '#ea580c',
    model: 'llama-3.1-8b',
    render: (d) => ({
      badge: d.severity,
      badgeColor: { High: '#f87171', Medium: '#fbbf24', Low: '#34d399' }[d.severity] || '#60a5fa',
      meta: `Area: ${d.area}`,
      text: d.risk,
    }),
  },
];

/* ── main ── */
const AdminDashboard = ({ api }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchAiInsights = useCallback(async (force = false) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const { data } = await api.get(`/ai-insights${force ? '?force=true' : ''}`);
      setAiInsights(data);
      setLastRefreshed(new Date(data.generatedAt));
      if (data.rateLimited) {
        const mins = data.retryAfter ? Math.ceil(data.retryAfter / 60) : 60;
        setAiError(`Rate limit reached (10/hr). Showing cached data. Resets in ~${mins} min.`);
      }
    } catch (e) {
      const msg = e?.response?.data?.error;
      setAiError(msg || 'Could not reach AI service');
    } finally {
      setAiLoading(false);
    }
  }, [api]);

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get('/stats'); setStats(data); }
      catch { /* silent */ }
      finally { setLoading(false); }
    })();
    fetchAiInsights();
  }, [api, fetchAiInsights]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const maxPlays = stats?.topSongs?.[0]?.play_count || 1;
  const pad = (n) => String(n).padStart(2, '0');
  const hh = pad(time.getHours());
  const mm = pad(time.getMinutes());
  const ss = pad(time.getSeconds());

  const ACTIONS = [
    { label: 'Add new song',   href: '/admin/songs',         icon: FiMusic,  dk: '#f472b6', lk: '#db2777' },
    { label: 'Add artist',     href: '/admin/artists',       icon: FiMic,    dk: '#a78bfa', lk: '#7c3aed' },
    { label: 'New broadcast',  href: '/admin/announcements', icon: FiRadio,  dk: '#34d399', lk: '#059669' },
    { label: 'Review reports', href: '/admin/reports',       icon: FiFlag,   dk: '#f87171', lk: '#dc2626' },
  ];

  const HEALTH = [
    { label: 'Database', ok: true  },
    { label: 'Storage',  ok: true  },
    { label: 'Email',    ok: true  },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

        /* ── theme-local tokens ─────────────────── */
        [data-admin-theme="dark"]  .db { --scan:0.025; --card-hover:#111117; --num-op:1; }
        [data-admin-theme="light"] .db { --scan:0;     --card-hover:#f0f4ff; --num-op:1; }

        /* ── shell ─────────────────────────────── */
        .db { font-family:'Inter',system-ui,sans-serif; color:var(--a-text); position:relative; }
        .db-wrap { display:flex; flex-direction:column; gap:18px; }

        /* scanline overlay — dark only */
        .db::after {
          content:''; position:fixed; inset:0; pointer-events:none; z-index:9999;
          background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,var(--scan,0)) 2px,rgba(0,0,0,var(--scan,0)) 4px);
        }

        /* ── HEADER ─────────────────────────────── */
        .db-header {
          display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:14px;
          padding-bottom:16px; border-bottom:1px solid var(--a-border2);
        }

        .db-eyebrow {
          font-size:8px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase;
          color:var(--a-muted); margin-bottom:7px; display:flex; align-items:center; gap:8px;
        }
        .db-eyebrow::before { content:''; width:18px; height:1px; background:var(--a-border3); }

        .db-title {
          font-family:'Syne',sans-serif; font-size:clamp(20px,3vw,32px);
          font-weight:800; letter-spacing:-0.05em; line-height:0.95; margin:0;
          color:var(--a-text);
        }
        /* dark: first word gradient, light: plain ink + colored word */
        [data-admin-theme="dark"]  .db-title-main { background:linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.4)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        [data-admin-theme="light"] .db-title-main { color:#0f172a; }
        [data-admin-theme="dark"]  .db-title-hi   { background:linear-gradient(135deg,#60a5fa,#a78bfa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        [data-admin-theme="light"] .db-title-hi   { color:#2563eb; }

        .db-live {
          display:inline-flex; align-items:center; gap:6px; margin-top:10px;
          padding:4px 10px; border-radius:40px;
          background:rgba(52,211,153,0.08); border:1px solid rgba(52,211,153,0.2);
        }
        .db-live-dot { width:5px; height:5px; border-radius:50%; background:#34d399; box-shadow:0 0 6px #34d399; animation:pulse 1.5s ease-in-out infinite; flex-shrink:0; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.75)} }
        .db-live-txt { font-size:9px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:#34d399; }

        /* clock */
        .db-clock { text-align:right; padding-top:4px; }
        .db-time {
          font-family:'Syne',sans-serif; font-size:clamp(20px,2.5vw,30px);
          font-weight:800; letter-spacing:-0.07em; line-height:1; color:var(--a-text);
        }
        [data-admin-theme="dark"]  .db-sep { color:#60a5fa; }
        [data-admin-theme="light"] .db-sep { color:#2563eb; }
        .db-sec { font-size:0.45em; opacity:.45; }
        .db-date { font-size:10px; color:var(--a-muted); margin-top:3px; }

        /* ── SECTION RULE ───────────────────────── */
        .db-section-rule {
          display:flex; align-items:center; gap:8px; margin-bottom:8px;
          font-size:8px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:var(--a-faint);
        }
        .db-section-rule::after { content:''; flex:1; height:1px; background:var(--a-border2); }

        /* ── BENTO GRID ─────────────────────────── */
        .bento {
          display:grid;
          grid-template-columns:2fr 1fr 1fr;
          grid-template-rows:auto auto;
          gap:6px;
        }
        .sc-wide { grid-column:span 1; }
        /* first wide card = users at col 1, streams at col 1 row 2 */
        .sc:nth-child(1) { grid-column:1; grid-row:1; }
        .sc:nth-child(2) { grid-column:2; grid-row:1; }
        .sc:nth-child(3) { grid-column:3; grid-row:1; }
        .sc:nth-child(4) { grid-column:1; grid-row:2; }
        .sc:nth-child(5) { grid-column:2; grid-row:2; }
        .sc:nth-child(6) { grid-column:3; grid-row:2; }
        @media(max-width:900px) { .bento { grid-template-columns:1fr 1fr; } .sc:nth-child(n){ grid-column:auto; grid-row:auto; } }
        @media(max-width:520px) { .bento { grid-template-columns:1fr; } }

        /* ── SECONDARY METRICS GRID ─────────────── */
        .bento-secondary {
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:6px;
        }
        @media(max-width:1100px) { .bento-secondary { grid-template-columns:repeat(3,1fr); } }
        @media(max-width:760px)  { .bento-secondary { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:420px)  { .bento-secondary { grid-template-columns:1fr; } }

        /* ── STAT CARD ──────────────────────────── */
        .sc {
          position:relative; overflow:hidden;
          background:var(--a-bg2); border:1px solid var(--a-border);
          border-radius:12px; padding:14px 14px 0;
          transition:transform .18s,box-shadow .18s,background .18s;
          animation:fadeUp .5s ease both;
          cursor:default;
        }
        .sc:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.16),0 0 0 1px var(--a-border3); background:var(--card-hover); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }

        /* ghost glyph */
        .sc-ghost {
          position:absolute; bottom:-12px; right:2px;
          font-family:'Syne',sans-serif; font-size:72px; font-weight:800; letter-spacing:-0.07em; line-height:1;
          color:color-mix(in srgb, var(--dk) 7%, transparent);
          pointer-events:none; user-select:none;
        }
        [data-admin-theme="light"] .sc-ghost { color:color-mix(in srgb, var(--lk) 6%, transparent); }

        .sc-inner { position:relative; z-index:1; padding-bottom:12px; }

        .sc-row1 { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }

        .sc-icon {
          width:26px; height:26px; border-radius:7px; display:flex; align-items:center; justify-content:center;
          background:color-mix(in srgb, var(--dk) 14%, transparent);
          border:1px solid color-mix(in srgb, var(--dk) 22%, transparent);
          color:var(--dk);
        }
        [data-admin-theme="light"] .sc-icon { background:color-mix(in srgb, var(--lk) 10%, transparent); border-color:color-mix(in srgb, var(--lk) 22%, transparent); color:var(--lk); }

        .sc-pill { display:flex; align-items:center; gap:3px; font-size:9px; font-weight:700; padding:2px 6px; border-radius:20px; }
        .pill-up { color:#16a34a; background:rgba(22,163,74,.1); }
        .pill-dn { color:#dc2626; background:rgba(220,38,38,.1); }

        /* BIG number */
        .sc-num {
          font-family:'Syne',sans-serif; font-size:clamp(22px,3vw,32px); font-weight:800; letter-spacing:-0.06em; line-height:1;
          margin:0 0 4px;
        }
        [data-admin-theme="dark"]  .sc-num { background:linear-gradient(135deg, var(--dk), color-mix(in srgb, var(--dk) 55%, #fff)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        [data-admin-theme="light"] .sc-num { color:var(--lk); }

        .sc-labels { display:flex; align-items:baseline; gap:5px; }
        .sc-label { font-size:11px; font-weight:600; color:var(--a-text2); }
        .sc-sub { font-size:9px; color:var(--a-muted); text-transform:lowercase; }

        /* wave for wide cards */
        .sc-wave { margin-top:8px; opacity:.7; }

        /* bottom accent bar */
        .sc-bar-track { height:2px; background:var(--a-border); position:relative; }
        .sc-bar-fill { position:absolute; inset:0; right:30%; background:var(--dk); box-shadow:0 0 6px color-mix(in srgb, var(--dk) 50%, transparent); }
        [data-admin-theme="light"] .sc-bar-fill { background:var(--lk); box-shadow:none; }

        /* ── BOTTOM GRID ──────────────────────── */
        .db-bottom { display:grid; grid-template-columns:1fr 260px; gap:6px; align-items:start; }
        @media(max-width:1024px) { .db-bottom { grid-template-columns:1fr; } }

        /* ── PANEL SHARED ─────────────────────── */
        .panel { background:var(--a-bg2); border:1px solid var(--a-border); border-radius:12px; overflow:hidden; }

        .panel-head {
          display:flex; align-items:center; gap:8px;
          padding:10px 14px; border-bottom:1px solid var(--a-border2);
        }
        .panel-head-pip { width:6px; height:6px; border-radius:50%; background:var(--a-border3); flex-shrink:0; }
        .panel-head-title {
          font-family:'Syne',sans-serif; font-size:10px; font-weight:800;
          letter-spacing:0.12em; text-transform:uppercase; color:var(--a-text); margin:0; flex:1;
        }
        .panel-head-tag { font-size:9px; color:var(--a-faint); font-weight:500; }

        .panel-body { padding:4px 14px 12px; }

        /* ── SONG ROW ─────────────────────────── */
        .sr {
          position:relative; display:flex; align-items:center; gap:9px;
          padding:7px 0; border-bottom:1px solid var(--a-border2); overflow:hidden;
          animation:fadeUp .4s ease both; transition:background .15s;
        }
        .sr:last-child { border-bottom:none; }
        .sr:hover { background:var(--a-hover); margin:0 -14px; padding-left:14px; padding-right:14px; border-radius:6px; }

        .sr-bg-rank {
          position:absolute; right:-2px; top:50%; transform:translateY(-50%);
          font-family:'Syne',sans-serif; font-size:38px; font-weight:800; letter-spacing:-0.07em; line-height:1;
          color:var(--a-border2); pointer-events:none; user-select:none; z-index:0;
        }

        .sr-num { font-family:'Syne',sans-serif; font-size:10px; font-weight:800; color:var(--a-muted); width:18px; flex-shrink:0; z-index:1; }

        .sr-art {
          width:28px; height:28px; border-radius:6px; flex-shrink:0;
          background:var(--a-bg3); border:1px solid var(--a-border);
          overflow:hidden; display:flex; align-items:center; justify-content:center;
          z-index:1; transition:box-shadow .18s;
        }
        .sr:hover .sr-art { box-shadow:0 0 0 1.5px var(--a-border3); }

        .sr-info { flex:1; min-width:0; z-index:1; }
        .sr-title { margin:0; font-size:12px; font-weight:600; color:var(--a-text2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sr-artist { margin:1px 0 0; font-size:10px; color:var(--a-muted); }

        .sr-right { width:68px; flex-shrink:0; z-index:1; }
        .sr-track { height:2px; background:var(--a-border); border-radius:2px; overflow:hidden; }
        .sr-fill  { height:100%; width:var(--w); border-radius:2px; }
        [data-admin-theme="dark"]  .sr-fill { background:linear-gradient(90deg,#60a5fa,#a78bfa); }
        [data-admin-theme="light"] .sr-fill { background:linear-gradient(90deg,#2563eb,#7c3aed); }
        .sr-plays { display:block; font-size:9px; color:var(--a-muted); text-align:right; margin-top:3px; font-variant-numeric:tabular-nums; }

        /* ── QUICK ACTION BTNS ───────────────── */
        .qa {
          display:flex; align-items:center; gap:8px; padding:8px 10px;
          border-radius:8px; border:1px solid var(--a-border);
          background:transparent; cursor:pointer; text-decoration:none;
          transition:background .15s,border-color .15s,transform .15s,box-shadow .15s;
          margin-bottom:5px; position:relative; overflow:hidden;
        }
        .qa:last-child { margin-bottom:0; }
        .qa:hover { background:color-mix(in srgb,var(--qa-dk) 7%,transparent); border-color:color-mix(in srgb,var(--qa-dk) 30%,transparent); transform:translateX(3px); }
        [data-admin-theme="light"] .qa:hover { background:color-mix(in srgb,var(--qa-lk) 6%,transparent); border-color:color-mix(in srgb,var(--qa-lk) 25%,transparent); }
        .qa:focus-visible { outline:2px solid var(--qa-dk); outline-offset:2px; }
        .qa:hover .qa-arrow { opacity:1; transform:translateX(0); }

        .qa-ico {
          width:24px; height:24px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0;
          background:color-mix(in srgb,var(--qa-dk) 13%,transparent); border:1px solid color-mix(in srgb,var(--qa-dk) 22%,transparent); color:var(--qa-dk);
        }
        [data-admin-theme="light"] .qa-ico { background:color-mix(in srgb,var(--qa-lk) 10%,transparent); border-color:color-mix(in srgb,var(--qa-lk) 22%,transparent); color:var(--qa-lk); }
        .qa-lbl { flex:1; font-size:12px; color:var(--a-subtle); font-weight:500; }
        .qa-arrow { color:var(--a-muted); opacity:0; transform:translateX(-5px); transition:opacity .15s,transform .15s; flex-shrink:0; }

        /* ── HEALTH ──────────────────────────── */
        .hp-row { display:flex; align-items:center; justify-content:space-between; padding:7px 0; border-bottom:1px solid var(--a-border2); }
        .hp-row:last-child { border-bottom:none; }
        .hp-lbl { font-size:11px; font-weight:500; color:var(--a-subtle); }
        .hp-badge { display:flex; align-items:center; gap:4px; font-size:10px; font-weight:700; padding:3px 8px; border-radius:20px; }
        .hp-ok  { color:#16a34a; background:rgba(22,163,74,.1);  border:1px solid rgba(22,163,74,.2);  }
        .hp-err { color:#dc2626; background:rgba(220,38,38,.1); border:1px solid rgba(220,38,38,.2); }
        .hp-dot { width:5px; height:5px; border-radius:50%; animation:pulse 2s ease-in-out infinite; }
        .hp-ok .hp-dot  { background:#16a34a; box-shadow:0 0 5px #16a34a; }
        .hp-err .hp-dot { background:#dc2626; box-shadow:0 0 5px #dc2626; }

        /* ── SKELETON ────────────────────────── */
        .sk { border-radius:6px; animation:shimmer 1.4s ease-in-out infinite; }
        [data-admin-theme="dark"]  .sk { background:rgba(255,255,255,0.06); }
        [data-admin-theme="light"] .sk { background:rgba(0,0,0,0.07); }
        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.85} }

        /* ── right col ───────────────────────── */
        .right-col { display:flex; flex-direction:column; gap:8px; }

        /* ── AI SECTION HEADER ───────────────── */
        .ai-header {
          display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; flex-wrap:wrap; gap:8px;
        }
        .ai-header-left { display:flex; align-items:center; gap:10px; }
        .ai-cpu-icon {
          width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center;
          background:linear-gradient(135deg,rgba(167,139,250,.18),rgba(96,165,250,.12));
          border:1px solid rgba(167,139,250,.3); color:#a78bfa; flex-shrink:0;
        }
        [data-admin-theme="light"] .ai-cpu-icon { background:rgba(124,58,237,.09); border-color:rgba(124,58,237,.2); color:#7c3aed; }
        .ai-section-label {
          font-size:8px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:var(--a-faint);
          display:flex; align-items:center; gap:8px;
        }
        .ai-section-label::after { content:''; flex:1; height:1px; background:var(--a-border2); min-width:40px; }
        .ai-section-title {
          font-family:'Syne',sans-serif; font-size:11px; font-weight:800;
          letter-spacing:0.08em; text-transform:uppercase; color:var(--a-text2); margin:0;
        }

        /* ── REFRESH BUTTON ──────────────────── */
        .ai-refresh-btn {
          display:inline-flex; align-items:center; gap:5px;
          padding:5px 12px; border-radius:20px; font-size:10px; font-weight:700;
          letter-spacing:0.06em; text-transform:uppercase; cursor:pointer; border:none;
          background:rgba(167,139,250,.12); border:1px solid rgba(167,139,250,.25); color:#a78bfa;
          transition:background .18s,border-color .18s,transform .15s,box-shadow .15s;
        }
        [data-admin-theme="light"] .ai-refresh-btn { background:rgba(124,58,237,.08); border-color:rgba(124,58,237,.2); color:#7c3aed; }
        .ai-refresh-btn:hover:not(:disabled) { background:rgba(167,139,250,.2); border-color:rgba(167,139,250,.45); transform:translateY(-1px); box-shadow:0 4px 12px rgba(167,139,250,.2); }
        .ai-refresh-btn:focus-visible { outline:2px solid #a78bfa; outline-offset:2px; }
        .ai-refresh-btn:disabled { opacity:.5; cursor:not-allowed; }
        .ai-refresh-btn svg { flex-shrink:0; }
        .ai-spin { animation:spin .9s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .ai-refresh-meta { font-size:9px; color:var(--a-muted); margin-left:2px; font-weight:400; text-transform:none; letter-spacing:0; }

        /* ── AI CARDS GRID ───────────────────── */
        .ai-grid {
          display:grid; grid-template-columns:repeat(4,1fr); gap:6px;
        }
        @media(max-width:1100px) { .ai-grid { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:560px)  { .ai-grid { grid-template-columns:1fr; } }

        /* ── AI CARD ─────────────────────────── */
        .aic {
          position:relative; overflow:hidden;
          background:var(--a-bg2); border:1px solid var(--a-border);
          border-radius:12px; padding:14px;
          transition:transform .18s,box-shadow .18s,background .18s;
          animation:fadeUp .5s ease both; cursor:default;
        }
        .aic:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.16),0 0 0 1px var(--a-border3); background:var(--card-hover); }

        /* top glow accent */
        .aic::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg,transparent,var(--aic-dk),transparent);
          opacity:.5;
        }
        [data-admin-theme="light"] .aic::before { background:linear-gradient(90deg,transparent,var(--aic-lk),transparent); }

        .aic-head { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:10px; }
        .aic-icon {
          width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center;
          background:color-mix(in srgb, var(--aic-dk) 14%, transparent);
          border:1px solid color-mix(in srgb, var(--aic-dk) 22%, transparent);
          color:var(--aic-dk); flex-shrink:0;
        }
        [data-admin-theme="light"] .aic-icon { background:color-mix(in srgb, var(--aic-lk) 10%, transparent); border-color:color-mix(in srgb, var(--aic-lk) 22%, transparent); color:var(--aic-lk); }

        .aic-badge {
          font-size:9px; font-weight:700; padding:2px 8px; border-radius:20px;
          border:1px solid color-mix(in srgb, var(--badge-clr) 35%, transparent);
          background:color-mix(in srgb, var(--badge-clr) 12%, transparent);
          color:var(--badge-clr);
        }

        .aic-title { font-family:'Syne',sans-serif; font-size:11px; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; color:var(--a-text2); margin:0 0 2px; }
        .aic-meta  { font-size:9px; color:var(--a-muted); margin:0 0 8px; }
        .aic-text  { font-size:11.5px; color:var(--a-text2); line-height:1.55; margin:0; }
        .aic-footer { display:flex; align-items:center; gap:5px; margin-top:10px; padding-top:8px; border-top:1px solid var(--a-border2); }
        .aic-model-dot { width:5px; height:5px; border-radius:50%; background:var(--aic-dk); flex-shrink:0; }
        [data-admin-theme="light"] .aic-model-dot { background:var(--aic-lk); }
        .aic-model-name { font-size:9px; color:var(--a-faint); font-family:monospace; }

        /* error state */
        .aic-error { font-size:11px; color:#f87171; opacity:.8; }

        /* AI section error/warn banner */
        .ai-err-banner {
          background:rgba(248,113,113,.08); border:1px solid rgba(248,113,113,.2); border-radius:10px;
          padding:12px 16px; font-size:12px; color:#f87171; display:flex; align-items:center; gap:8px;
          margin-bottom:8px;
        }
        .ai-warn-banner {
          background:rgba(251,191,36,.07); border:1px solid rgba(251,191,36,.2); border-radius:10px;
          padding:10px 14px; font-size:11px; color:#fbbf24; display:flex; align-items:center; gap:8px;
          margin-bottom:8px;
        }
      `}</style>

      <div className="db">
        <div className="db-wrap">

          {/* ══ HEADER ══ */}
          <header className="db-header">
            <div>
              <div className="db-eyebrow">Muves Admin · Control Panel</div>
              <h1 className="db-title">
                <span className="db-title-main">System </span>
                <span className="db-title-hi">Overview</span>
              </h1>
              <div className="db-live" aria-label="Live platform status">
                <span className="db-live-dot" />
                <span className="db-live-txt">Live · KK Music Platform</span>
              </div>
            </div>

            <div className="db-clock" aria-label="Current time">
              <div className="db-time" aria-live="polite">
                {hh}<span className="db-sep">:</span>{mm}
                <span className="db-sep db-sec">:{ss}</span>
              </div>
              <div className="db-date">
                {time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </header>

          {/* ══ STATS BENTO ══ */}
          <section aria-label="Platform statistics">
            <div className="db-section-rule">Platform Metrics</div>
            {loading ? (
              <div className="bento">
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ background: 'var(--a-bg2)', border: '1px solid var(--a-border)', borderRadius: 16, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div className="sk" style={{ width: 32, height: 32, borderRadius: 8 }} />
                      <div className="sk" style={{ width: 40, height: 20, borderRadius: 10 }} />
                    </div>
                    <div className="sk" style={{ height: 44, width: '52%', marginBottom: 8 }} />
                    <div className="sk" style={{ height: 11, width: '38%' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bento">
                {CARDS_META.map((meta, i) => (
                  <StatCard key={meta.key} meta={meta} value={stats?.[meta.key]} index={i} />
                ))}
              </div>
            )}
          </section>

          {/* ══ SECONDARY METRICS ══ */}
          <section aria-label="Secondary platform metrics">
            <div className="db-section-rule">Secondary Metrics</div>
            {loading ? (
              <div className="bento-secondary">
                {[...Array(8)].map((_, i) => (
                  <div key={i} style={{ background: 'var(--a-bg2)', border: '1px solid var(--a-border)', borderRadius: 16, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div className="sk" style={{ width: 32, height: 32, borderRadius: 8 }} />
                      <div className="sk" style={{ width: 40, height: 20, borderRadius: 10 }} />
                    </div>
                    <div className="sk" style={{ height: 44, width: '52%', marginBottom: 8 }} />
                    <div className="sk" style={{ height: 11, width: '38%' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bento-secondary">
                {SECONDARY_CARDS_META.map((meta, i) => (
                  <StatCard
                    key={meta.key}
                    meta={meta}
                    value={stats?.[meta.key]}
                    index={CARDS_META.length + i}
                    trendValue={SECONDARY_TRENDS[i]}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ══ AI INTELLIGENCE ══ */}
          <section aria-label="AI platform intelligence">
            <div className="ai-header">
              <div className="ai-header-left">
                <div className="ai-section-label">AI Intelligence</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {lastRefreshed && !aiLoading && (
                  <span className="ai-refresh-meta">
                    {aiInsights?.fromCache ? 'Cached · ' : 'Fresh · '}
                    {lastRefreshed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <button
                  className="ai-refresh-btn"
                  onClick={() => fetchAiInsights(true)}
                  disabled={aiLoading}
                  aria-label="Refresh AI insights"
                  title="Refresh AI insights"
                >
                  <FiRefreshCw size={10} className={aiLoading ? 'ai-spin' : ''} aria-hidden="true" />
                  {aiLoading ? 'Thinking…' : 'Refresh'}
                </button>
              </div>
            </div>

            {aiError && !aiInsights && (
              <div className="ai-err-banner" role="alert">
                <FiAlertTriangle size={14} aria-hidden="true" />
                {aiError}
              </div>
            )}
            {aiError && aiInsights && (
              <div className="ai-warn-banner" role="status">
                <FiAlertCircle size={13} aria-hidden="true" />
                {aiError}
              </div>
            )}
            {(aiInsights || aiLoading || !aiError) && (
              <div className="ai-grid">
                {AI_CARDS.map((card, idx) => {
                  const settled = aiInsights?.[card.key];
                  const isCardLoading = aiLoading || (!aiInsights && !aiError);

                  if (isCardLoading) {
                    return (
                      <div key={card.key} className="aic" style={{ '--aic-dk': card.dark, '--aic-lk': card.light, animationDelay: `${idx * 70}ms` }}>
                        <div className="aic-head">
                          <div className="sk" style={{ width: 28, height: 28, borderRadius: 8 }} />
                          <div className="sk" style={{ width: 52, height: 18, borderRadius: 20 }} />
                        </div>
                        <div className="sk" style={{ height: 12, width: '55%', marginBottom: 6 }} />
                        <div className="sk" style={{ height: 10, width: '35%', marginBottom: 12 }} />
                        <div className="sk" style={{ height: 11, width: '90%', marginBottom: 4 }} />
                        <div className="sk" style={{ height: 11, width: '70%' }} />
                      </div>
                    );
                  }

                  if (!settled || !settled.ok) {
                    return (
                      <div key={card.key} className="aic" style={{ '--aic-dk': card.dark, '--aic-lk': card.light, animationDelay: `${idx * 70}ms` }}>
                        <div className="aic-head">
                          <div className="aic-icon" aria-hidden="true"><card.icon size={12} /></div>
                        </div>
                        <p className="aic-title">{card.title}</p>
                        <p className="aic-error">{settled?.error || 'No data'}</p>
                      </div>
                    );
                  }

                  const rendered = card.render(settled.data);
                  return (
                    <div key={card.key} className="aic" style={{ '--aic-dk': card.dark, '--aic-lk': card.light, animationDelay: `${idx * 70}ms` }}>
                      <div className="aic-head">
                        <div className="aic-icon" aria-hidden="true"><card.icon size={12} /></div>
                        <span
                          className="aic-badge"
                          style={{ '--badge-clr': rendered.badgeColor }}
                          aria-label={rendered.badge}
                        >
                          {rendered.badge}
                        </span>
                      </div>
                      <p className="aic-title">{card.title}</p>
                      <p className="aic-meta">{rendered.meta}</p>
                      <p className="aic-text">{rendered.text}</p>
                      <div className="aic-footer" aria-label={`Powered by ${card.model}`}>
                        <span className="aic-model-dot" aria-hidden="true" />
                        <span className="aic-model-name">{card.model}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ══ BOTTOM ══ */}
          <div className="db-bottom">

            {/* TOP SONGS */}
            <section aria-label="Top songs by streams" className="panel">
              <div className="panel-head">
                <span className="panel-head-pip" style={{ background: '#60a5fa' }} />
                <h2 className="panel-head-title">Top Songs</h2>
                <span className="panel-head-tag">by streams</span>
              </div>
              <div className="panel-body">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 0', borderBottom: '1px solid var(--a-border2)' }}>
                      <div className="sk" style={{ width: 22, height: 12, borderRadius: 3 }} />
                      <div className="sk" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="sk" style={{ height: 13, width: '58%', marginBottom: 5 }} />
                        <div className="sk" style={{ height: 10, width: '34%' }} />
                      </div>
                      <div className="sk" style={{ width: 80, height: 18, borderRadius: 4 }} />
                    </div>
                  ))
                ) : (stats?.topSongs || []).length > 0 ? (
                  stats.topSongs.map((song, i) => (
                    <SongRow key={song.id} rank={i + 1} song={song} maxPlays={maxPlays} index={i} />
                  ))
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--a-muted)', textAlign: 'center', padding: '40px 0' }}>No stream data yet</p>
                )}
              </div>
            </section>

            {/* RIGHT COLUMN */}
            <div className="right-col">

              {/* QUICK ACTIONS */}
              <section aria-label="Quick actions" className="panel">
                <div className="panel-head">
                  <span className="panel-head-pip" style={{ background: '#a78bfa' }} />
                  <h2 className="panel-head-title">Quick Actions</h2>
                </div>
                <div className="panel-body" style={{ paddingTop: 12 }}>
                  {ACTIONS.map((a, i) => (
                    <a key={i} href={a.href} className="qa" style={{ '--qa-dk': a.dk, '--qa-lk': a.lk }}>
                      <div className="qa-ico" aria-hidden="true"><a.icon size={11} /></div>
                      <span className="qa-lbl">{a.label}</span>
                      <FiArrowRight size={11} className="qa-arrow" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </section>

              {/* PLATFORM HEALTH */}
              <section aria-label="Platform health" className="panel">
                <div className="panel-head">
                  <span className="panel-head-pip" style={{ background: '#34d399' }} />
                  <h2 className="panel-head-title">Platform Health</h2>
                </div>
                <div className="panel-body">
                  {HEALTH.map((s, i) => (
                    <div key={i} className="hp-row">
                      <span className="hp-lbl">{s.label}</span>
                      <div className={`hp-badge ${s.ok ? 'hp-ok' : 'hp-err'}`} aria-label={`${s.label}: ${s.ok ? 'Healthy' : 'Error'}`}>
                        <span className="hp-dot" aria-hidden="true" />
                        {s.ok ? 'Healthy' : 'Error'}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
