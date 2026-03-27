import React, { useEffect, useState } from 'react';
import { FiUsers, FiMusic, FiMic, FiDisc, FiAlertTriangle, FiTrendingUp, FiPlay, FiArrowUpRight } from 'react-icons/fi';

/* ── Shared styles ─────────────────────────────────────────── */
const card = {
  background: '#0f0f0f',
  border: '1px solid #1a1a1a',
  borderRadius: 12,
};

const Skeleton = ({ h = 16, w = '100%', r = 6 }) => (
  <div style={{ height: h, width: w, borderRadius: r, background: '#181818', animation: 'shimmer 1.4s ease-in-out infinite' }} />
);

/* ── Stat card ─────────────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, color, trend, trendUp }) => (
  <div style={{ ...card, padding: '20px 20px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color, opacity: 0.06, filter: 'blur(20px)', pointerEvents: 'none' }} />
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        <Icon size={16} />
      </div>
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 20, background: trendUp ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${trendUp ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
          <FiTrendingUp size={10} style={{ color: trendUp ? '#4ade80' : '#f87171', transform: trendUp ? 'none' : 'scaleY(-1)' }} />
          <span style={{ fontSize: 10, color: trendUp ? '#4ade80' : '#f87171', fontWeight: 700 }}>{trend}%</span>
        </div>
      )}
    </div>
    <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#f9fafb', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.04em', lineHeight: 1 }}>
      {value?.toLocaleString() ?? '—'}
    </p>
    <p style={{ margin: '5px 0 0', fontSize: 12, color: '#4b5563', fontWeight: 500 }}>{label}</p>
  </div>
);

/* ── Top song row ──────────────────────────────────────────── */
const SongRow = ({ rank, song, maxPlays }) => {
  const pct = maxPlays > 0 ? (song.play_count / maxPlays) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid #141414' }}>
      <span style={{ width: 20, fontSize: 11, color: '#374151', fontWeight: 700, textAlign: 'right', flexShrink: 0, fontFamily: 'monospace' }}>
        {String(rank).padStart(2, '0')}
      </span>
      <div style={{ width: 34, height: 34, borderRadius: 7, background: '#1a1a1a', border: '1px solid #222', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {song.cover_url
          ? <img src={song.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <FiMusic size={13} style={{ color: '#374151' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#e5e7eb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#374151' }}>{song.artist_name || 'Unknown'}</p>
      </div>
      <div style={{ width: 80, flexShrink: 0 }}>
        <div style={{ height: 3, borderRadius: 2, background: '#1a1a1a', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#ec4899,#6366f1)', borderRadius: 2, transition: 'width 0.8s ease' }} />
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 10, color: '#374151', textAlign: 'right' }}>{song.play_count?.toLocaleString()}</p>
      </div>
    </div>
  );
};

/* ── AdminDashboard ────────────────────────────────────────── */
const AdminDashboard = ({ api }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get('/stats'); setStats(data); }
      catch { console.error('Failed to load stats'); }
      finally { setLoading(false); }
    })();
  }, [api]);

  const CARDS = [
    { label: 'Total Users',    value: stats?.totalUsers,   icon: FiUsers,         color: '#3b82f6', trend: 12,  trendUp: true },
    { label: 'Songs',          value: stats?.totalSongs,   icon: FiMusic,         color: '#ec4899', trend: 5,   trendUp: true },
    { label: 'Artists',        value: stats?.totalArtists, icon: FiMic,           color: '#a78bfa', trend: 8,   trendUp: true },
    { label: 'Albums',         value: stats?.totalAlbums,  icon: FiDisc,          color: '#2dd4bf', trend: 3,   trendUp: true },
    { label: 'Total Streams',  value: stats?.totalPlays,   icon: FiPlay,          color: '#f59e0b', trend: 24,  trendUp: true },
    { label: 'Reports',        value: stats?.pendingReports, icon: FiAlertTriangle, color: '#f87171', trend: 2, trendUp: false },
  ];

  const maxPlays = stats?.topSongs?.[0]?.play_count || 1;

  if (loading) return (
    <div>
      <Skeleton h={24} w={200} r={6} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, margin: '20px 0' }}>
        {[...Array(6)].map((_, i) => <div key={i} style={{ ...card, padding: 20, height: 110 }}><Skeleton h={80} /></div>)}
      </div>
    </div>
  );

  return (
    <div>
      <style>{`@keyframes shimmer{0%,100%{opacity:0.5}50%{opacity:1}}`}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#f9fafb', margin: 0 }}>
          System Overview
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#4b5563' }}>
          Real-time metrics for KK Music platform
        </p>
      </div>

      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {CARDS.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>

        {/* Top songs */}
        <div style={{ ...card, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#e5e7eb', letterSpacing: '-0.02em' }}>Top Songs</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#374151' }}>
              <FiPlay size={11} /> by streams
            </div>
          </div>
          {(stats?.topSongs || []).map((song, i) => (
            <SongRow key={song.id} rank={i + 1} song={song} maxPlays={maxPlays} />
          ))}
          {!stats?.topSongs?.length && (
            <p style={{ fontSize: 13, color: '#374151', textAlign: 'center', padding: '24px 0' }}>No stream data yet</p>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...card, padding: 20 }}>
            <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#e5e7eb', letterSpacing: '-0.02em' }}>Quick Actions</p>
            {[
              { label: 'Add new song',     href: '/admin/songs',    color: '#ec4899' },
              { label: 'Add artist',       href: '/admin/artists',  color: '#a78bfa' },
              { label: 'New broadcast',    href: '/admin/announcements', color: '#2dd4bf' },
              { label: 'Review reports',   href: '/admin/reports',  color: '#f87171' },
            ].map((a, i) => (
              <a key={i} href={a.href} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 8, background: 'transparent', border: `1px solid #1a1a1a`, marginBottom: 6, transition: 'all 0.12s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#141414'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.color }} />
                  <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>{a.label}</span>
                </div>
                <FiArrowUpRight size={12} style={{ color: '#2a2a2a' }} />
              </a>
            ))}
          </div>

          <div style={{ ...card, padding: 20 }}>
            <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>Platform Health</p>
            {[
              { label: 'Database',  status: 'Healthy', ok: true },
              { label: 'Storage',   status: 'Active',  ok: true },
              { label: 'Email',     status: 'Active',  ok: true },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? '1px solid #141414' : 'none' }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{s.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.ok ? '#4ade80' : '#f87171' }} />
                  <span style={{ fontSize: 11, color: s.ok ? '#4ade80' : '#f87171', fontWeight: 600 }}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
