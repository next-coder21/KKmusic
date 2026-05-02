import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../config';
import { FiLock, FiMail, FiEye, FiEyeOff, FiShield, FiActivity, FiUsers, FiMusic } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const STATS = [
  { icon: FiUsers,    label: 'Active Users',  value: '12.4K' },
  { icon: FiMusic,    label: 'Tracks Live',   value: '84.2K' },
  { icon: FiActivity, label: 'Uptime',        value: '99.9%' },
];

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 1,
  duration: Math.random() * 10 + 12,
  delay: Math.random() * 8,
}));

const AdminLogin = ({ onLogin }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState(null);
  const [tick, setTick]         = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_CONFIG.ADMIN_URL}/login`,
        { email, password },
        { withCredentials: true }
      );
      if (res.data?.token) localStorage.setItem('admin_token', res.data.token);
      toast.success('Access granted');
      onLogin(res.data?.admin?.name);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  const ready = email && password && !loading;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'DM Sans', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      background: '#06060a',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Syne:wght@700;800&display=swap');

        .al-input { outline: none; background: transparent; border: none; width: 100%; color: #f1f5f9; font-family: inherit; font-size: 14px; box-sizing: border-box; }
        .al-input::placeholder { color: rgba(148,163,184,0.25); }
        .al-input:-webkit-autofill,
        .al-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #f1f5f9 !important;
          -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
          transition: background-color 5000s;
        }

        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1);   opacity: 0.15; }
          50%  { opacity: 0.4; }
          100% { transform: translateY(-110vh) scale(0.5); opacity: 0; }
        }
        @keyframes meshMove {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(236,72,153,0.3); }
          50%      { box-shadow: 0 0 0 8px rgba(236,72,153,0); }
        }
        @keyframes borderGlow {
          0%,100% { opacity: 0.5; }
          50%      { opacity: 1; }
        }

        .al-submit:not(:disabled):hover  { filter: brightness(1.12); transform: translateY(-1px); box-shadow: 0 8px 30px rgba(168,85,247,0.45) !important; }
        .al-submit:not(:disabled):active { transform: translateY(0px); }
        .al-submit { transition: filter 0.2s, transform 0.15s, box-shadow 0.2s; }

        .stat-card:hover { border-color: rgba(168,85,247,0.2) !important; background: rgba(168,85,247,0.06) !important; }
        .stat-card { transition: border-color 0.2s, background 0.2s; }

        @media (max-width: 768px) {
          .al-left { display: none !important; }
          .al-right { width: 100% !important; }
        }
      `}</style>

      {/* ── GLOBAL BACKGROUND MESH ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'linear-gradient(125deg, #0a0014 0%, #06060a 40%, #000d1a 70%, #06060a 100%)',
        backgroundSize: '400% 400%',
        animation: 'meshMove 20s ease infinite',
      }} />

      {/* Floating particles */}
      {PARTICLES.map(p => (
        <div key={p.id} style={{
          position: 'fixed',
          left: `${p.x}%`, bottom: '-10px',
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: p.id % 3 === 0 ? 'rgba(236,72,153,0.6)' : p.id % 3 === 1 ? 'rgba(168,85,247,0.5)' : 'rgba(99,102,241,0.5)',
          animation: `floatUp ${p.duration}s ${p.delay}s linear infinite`,
          zIndex: 1,
        }} />
      ))}

      {/* ═══════════════════════════════
          LEFT PANEL
      ═══════════════════════════════ */}
      <div className="al-left" style={{
        width: '52%', minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'flex-start',
        padding: '60px 64px',
        position: 'relative', zIndex: 5,
      }}>
        {/* Big decorative glow blob */}
        <div style={{
          position: 'absolute', top: '50%', left: '40%',
          transform: 'translate(-50%,-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 40%, rgba(168,85,247,0.18) 0%, rgba(236,72,153,0.08) 40%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '10%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 64 }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: 'linear-gradient(135deg,#ec4899,#a855f7,#6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff',
            fontFamily: "'Syne', sans-serif",
            boxShadow: '0 0 0 1px rgba(168,85,247,0.3), 0 8px 24px rgba(168,85,247,0.2)',
            animation: 'pulse 3s ease infinite',
          }}>K</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em', fontFamily: "'Syne', sans-serif" }}>KK Audio</div>
            <div style={{ fontSize: 10.5, color: 'rgba(148,163,184,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>Admin Portal</div>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 48 }}
        >
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 52, fontWeight: 800,
            color: '#f1f5f9',
            margin: '0 0 16px',
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
          }}>
            Control<br />
            <span style={{
              background: 'linear-gradient(90deg,#ec4899,#a855f7,#6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Everything.</span>
          </h1>
          <p style={{
            margin: 0, fontSize: 15,
            color: 'rgba(148,163,184,0.55)',
            lineHeight: 1.7, maxWidth: 360,
            fontWeight: 400,
          }}>
            Manage users, tracks, and platform settings from a single secure dashboard.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
        >
          {STATS.map(({ icon: Icon, label, value }, i) => (
            <motion.div
              key={label}
              className="stat-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.08 }}
              style={{
                padding: '14px 18px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                cursor: 'default',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                <Icon size={12} style={{ color: '#a855f7' }} />
                <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em' }}>{value}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom security badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ marginTop: 'auto', paddingTop: 60, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 6px rgba(16,185,129,0.8)',
          }} />
          <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.3)', letterSpacing: '0.08em', fontWeight: 600 }}>
            ALL SYSTEMS OPERATIONAL
          </span>
        </motion.div>
      </div>

      {/* ═══════════════════════════════
          RIGHT PANEL — glassmorphism
      ═══════════════════════════════ */}
      <div className="al-right" style={{
        width: '48%', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 48px',
        position: 'relative', zIndex: 5,
      }}>
        {/* Divider glow line */}
        <div style={{
          position: 'absolute', left: 0, top: '15%', bottom: '15%',
          width: 1,
          background: 'linear-gradient(180deg, transparent, rgba(168,85,247,0.25) 30%, rgba(236,72,153,0.25) 70%, transparent)',
          animation: 'borderGlow 4s ease infinite',
        }} />

        {/* Glow behind card */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', maxWidth: 400, position: 'relative' }}
        >
          {/* Glass card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 24,
            padding: '40px 36px 36px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Top shimmer line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg, transparent 5%, rgba(236,72,153,0.6) 35%, rgba(168,85,247,0.6) 65%, transparent 95%)',
            }} />
            {/* Card inner glow */}
            <div style={{
              position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
              width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Card header */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <FiShield size={16} style={{ color: '#10b981' }} />
                <span style={{ fontSize: 10.5, color: '#10b981', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Secure Sign In</span>
              </div>
              <h2 style={{
                margin: 0, fontSize: 26,
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800, color: '#f1f5f9',
                letterSpacing: '-0.03em',
              }}>Welcome back</h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(148,163,184,0.45)', lineHeight: 1.5 }}>
                Authorised personnel only
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>

              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 700,
                  color: 'rgba(148,163,184,0.5)',
                  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
                }}>Email</label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '0 14px',
                  borderRadius: 12,
                  background: focused === 'email' ? 'rgba(168,85,247,0.07)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${focused === 'email' ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: focused === 'email' ? '0 0 0 3px rgba(168,85,247,0.08)' : 'none',
                  transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                  height: 48,
                }}>
                  <FiMail size={14} style={{ color: focused === 'email' ? '#a855f7' : 'rgba(148,163,184,0.3)', flexShrink: 0, transition: 'color 0.2s' }} />
                  <input
                    className="al-input"
                    type="email" required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="admin@kk.com"
                    style={{ padding: '0', height: '100%' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 28 }}>
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 700,
                  color: 'rgba(148,163,184,0.5)',
                  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
                }}>Password</label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '0 14px',
                  borderRadius: 12,
                  background: focused === 'password' ? 'rgba(168,85,247,0.07)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${focused === 'password' ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: focused === 'password' ? '0 0 0 3px rgba(168,85,247,0.08)' : 'none',
                  transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                  height: 48,
                }}>
                  <FiLock size={14} style={{ color: focused === 'password' ? '#a855f7' : 'rgba(148,163,184,0.3)', flexShrink: 0, transition: 'color 0.2s' }} />
                  <input
                    className="al-input"
                    type={showPw ? 'text' : 'password'} required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    style={{ padding: '0', height: '100%', flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.3)', display: 'flex', padding: 0, flexShrink: 0, transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(148,163,184,0.7)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(148,163,184,0.3)'}
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={showPw ? 'off' : 'on'}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.12 }}
                        style={{ display: 'flex' }}
                      >
                        {showPw ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                      </motion.span>
                    </AnimatePresence>
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                className="al-submit"
                type="submit"
                disabled={!ready}
                style={{
                  width: '100%', height: 50,
                  borderRadius: 12, border: 'none',
                  background: ready
                    ? 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)'
                    : 'rgba(255,255,255,0.05)',
                  color: ready ? '#fff' : 'rgba(148,163,184,0.25)',
                  fontSize: 14, fontWeight: 700,
                  cursor: ready ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                  boxShadow: ready ? '0 4px 24px rgba(168,85,247,0.3)' : 'none',
                }}
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.span key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.65s linear infinite' }} />
                      Authenticating…
                    </motion.span>
                  ) : (
                    <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      Sign In
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </form>

            {/* Card footer */}
            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px rgba(16,185,129,0.7)' }} />
              <span style={{ fontSize: 10.5, color: 'rgba(148,163,184,0.25)', letterSpacing: '0.07em', fontWeight: 600 }}>
                SESSION ENCRYPTED · ACCESS LOGGED
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;
