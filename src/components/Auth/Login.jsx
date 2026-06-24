import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../context/UserContext";
import http from "../../services/http";
import { WEBSITE_URL } from "../../config";

/* ─── Form field ────────────────────────────────────────── */
const Field = ({ label, rightSlot, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{
          fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: focused ? "#C8FF00" : "rgba(255,255,255,0.38)",
          transition: "color 0.2s",
        }}>{label}</label>
        {rightSlot}
      </div>
      <input
        {...props}
        className="auth-field-input"
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: "100%",
          padding: "clamp(0.5rem, 1vh, 0.85rem) 1rem",
          background: focused ? "rgba(200,255,0,0.04)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${focused ? "rgba(200,255,0,0.45)" : "rgba(255,255,255,0.12)"}`,
          borderRadius: "10px",
          color: "#fff",
          fontSize: "clamp(0.85rem, 1.5vh, 0.88rem)",
          fontWeight: 500,
          fontFamily: "inherit",
          outline: "none",
          transition: "all 0.2s",
          boxShadow: focused ? "0 0 0 3px rgba(200,255,0,0.07)" : "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
};

/* ─── Glowing waveform SVG for left panel ───────────────── */
const GlowingWaveform = () => {
  const bars = [
    14,22,38,52,66,78,88,96,100,96,88,78,66,52,38,
    44,60,76,88,96,100,92,80,64,48,36,28,20,28,36,
    48,64,80,92,100,96,88,76,60,44,32,24,18,24,32,
    44,56,70,84,94,100,90,76,58,42,30,22,16,
  ];
  const W = 340, H = 140, midY = H / 2;
  const segW = W / bars.length;

  const topPoints = bars.map((v, i) => `${i * segW + segW / 2},${midY - (v / 100) * (midY - 8)}`).join(" ");
  const botPoints = bars.map((v, i) => `${i * segW + segW / 2},${midY + (v / 100) * (midY - 8)}`).join(" ");

  return (
    <div style={{ position: "relative", width: 340, height: 140 }}>
      <svg width="340" height="140" style={{ filter: "drop-shadow(0 0 18px rgba(200,255,0,0.45))" }}>
        <defs>
          <linearGradient id="wvGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6" />
            <stop offset="40%" stopColor="#C8FF00" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#ffe500" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#C8FF00" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="wvGrad2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#C8FF00" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffe500" stopOpacity="0.25" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Mirrored fill area */}
        <polygon
          points={`0,${midY} ${topPoints} ${W},${midY}`}
          fill="url(#wvGrad2)"
        />
        <polygon
          points={`0,${midY} ${botPoints} ${W},${midY}`}
          fill="url(#wvGrad2)"
        />

        {/* Top stroke */}
        <polyline points={topPoints} fill="none" stroke="url(#wvGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
        {/* Bottom stroke */}
        <polyline points={botPoints} fill="none" stroke="url(#wvGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
        {/* Center line */}
        <line x1="0" y1={midY} x2={W} y2={midY} stroke="rgba(200,255,0,0.18)" strokeWidth="1" />
      </svg>

      {/* Animated glow pulse */}
      <style>{`
        @keyframes wv-pulse { 0%,100%{opacity:0.7} 50%{opacity:1} }
        @keyframes auth-spin { to{transform:rotate(360deg)} }
      `}</style>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, rgba(200,255,0,0.12) 0%, transparent 70%)",
        animation: "wv-pulse 3s ease-in-out infinite",
      }} />
    </div>
  );
};

/* ─── Animated OTP Boxes ────────────────────────────────── */
// animPhase: 0=idle  1=strobe(loading)  2=card-shuffle  3=merge  4=tick  5=merge-fail  6=shake
const BOX_W = 46, BOX_GAP = 10;
// Card-shuffle offsets — alternating left/right fan
const CARD = [
  { sx: -44, sr: -13 }, { sx:  38, sr: 11 },
  { sx: -28, sr:  -9 }, { sx:  32, sr: 10 },
  { sx: -38, sr: -12 }, { sx:  44, sr: 13 },
];
// Merge-to-center x offsets (row = 326px wide, center = 163px)
const MERGE_X = [140, 84, 28, -28, -84, -140];

const OtpBoxes = ({ value, onChange, animPhase }) => {
  const refs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const handleChange = (e, i) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const arr = [...digits]; arr[i] = val;
    onChange(arr.join(''));
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace') {
      if (digits[i]) { const arr = [...digits]; arr[i] = ''; onChange(arr.join('')); }
      else if (i > 0) {
        const arr = [...digits]; arr[i - 1] = ''; onChange(arr.join(''));
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft'  && i > 0) refs.current[i - 1]?.focus();
    else if  (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(p);
    refs.current[Math.min(p.length, 5)]?.focus();
  };

  useEffect(() => { if (animPhase === 0) refs.current[0]?.focus(); }, [animPhase]);

  const isStrobe     = animPhase === 1;
  const isShuffle    = animPhase === 2;
  const isMerge      = animPhase === 3;
  const isMergeFail  = animPhase === 5;
  const isShake      = animPhase === 6;

  const hintText = animPhase === 5 ? 'Hmm, that didn\'t work…'
                 : animPhase === 6 ? 'Wrong code — try again'
                 : 'Code expires in 10 min · Check spam if not found';
  const hintColor = (animPhase === 5 || animPhase === 6)
    ? 'rgba(255,100,100,0.7)' : 'rgba(255,255,255,0.22)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      {/* Row */}
      <div style={{
        display: 'flex', gap: BOX_GAP, justifyContent: 'center',
        position: 'relative', height: 72, alignItems: 'center',
        animation: isShake ? 'otp-shake 0.5s ease both' : 'none',
      }}>
        {digits.map((d, i) => {
          const filled = d !== '';
          return (
            <div
              key={i}
              className={isStrobe ? 'otp-sb-wrap' : ''}
              style={{
                position: 'relative',
                width: isStrobe ? BOX_W + 4 : BOX_W,
                height: isStrobe ? 58 : 54,
                borderRadius: 14,
                flexShrink: 0,
                // Merge (success) via CSS transition
                transform: isMerge ? `translateX(${MERGE_X[i]}px) scale(0.05)` : 'none',
                opacity: isMerge ? 0 : 1,
                transition: isMerge
                  ? `transform 0.44s cubic-bezier(.55,0,1,.5) ${i * 22}ms, opacity 0.3s ease-in ${i * 22}ms`
                  : 'transform 0.3s ease, opacity 0.3s ease, width 0.2s, height 0.2s',
                // Card-shuffle + merge-fail via CSS animation (uses --sx/--sr/--mx custom props)
                animation: isShuffle
                  ? `card-shuffle 0.55s cubic-bezier(.36,.07,.19,.97) ${i * 28}ms both`
                  : isMergeFail
                    ? `merge-fail 0.78s cubic-bezier(.36,.07,.19,.97) ${i * 18}ms both`
                    : 'none',
                '--sx': `${CARD[i].sx}px`,
                '--sr': `${CARD[i].sr}deg`,
                '--mx': `${MERGE_X[i] * 0.42}px`,
              }}
            >
              {/* Spinning conic-gradient "strip light" border — strobe only */}
              {isStrobe && (
                <div className="otp-sb-spin" style={{ animationDelay: `${-i * 0.11}s` }} />
              )}
              {/* Dark fill behind input when strobe is on */}
              {isStrobe && (
                <div style={{
                  position: 'absolute', inset: 2, borderRadius: 12,
                  background: '#07070f', zIndex: 1,
                }} />
              )}
              {/* Input */}
              <input
                ref={el => refs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                disabled={animPhase > 0}
                onChange={e => handleChange(e, i)}
                onKeyDown={e => handleKeyDown(e, i)}
                onPaste={handlePaste}
                autoFocus={i === 0}
                style={{
                  position: 'absolute',
                  inset: isStrobe ? 2 : 0,
                  width: 'auto', height: 'auto',
                  textAlign: 'center', fontSize: '1.5rem', fontWeight: 900,
                  background: !isStrobe && filled ? 'rgba(200,255,0,0.07)' : 'transparent',
                  border: isStrobe ? 'none'
                    : `2px solid ${filled ? 'rgba(200,255,0,0.7)' : 'rgba(255,255,255,0.14)'}`,
                  borderRadius: 12, color: '#C8FF00', outline: 'none',
                  fontFamily: 'inherit', caretColor: '#C8FF00',
                  boxShadow: !isStrobe && filled
                    ? '0 0 0 3px rgba(200,255,0,0.12), 0 0 20px rgba(200,255,0,0.22)'
                    : 'none',
                  cursor: animPhase > 0 ? 'default' : 'text',
                  transition: 'border-color 0.18s, box-shadow 0.18s',
                  zIndex: 2,
                }}
              />
            </div>
          );
        })}

        {/* Tick — phase 4 */}
        {animPhase === 4 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'tick-pop 0.5s cubic-bezier(.36,.07,.19,.97) forwards',
          }}>
            <svg width="62" height="62" viewBox="0 0 62 62" fill="none">
              <circle cx="31" cy="31" r="28" stroke="#C8FF00" strokeWidth="2.5"
                style={{ strokeDasharray: 200, strokeDashoffset: 200, animation: 'circle-draw 0.4s ease forwards' }} />
              <path d="M19 31 L27 39 L43 23" stroke="#C8FF00" strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ strokeDasharray: 35, strokeDashoffset: 35, animation: 'check-draw 0.35s ease 0.2s forwards' }} />
            </svg>
          </div>
        )}
      </div>

      <p style={{
        fontSize: '0.68rem', color: hintColor,
        fontWeight: 500, lineHeight: 1.5, textAlign: 'center', margin: 0,
        transition: 'color 0.3s',
      }}>{hintText}</p>
    </div>
  );
};

/* ─── Left panel stat ───────────────────────────────────── */
const LeftStat = ({ value, label }) => (
  <div>
    <p style={{ fontSize: "1.5rem", fontWeight: 900, color: "#C8FF00", letterSpacing: "-0.03em", margin: 0 }}>{value}</p>
    <p style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.32)", letterSpacing: "0.16em", textTransform: "uppercase", margin: 0 }}>{label}</p>
  </div>
);

/* ─── Form metadata ─────────────────────────────────────── */
const TITLES = {
  login:          { h: "WELCOME\nBACK",       sub: "Sign in to continue your vibe." },
  signup:         { h: "JOIN THE\nMUVEMENT.", sub: "Create your Muve\u{1D11E} account." },
  "set-security": { h: "ONE LAST\nSTEP.",     sub: "Set a secret keyword to protect your account." },
  "forgot-email": { h: "FORGOT\nPASSWORD?",  sub: "We'll send an OTP to your email." },
  "verify-otp":   { h: "CHECK YOUR\nEMAIL.", sub: "Enter the 6-digit code we sent you." },
  reset:          { h: "SET NEW\nPASSWORD.", sub: "Choose something strong." },
};
const BTN = {
  login:          "Sign In",
  signup:         "Continue",
  "set-security": "Create Account",
  "forgot-email": "Send OTP",
  "verify-otp":   "Verify Code",
  reset:          "Update Password",
};

/* ════════════════════════════════════════════════════════
   MAIN AUTH COMPONENT
════════════════════════════════════════════════════════ */
const Auth = () => {
  const [formType, setFormType]               = useState("login");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [name, setName]                       = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityAnswer, setSecurityAnswer]   = useState("");
  const [otpValue, setOtpValue]               = useState("");
  const [resetToken, setResetToken]           = useState("");
  const [rememberMe, setRememberMe]           = useState(false);
  // 0=idle 1=strobe 2=card-shuffle 3=merge 4=tick 5=merge-fail 6=shake
  const [animPhase, setAnimPhase]             = useState(0);
  const [isLoading, setIsLoading]             = useState(false);
  const { setUser }                           = useUser();
  const navigate                              = useNavigate();

  const delay = ms => new Promise(r => setTimeout(r, ms));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formType === "verify-otp") {
      // Race the API call against the fixed animation timeline
      setAnimPhase(1); // strobe starts immediately

      const apiResult = http.post("/auth/verify-otp", { email, otp: otpValue.trim() })
        .then(res => ({ ok: true,  data: res.data }))
        .catch(err => ({ ok: false, err }));

      // Wait for strobe (1.5s) AND API — whichever is longer
      const [, result] = await Promise.all([delay(1500), apiResult]);

      setAnimPhase(2); // card shuffle
      await delay(520);

      if (result.ok) {
        setResetToken(result.data.resetToken);
        setAnimPhase(3); // merge to center
        await delay(500);
        setAnimPhase(4); // tick
        await delay(900);
        setAnimPhase(0);
        setNewPassword(""); setConfirmPassword("");
        setFormType("reset");
      } else {
        setAnimPhase(5); // merge-fail (bounce back)
        await delay(820);
        setAnimPhase(6); // shake
        await delay(540);
        setAnimPhase(0);
        setOtpValue("");
        const msg = result.err?.response?.data?.error || result.err?.message || "Invalid or expired OTP";
        toast.error(msg);
      }
      return;
    }

    setIsLoading(true);
    try {
      let response;
      switch (formType) {
        case "login":
          response = await http.post("/auth/login", { email, password });
          break;
        case "signup":
          if (password !== confirmPassword) throw new Error("Passwords do not match");
          setFormType("set-security");
          setSecurityAnswer("");
          setIsLoading(false);
          return;
        case "set-security":
          response = await http.post("/auth/register", { name, email, password, securityAnswer });
          break;
        case "forgot-email":
          response = await http.post("/auth/forgot-password", { email });
          break;
        case "reset":
          if (newPassword !== confirmPassword) throw new Error("Passwords do not match");
          response = await http.post("/auth/reset-password", { resetToken, newPassword });
          break;
      }
      handleFormSuccess(response.data);
    } catch (err) { handleFormError(err); }
    finally { setIsLoading(false); }
  };

  const handleFormSuccess = (data) => {
    switch (formType) {
      case "login":
        if (data.token) localStorage.setItem("token", data.token);
        localStorage.setItem("isAuthenticated", "true");
        setUser(data.user);
        toast.success("Welcome back!");
        navigate("/home");
        break;
      case "set-security":
        toast.success("Account created! Sign in to get started.");
        setFormType("login");
        setPassword(""); setConfirmPassword(""); setSecurityAnswer("");
        break;
      case "forgot-email":
        toast.success("OTP sent! Check your email.");
        setFormType("verify-otp");
        setOtpValue("");
        break;
      case "reset":
        toast.success("Password updated. Sign in with your new password.");
        setResetToken("");
        setFormType("login");
        break;
    }
  };

  const handleFormError = (err) => {
    const msg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      "Something went wrong.";
    toast.error(msg);
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "#060610",
      color: "#fff",
      overflow: "hidden",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* ══ LEFT PANEL ═════════════════════════════════════════ */}
      <div
        className="auth-left-panel"
        style={{
          display: "none",
          width: "50%",
          flexShrink: 0,
          minHeight: 0,
          background: "#000",
          position: "relative",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "2.5rem 2.75rem",
          overflow: "hidden",
        }}
      >
        {/* Background glows */}
        <div style={{
          position: "absolute", top: "-100px", left: "-100px",
          width: 420, height: 420, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "5%", right: "5%",
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,255,0,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Divider line */}
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 1,
          background: "linear-gradient(to bottom, transparent, rgba(200,255,0,0.35) 25%, rgba(200,255,0,0.35) 75%, transparent)",
        }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: "1.1rem" }}>𝄞</span>
          </div>
          <span style={{ fontWeight: 900, fontSize: "1.15rem", letterSpacing: "-0.03em", color: "#fff" }}>
            MUVES
          </span>
          <span style={{
            fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "#C8FF00",
            background: "rgba(200,255,0,0.1)", padding: "0.2rem 0.5rem", borderRadius: 4,
          }}>AI-POWERED MUSIC</span>
        </div>

        {/* Center: waveform + headline */}
        <div style={{ paddingRight: "3rem" }}>
          <GlowingWaveform />
          <div style={{
            width: 56, height: 2.5,
            background: "linear-gradient(90deg, #7c3aed, #C8FF00)",
            margin: "1.75rem 0 1.25rem",
            borderRadius: 2,
          }} />
          <h1 style={{
            fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
            fontWeight: 900, lineHeight: 1.0,
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
            color: "#fff",
            marginBottom: "1rem",
            margin: 0,
          }}>
            THE SOUND<br />OF YOUR<br />
            <span style={{ color: "#C8FF00" }}>FREEDOM.</span>
          </h1>
          <p style={{
            color: "rgba(255,255,255,0.32)",
            fontSize: "0.78rem", fontWeight: 600,
            lineHeight: 1.7, textTransform: "uppercase",
            letterSpacing: "0.07em", maxWidth: "260px",
            marginTop: "1rem",
          }}>
            Stream, discover, and feel every track — powered by AI and built for the obsessed.
          </p>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex", gap: "2.5rem",
          paddingRight: "3rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}>
          <LeftStat value="99.9%" label="Uptime" />
          <LeftStat value="40+" label="Languages" />
          <LeftStat value="24-bit" label="Lossless" />
        </div>
      </div>

      {/* ══ RIGHT PANEL ════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        padding: "clamp(1rem, 2.5vh, 2rem)",
        overflowY: "hidden",
        position: "relative",
        background: "linear-gradient(135deg, #0a0a18 0%, #070712 100%)",
      }}>

        {/* Subtle bg glow */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 65% 15%, rgba(124,58,237,0.1) 0%, transparent 55%)",
        }} />

        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "clamp(0.5rem, 2vh, 2rem)", position: "relative", zIndex: 1,
        }}>
          {/* Mobile logo */}
          <div className="auth-mobile-logo" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#fff", fontSize: "0.85rem" }}>𝄞</span>
            </div>
            <span style={{ fontWeight: 900, fontSize: "1rem", letterSpacing: "-0.03em" }}>MUVES</span>
          </div>

          <a
            href={WEBSITE_URL}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              fontSize: "0.68rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.14em",
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
              transition: "color 0.2s, transform 0.2s",
              marginLeft: "auto",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.9)"; e.currentTarget.style.transform = "translateX(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.transform = "translateX(0)"; }}
          >
            <ArrowLeft size={11} />
            Back to platform
          </a>
        </div>

        {/* Form area */}
        <div style={{
          flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", zIndex: 1,
        }}>
          <div style={{ width: "100%", maxWidth: "560px" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={formType}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "22px",
                  padding: "clamp(1.5rem, 2.5vh, 2.5rem)",
                  backdropFilter: "blur(24px)",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
                }}>

                  {/* Step dots */}
                  <div style={{ display: "flex", gap: "0.3rem", marginBottom: "clamp(0.5rem, 1.5vh, 1.5rem)" }}>
                    {["login", "signup"].map(type => {
                      const active = type === formType || (type === "signup" && formType === "set-security");
                      return (
                        <div key={type} style={{
                          width: active ? 22 : 5,
                          height: 4, borderRadius: 2,
                          background: active ? "#C8FF00" : "rgba(255,255,255,0.1)",
                          transition: "all 0.3s ease",
                        }} />
                      );
                    })}
                  </div>

                  {/* Heading */}
                  <h2 style={{
                    fontSize: "clamp(1.75rem, 3.5vh, 2.4rem)",
                    fontWeight: 900, lineHeight: 1.0,
                    letterSpacing: "-0.04em",
                    textTransform: "uppercase",
                    whiteSpace: "pre-line",
                    color: "#fff",
                    marginBottom: "clamp(0.2rem, 0.5vh, 0.5rem)",
                  }}>
                    {TITLES[formType]?.h}
                  </h2>
                  <p style={{
                    fontSize: "clamp(0.76rem, 1.4vh, 0.8rem)", color: "rgba(255,255,255,0.36)",
                    fontWeight: 500, letterSpacing: "0.02em",
                    marginBottom: "clamp(0.75rem, 2vh, 2rem)",
                  }}>
                    {TITLES[formType]?.sub}
                  </p>

                  {/* Form */}
                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "clamp(0.5rem, 1.2vh, 1rem)" }}>

                    {/* Signup: 2-column grid */}
                    {formType === "signup" && (
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "clamp(0.5rem, 1.2vh, 1rem)",
                      }}>
                        <Field label="Full Name" type="text" placeholder="Your name"
                          value={name} onChange={e => setName(e.target.value)} required />
                        <Field label="Email" type="email" placeholder="you@example.com"
                          value={email} onChange={e => setEmail(e.target.value)} required />
                        <Field label="Password" type="password" placeholder="••••••••"
                          value={password} onChange={e => setPassword(e.target.value)} required />
                        <Field label="Confirm Password" type="password" placeholder="••••••••"
                          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                      </div>
                    )}

                    {/* Login / forgot-email: single column */}
                    {(formType === "login" || formType === "forgot-email") && (
                      <Field label="Email" type="email" placeholder="you@example.com"
                        value={email} onChange={e => setEmail(e.target.value)} required />
                    )}

                    {formType === "login" && (
                      <Field
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        rightSlot={
                          <button
                            type="button"
                            onClick={() => { setFormType("forgot-email"); setOtpValue(""); }}
                            style={{
                              background: "none", border: "none", padding: 0, cursor: "pointer",
                              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                              textTransform: "uppercase", color: "rgba(255,255,255,0.28)",
                              transition: "color 0.2s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = "#C8FF00"}
                            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.28)"}
                          >
                            Forgot password?
                          </button>
                        }
                      />
                    )}

                    {formType === "set-security" && (
                      <div>
                        <Field
                          label="Secret Keyword"
                          type="text"
                          placeholder="e.g. sunshine, guitar, 42..."
                          value={securityAnswer}
                          onChange={e => setSecurityAnswer(e.target.value)}
                          required
                        />
                        <p style={{
                          marginTop: "0.5rem", fontSize: "0.7rem",
                          color: "rgba(255,255,255,0.25)", fontWeight: 500, lineHeight: 1.5,
                        }}>
                          Remember this keyword — you may need it for account recovery.
                        </p>
                      </div>
                    )}

                    {formType === "verify-otp" && (
                      <OtpBoxes
                        value={otpValue}
                        onChange={setOtpValue}
                        animPhase={animPhase}
                      />
                    )}

                    {formType === "reset" && (
                      <>
                        <Field label="New Password" type="password" placeholder="••••••••"
                          value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                        <Field label="Confirm New Password" type="password" placeholder="••••••••"
                          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                      </>
                    )}

                    {/* Remember me */}
                    {formType === "login" && (
                      <label style={{
                        display: "flex", alignItems: "center", gap: "0.6rem",
                        cursor: "pointer", userSelect: "none",
                        fontSize: "0.72rem", fontWeight: 600,
                        color: "rgba(255,255,255,0.38)", letterSpacing: "0.06em",
                      }}>
                        <div
                          onClick={() => setRememberMe(v => !v)}
                          style={{
                            width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                            border: `1.5px solid ${rememberMe ? "#C8FF00" : "rgba(255,255,255,0.2)"}`,
                            background: rememberMe ? "#C8FF00" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.18s",
                            cursor: "pointer",
                          }}
                        >
                          {rememberMe && (
                            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                              <path d="M1 3.5L3.5 6L8 1" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        Remember me
                      </label>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading || animPhase > 0}
                      style={{
                        marginTop: "clamp(0.1rem, 0.5vh, 0.25rem)",
                        width: "100%",
                        padding: "clamp(0.6rem, 1.1vh, 0.95rem)",
                        borderRadius: "10px",
                        background: (isLoading || animPhase > 0) ? "rgba(200,255,0,0.55)" : "#C8FF00",
                        color: "#000",
                        fontWeight: 900,
                        fontSize: "0.82rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        border: "none",
                        cursor: (isLoading || animPhase > 0) ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                        boxShadow: "0 4px 22px rgba(200,255,0,0.22)",
                        opacity: animPhase > 0 ? 0 : 1,
                        pointerEvents: animPhase > 0 ? "none" : "auto",
                      }}
                      onMouseEnter={e => {
                        if (!isLoading) {
                          e.currentTarget.style.boxShadow = "0 6px 32px rgba(200,255,0,0.38)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = "0 4px 22px rgba(200,255,0,0.22)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                      onMouseDown={e => {
                        if (!isLoading) {
                          e.currentTarget.style.transform = "scale(0.97)";
                          e.currentTarget.style.boxShadow = "0 2px 10px rgba(200,255,0,0.18)";
                        }
                      }}
                      onMouseUp={e => {
                        if (!isLoading) {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 6px 32px rgba(200,255,0,0.38)";
                        }
                      }}
                    >
                      {isLoading ? (
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                          <span style={{
                            width: 14, height: 14, borderRadius: "50%",
                            border: "2px solid rgba(0,0,0,0.3)",
                            borderTopColor: "#000",
                            display: "inline-block",
                            animation: "auth-spin 0.6s linear infinite",
                          }} />
                          Loading…
                        </span>
                      ) : BTN[formType]}
                    </button>

                    {/* Nav links */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.2rem" }}>
                      {formType === "login" && (
                        <button type="button" className="auth-link-btn" onClick={() => setFormType("signup")} style={linkStyle}>
                          No account? Create one ↗
                        </button>
                      )}
                      {(formType === "signup" || formType === "set-security") && (
                        <button type="button" className="auth-link-btn" onClick={() => setFormType("login")} style={linkStyle}>
                          Already have an account? Sign in ↗
                        </button>
                      )}
                      {formType === "forgot-email" && (
                        <button type="button" className="auth-link-btn auth-link-back" onClick={() => setFormType("login")} style={linkStyle}>
                          ← Back to sign in
                        </button>
                      )}
                      {formType === "verify-otp" && animPhase === 0 && (
                        <button type="button" className="auth-link-btn auth-link-back" onClick={() => { setFormType("forgot-email"); setOtpValue(""); }} style={linkStyle}>
                          ← Resend OTP
                        </button>
                      )}
                      {formType === "reset" && (
                        <button type="button" className="auth-link-btn auth-link-back" onClick={() => setFormType("login")} style={linkStyle}>
                          ← Back to sign in
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <p style={{
                  textAlign: "center", marginTop: "clamp(0.4rem, 1.2vh, 1.5rem)",
                  fontSize: "clamp(0.6rem, 1vh, 0.65rem)", color: "rgba(255,255,255,0.38)",
                  fontWeight: 500, letterSpacing: "0.03em",
                }}>
                  By continuing you agree to our Terms &amp; Privacy Policy.
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: "center", marginTop: "clamp(0.4rem, 1.2vh, 2rem)",
          fontSize: "clamp(0.55rem, 0.9vh, 0.62rem)", fontWeight: 700, letterSpacing: "0.18em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.28)",
          position: "relative", zIndex: 1,
        }}>
          © {new Date().getFullYear()} Muve𝄞 Music Corp
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .auth-left-panel { display: flex !important; }
          .auth-mobile-logo { display: none !important; }
        }

        /* ── Placeholder contrast ───────────────── */
        .auth-field-input::placeholder {
          color: rgba(255, 255, 255, 0.42);
          transition: color 0.2s;
        }
        .auth-field-input:focus::placeholder {
          color: rgba(255, 255, 255, 0.22);
        }

        /* ── Input hover (unfocused) ─────────────── */
        .auth-field-input:not(:focus):hover {
          border-color: rgba(255,255,255,0.24) !important;
          background: rgba(255,255,255,0.08) !important;
        }

        /* ── Nav link microinteractions ─────────── */
        .auth-link-btn:hover {
          color: rgba(255,255,255,0.9) !important;
          transform: translateX(3px);
        }
        .auth-link-back:hover {
          transform: translateX(-3px) !important;
        }

        /* ── Strobe border ──────────────────────── */
        .otp-sb-wrap { overflow: hidden; }
        .otp-sb-spin {
          position: absolute; inset: -100%; z-index: 0;
          background: conic-gradient(
            from 0deg,
            transparent      0deg,
            rgba(200,255,0,.1) 15deg,
            rgba(200,255,0,.9) 38deg,
            #ffffff           52deg,
            rgba(200,255,0,.9) 66deg,
            rgba(200,255,0,.1) 88deg,
            transparent      108deg
          );
          animation: otp-sb-spin 0.62s linear infinite;
        }
        @keyframes otp-sb-spin { to { transform: rotate(360deg); } }

        /* ── Card shuffle ───────────────────────── */
        @keyframes card-shuffle {
          0%   { transform: translateX(0)                      rotate(0deg); }
          38%  { transform: translateX(var(--sx))              rotate(var(--sr)); }
          68%  { transform: translateX(calc(var(--sx) * .32))  rotate(calc(var(--sr) * .28)); }
          100% { transform: translateX(0)                      rotate(0deg); }
        }

        /* ── Merge-fail (try to merge, bounce back) */
        @keyframes merge-fail {
          0%   { transform: translateX(0);                     opacity: 1; }
          40%  { transform: translateX(var(--mx));             opacity: 0.55; }
          100% { transform: translateX(0);                     opacity: 1; }
        }

        /* ── Shake ──────────────────────────────── */
        @keyframes otp-shake {
          0%,100% { transform: translateX(0); }
          14%     { transform: translateX(-10px); }
          28%     { transform: translateX(10px); }
          42%     { transform: translateX(-8px); }
          57%     { transform: translateX(8px); }
          71%     { transform: translateX(-5px); }
          85%     { transform: translateX(5px); }
        }

        /* ── Tick ───────────────────────────────── */
        @keyframes tick-pop {
          0%   { transform: scale(0); opacity: 0; }
          55%  { transform: scale(1.2);  opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes circle-draw {
          from { stroke-dasharray: 0 200; }
          to   { stroke-dasharray: 200 0; }
        }
        @keyframes check-draw { to { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  );
};

export default Auth;

const linkStyle = {
  background: "transparent",
  border: "none",
  color: "rgba(255,255,255,0.5)",
  fontWeight: 700,
  fontSize: "0.7rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
  textAlign: "left",
  padding: "0.1rem 0",
  transition: "color 0.2s, transform 0.2s",
  display: "inline-block",
};
