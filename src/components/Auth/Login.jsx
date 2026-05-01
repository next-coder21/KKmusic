import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../context/UserContext";
import http from "../../services/http";
import { WEBSITE_URL } from "../../config";

/* ─── Form field component ─────────────────────────────── */
const Field = ({ label, icon, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label style={{
        fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.18em",
        textTransform: "uppercase", color: focused ? "#C8FF00" : "rgba(255,255,255,0.35)",
        transition: "color 0.2s ease",
      }}>
        {icon && <span style={{ marginRight: "0.35rem" }}>{icon}</span>}
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          {...props}
          onFocus={e => { setFocused(true); props.onFocus?.(e); }}
          onBlur={e => { setFocused(false); props.onBlur?.(e); }}
          style={{
            width: "100%",
            padding: "0.875rem 1.1rem",
            background: focused ? "rgba(200,255,0,0.04)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${focused ? "rgba(200,255,0,0.5)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: "10px",
            color: "#fff",
            fontSize: "0.9rem",
            fontWeight: 600,
            fontFamily: "inherit",
            outline: "none",
            transition: "all 0.25s ease",
            boxShadow: focused ? "0 0 0 3px rgba(200,255,0,0.08), 0 0 20px rgba(200,255,0,0.06)" : "none",
          }}
        />
      </div>
    </div>
  );
};

/* ─── Content per form state ────────────────────────────── */
const TITLES = {
  login:            { h: "Sign in to\nyour vibes.",     sub: "Welcome back to the stream." },
  signup:           { h: "Join the\nmuvement.",          sub: "Create your Muve𝄞 account." },
  "set-security":   { h: "One last\nstep.",              sub: "Set a secret keyword to protect your account." },
  "check-security": { h: "Verify\nyourself.",            sub: "Enter your secret keyword to continue." },
  reset:            { h: "Set new\npassword.",           sub: "Choose something strong." },
};
const BTN = {
  login:            "Sign in ↗",
  signup:           "Continue ↗",
  "set-security":   "Create account ↗",
  "check-security": "Verify ↗",
  reset:            "Update password ↗",
};

/* ─── Left panel decorative stat ───────────────────────── */
const LeftStat = ({ value, label }) => (
  <div>
    <p style={{ fontSize: "1.6rem", fontWeight: 900, color: "#C8FF00", letterSpacing: "-0.03em" }}>{value}</p>
    <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.14em", textTransform: "uppercase" }}>{label}</p>
  </div>
);

/* ─── Animated waveform decoration ─────────────────────── */
const Waveform = () => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "36px" }}>
    {[18, 28, 12, 36, 22, 32, 16, 26, 10, 30, 20, 24, 14, 32, 18].map((h, i) => (
      <div
        key={i}
        style={{
          width: "3px",
          height: `${h}px`,
          borderRadius: "2px",
          background: i % 3 === 0 ? "#C8FF00" : "rgba(200,255,0,0.35)",
          animation: `wave-${(i % 4) + 1} ${1.2 + (i % 4) * 0.3}s ease-in-out infinite`,
          animationDelay: `${i * 0.08}s`,
        }}
      />
    ))}
    <style>{`
      @keyframes wave-1 { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.4)} }
      @keyframes wave-2 { 0%,100%{transform:scaleY(0.6)} 50%{transform:scaleY(1)} }
      @keyframes wave-3 { 0%,100%{transform:scaleY(1)} 33%{transform:scaleY(0.3)} 66%{transform:scaleY(0.8)} }
      @keyframes wave-4 { 0%,100%{transform:scaleY(0.5)} 50%{transform:scaleY(1)} }
    `}</style>
  </div>
);

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
  const [isLoading, setIsLoading]             = useState(false);
  const { setUser }                           = useUser();
  const navigate                              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let response;
      switch (formType) {
        case "login":
          response = await http.post("/auth/login", { email, password });
          break;

        case "signup":
          // Just validate locally then move to security step — no API call yet
          if (password !== confirmPassword) throw new Error("Passwords do not match");
          setFormType("set-security");
          setSecurityAnswer("");
          setIsLoading(false);
          return;

        case "set-security":
          response = await http.post("/auth/register", { name, email, password, securityAnswer });
          break;

        case "check-security":
          response = await http.post("/auth/verify-security", { email, securityAnswer });
          break;

        case "reset":
          if (newPassword !== confirmPassword) throw new Error("Passwords do not match");
          response = await http.post("/auth/reset-password", { email, securityAnswer, newPassword });
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
        navigate("/");
        break;
      case "set-security":
        toast.success("Account created! Sign in to get started.");
        setFormType("login");
        setPassword(""); setConfirmPassword(""); setSecurityAnswer("");
        break;
      case "check-security":
        toast.success("Keyword verified. Set your new password.");
        setFormType("reset");
        break;
      case "reset":
        toast.success("Password updated.");
        setSecurityAnswer("");
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
      minHeight: "100vh",
      background: "#07070f",
      color: "#fff",
      overflow: "hidden",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* ══ LEFT PANEL ═════════════════════════════════════════ */}
      <div style={{
        display: "none",
        width: "42%",
        flexShrink: 0,
        background: "#000",
        position: "relative",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "2.5rem",
        overflow: "hidden",
      }} className="auth-left-panel">

        <div style={{
          position: "absolute", top: "-80px", left: "-80px",
          width: 360, height: 360, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "-40px",
          width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,255,0,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 48,
          background: "#C8FF00",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: "5rem", overflow: "hidden",
        }}>
          {["MUVE𝄞 ↗", "MUVE𝄞 ↗", "MUVE𝄞 ↗"].map((t, i) => (
            <span key={i} style={{
              transform: "rotate(90deg)",
              color: "#000", fontWeight: 900, fontSize: "0.75rem",
              letterSpacing: "0.25em", whiteSpace: "nowrap",
            }}>{t}</span>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: "1rem" }}>𝄞</span>
          </div>
          <span style={{ fontWeight: 900, fontSize: "1.1rem", letterSpacing: "-0.03em", color: "#fff" }}>
            KK-lisn
          </span>
        </div>

        <div style={{ paddingRight: "3rem" }}>
          <Waveform />
          <div style={{
            width: 64, height: 2,
            background: "linear-gradient(90deg, #7c3aed, #C8FF00)",
            margin: "1.5rem 0",
            borderRadius: 1,
          }} />
          <h1 style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 900, lineHeight: 1.0,
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
            color: "#fff",
            marginBottom: "1.25rem",
          }}>
            The sound<br />of your<br />
            <span style={{ color: "#C8FF00" }}>freedom.</span>
          </h1>
          <p style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: "0.8rem", fontWeight: 600,
            lineHeight: 1.7, textTransform: "uppercase",
            letterSpacing: "0.06em", maxWidth: "240px",
          }}>
            Stream, discover, and feel every track — powered by AI and built for the obsessed.
          </p>
        </div>

        <div style={{
          display: "flex", gap: "2.5rem",
          paddingRight: "3rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
          <LeftStat value="99.9%" label="Lyrics Accuracy" />
          <LeftStat value="50+" label="Languages" />
          <LeftStat value="24-bit" label="Lossless" />
        </div>
      </div>

      {/* ══ RIGHT PANEL ════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "2rem",
        minHeight: "100vh",
        overflowY: "auto",
        position: "relative",
      }}>

        <div style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 60% 10%, rgba(124,58,237,0.08) 0%, transparent 60%)",
        }} />

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "2.5rem", position: "relative", zIndex: 1,
        }}>
          <div className="auth-mobile-logo" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#fff", fontSize: "0.85rem" }}>𝄞</span>
            </div>
            <span style={{ fontWeight: 900, fontSize: "1rem", letterSpacing: "-0.03em", color: "#fff" }}>
              KK-lisn
            </span>
          </div>

          <a
            href={WEBSITE_URL}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              fontSize: "0.72rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.3)",
              textDecoration: "none",
              transition: "color 0.2s ease",
              marginLeft: "auto",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
          >
            <ArrowLeft size={12} />
            Back to platform
          </a>
        </div>

        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", zIndex: 1,
        }}>
          <div style={{ width: "100%", maxWidth: "400px" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={formType}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "20px",
                  padding: "2.5rem",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
                }}>

                  {/* Header */}
                  <div style={{ marginBottom: "2rem" }}>
                    <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.5rem" }}>
                      {["login", "signup"].map(type => (
                        <div key={type} style={{
                          width: (type === formType || (type === "signup" && ["set-security"].includes(formType))) ? 24 : 6,
                          height: 4, borderRadius: 2,
                          background: (type === formType || (type === "signup" && ["set-security"].includes(formType))) ? "#C8FF00" : "rgba(255,255,255,0.12)",
                          transition: "all 0.3s ease",
                        }} />
                      ))}
                    </div>

                    <h2 style={{
                      fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
                      fontWeight: 900, lineHeight: 1.05,
                      letterSpacing: "-0.035em",
                      textTransform: "uppercase",
                      whiteSpace: "pre-line",
                      color: "#fff",
                      marginBottom: "0.6rem",
                    }}>
                      {TITLES[formType]?.h}
                    </h2>
                    <p style={{
                      fontSize: "0.82rem", color: "rgba(255,255,255,0.38)",
                      fontWeight: 600, letterSpacing: "0.04em",
                    }}>
                      {TITLES[formType]?.sub}
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                    {formType === "signup" && (
                      <Field label="Full Name" icon="👤" type="text" placeholder="Your name"
                        value={name} onChange={e => setName(e.target.value)} required />
                    )}

                    {(formType === "login" || formType === "signup" || formType === "check-security") && (
                      <Field label="Email" icon="✉" type="email" placeholder="you@example.com"
                        value={email} onChange={e => setEmail(e.target.value)} required />
                    )}

                    {(formType === "login" || formType === "signup") && (
                      <Field label="Password" icon="🔑" type="password" placeholder="••••••••"
                        value={password} onChange={e => setPassword(e.target.value)} required />
                    )}

                    {formType === "signup" && (
                      <Field label="Confirm Password" icon="🔑" type="password" placeholder="••••••••"
                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    )}

                    {(formType === "set-security" || formType === "check-security") && (
                      <div>
                        <Field
                          label="Secret Keyword"
                          icon="🛡️"
                          type="text"
                          placeholder="e.g. sunshine, guitar, 42..."
                          value={securityAnswer}
                          onChange={e => setSecurityAnswer(e.target.value)}
                          required
                        />
                        {formType === "set-security" && (
                          <p style={{
                            marginTop: "0.5rem",
                            fontSize: "0.72rem",
                            color: "rgba(255,255,255,0.28)",
                            fontWeight: 600,
                            lineHeight: 1.5,
                          }}>
                            Remember this keyword — you'll need it to reset your password.
                          </p>
                        )}
                      </div>
                    )}

                    {formType === "reset" && (
                      <>
                        <Field label="New Password" icon="🔑" type="password" placeholder="••••••••"
                          value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                        <Field label="Confirm New Password" icon="🔑" type="password" placeholder="••••••••"
                          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                      </>
                    )}

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      style={{
                        marginTop: "0.5rem",
                        width: "100%",
                        padding: "0.9rem",
                        borderRadius: "10px",
                        background: isLoading ? "rgba(200,255,0,0.5)" : "#C8FF00",
                        color: "#000",
                        fontWeight: 900,
                        fontSize: "0.85rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        border: "none",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: "0 4px 20px rgba(200,255,0,0.2)",
                      }}
                      onMouseEnter={e => {
                        if (!isLoading) {
                          e.currentTarget.style.boxShadow = "0 6px 28px rgba(200,255,0,0.35)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = "0 4px 20px rgba(200,255,0,0.2)";
                        e.currentTarget.style.transform = "translateY(0)";
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

                    {/* Navigation links */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.25rem" }}>
                      {formType === "login" && (
                        <>
                          <button type="button" onClick={() => setFormType("signup")} style={linkStyle}>
                            No account? Create one ↗
                          </button>
                          <button type="button" onClick={() => { setFormType("check-security"); setSecurityAnswer(""); }} style={{ ...linkStyle, color: "rgba(255,255,255,0.22)" }}>
                            Forgot password?
                          </button>
                        </>
                      )}
                      {(formType === "signup" || formType === "set-security") && (
                        <button type="button" onClick={() => setFormType("login")} style={linkStyle}>
                          Already have an account? Sign in ↗
                        </button>
                      )}
                      {(formType === "check-security" || formType === "reset") && (
                        <button type="button" onClick={() => setFormType("login")} style={linkStyle}>
                          ← Back to sign in
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <p style={{
                  textAlign: "center", marginTop: "1.5rem",
                  fontSize: "0.68rem", color: "rgba(255,255,255,0.18)",
                  fontWeight: 600, letterSpacing: "0.04em",
                }}>
                  By continuing you agree to our Terms &amp; Privacy Policy.
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div style={{
          textAlign: "center", marginTop: "2rem",
          fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.12)",
          position: "relative", zIndex: 1,
        }}>
          © {new Date().getFullYear()} Muve𝄞 Music Corp
        </div>
      </div>

      <style>{`
        @keyframes auth-spin {
          to { transform: rotate(360deg); }
        }
        @media (min-width: 1024px) {
          .auth-left-panel { display: flex !important; }
          .auth-mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Auth;

/* ─── Link button shared style ──────────────────────────── */
const linkStyle = {
  background: "transparent",
  border: "none",
  color: "rgba(255,255,255,0.4)",
  fontWeight: 700,
  fontSize: "0.72rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
  textAlign: "left",
  padding: "0.1rem 0",
  transition: "color 0.2s ease",
  textDecoration: "none",
};
