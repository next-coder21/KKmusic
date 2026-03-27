import React, { useState } from 'react';
import axios from 'axios';
import ApiService from '../../services/ApiService';
import { API_CONFIG } from '../../config';
import { FiLock, FiMail, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_CONFIG.ADMIN_URL}/login`,
        { email, password },
        { withCredentials: true }
      );
      toast.success('Access granted');
      onLogin(res.data?.admin?.name);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  const inputBase = {
    width: '100%', background: '#0f0f0f',
    border: '1px solid #1f1f1f', borderRadius: 9,
    padding: '11px 14px 11px 38px',
    color: '#f9fafb', fontSize: 13, outline: 'none',
    transition: 'border-color 0.15s', fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@800&display=swap'); input::placeholder{color:#374151}`}</style>

      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '30%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '30%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ width: '100%', maxWidth: 380, background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 16, padding: 36, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', position: 'relative', zIndex: 10 }}>

        {/* Top accent */}
        <div style={{ position: 'absolute', top: 0, left: 40, right: 40, height: 1, background: 'linear-gradient(90deg, transparent, rgba(236,72,153,0.4), transparent)' }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#ec4899,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: "'Syne', sans-serif" }}>K</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: '#f9fafb', margin: 0, letterSpacing: '-0.03em' }}>Admin Portal</h1>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#374151' }}>Restricted access — authorised personnel only</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 10, color: '#4b5563', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Email</label>
            <div style={{ position: 'relative' }}>
              <FiMail size={13} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#374151' }} />
              <input
                type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                style={inputBase} placeholder="admin@kk.com"
                onFocus={e => e.target.style.borderColor = '#ec4899'}
                onBlur={e => e.target.style.borderColor = '#1f1f1f'}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 10, color: '#4b5563', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock size={13} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#374151' }} />
              <input
                type={showPw ? 'text' : 'password'} required
                value={password} onChange={e => setPassword(e.target.value)}
                style={{ ...inputBase, paddingRight: 38 }} placeholder="••••••••"
                onFocus={e => e.target.style.borderColor = '#ec4899'}
                onBlur={e => e.target.style.borderColor = '#1f1f1f'}
              />
              <button type="button" onClick={() => setShowPw(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#374151', display: 'flex' }}>
                {showPw ? <FiEyeOff size={13} /> : <FiEye size={13} />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading || !email || !password}
            style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: loading ? '#1a1a1a' : 'linear-gradient(135deg,#ec4899,#6366f1)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em', transition: 'opacity 0.15s', opacity: (loading || !email || !password) ? 0.5 : 1 }}>
            {loading ? 'Authenticating...' : 'Secure Sign In'}
          </motion.button>
        </form>

        <p style={{ margin: '18px 0 0', textAlign: 'center', fontSize: 11, color: '#1f2937' }}>
          This area is monitored and access is logged.
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
