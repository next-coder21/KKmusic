import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../context/UserContext";
import ApiService from "../../services/ApiService";
import { WEBSITE_URL } from "../../config";

/* ── MUSIKLY Style Field ────────────────────────────────── */
const Field = ({ label, ...props }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-black tracking-widest uppercase text-black/50">{label}</label>
    <input 
      {...props}
      className="w-full px-4 py-3 border-2 sm:border-[3px] border-black bg-white text-black font-black text-sm uppercase outline-none focus:bg-[#CCFF00] transition-colors"
    />
  </div>
);

const TITLES = {
  login:  { h: "Sign in to \nyour vibes.",   sub: "Welcome back." },
  signup: { h: "Join the \nmuvement.",       sub: "Create account." },
  verify: { h: "Check your \ninbox.",        sub: "Verify email." },
  forgot: { h: "Forgot \npassword?",         sub: "Recovery code." },
  reset:  { h: "Set new \npassword.",        sub: "Update creds." },
};

const BTN = { 
  login: "Log in ↗", 
  signup: "Join now ↗", 
  verify: "Verify ↗", 
  forgot: "Send code ↗", 
  reset: "Update ↗" 
};

const Auth = () => {
  const [formType, setFormType] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let response;
      switch (formType) {
        case "login":
          response = await axios.post(`${ApiService.getBaseUrl()}/login`, { email, password }, { withCredentials: true });
          break;
        case "signup":
          if (password !== confirmPassword) throw new Error("Passwords do not match!");
          response = await axios.post(`${ApiService.getBaseUrl()}/register`, { name, email, password });
          break;
        case "forgot":
          response = await axios.post(`${ApiService.getBaseUrl()}/forgot-password`, { email });
          break;
        case "verify":
          response = await axios.post(`${ApiService.getBaseUrl()}/verify`, { email, otp });
          break;
        case "reset":
          if (newPassword !== confirmPassword) throw new Error("Passwords do not match!");
          response = await axios.post(`${ApiService.getBaseUrl()}/reset-password`, { email, otp, newPassword });
          break;
      }
      handleFormSuccess(response.data);
    } catch (error) { handleFormError(error); }
    finally { setIsLoading(false); }
  };

  const handleFormSuccess = (data) => {
    switch (formType) {
      case "login":
        localStorage.setItem("token", data.token);
        localStorage.setItem("isAuthenticated", "true");
        setUser(data.user); navigate("/"); break;
      case "signup": alert("Signup successful! Please verify your email."); setFormType("verify"); break;
      case "verify": alert("Email verified successfully!"); setFormType("login"); break;
      case "reset":  alert("Password reset successfully!"); setFormType("login"); break;
      case "forgot": alert("Code sent!"); setFormType("reset"); break;
    }
  };

  const handleFormError = (error) => {
    alert(error.response?.data?.message || error.message || "An error occurred.");
  };

  return (
    <div className="flex min-h-screen bg-white text-black overflow-x-hidden selection:bg-[#CCFF00] font-sans">
      
      {/* ══ LEFT PANEL (MAGAZINE STYLE) ═════════════════════ */}
      <div className="hidden lg:flex w-[35%] xl:w-[40%] bg-black relative flex-col justify-between p-10 overflow-hidden shrink-0">
        
        {/* Repeating Vertical Text */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-[#CCFF00] flex flex-col items-center justify-center gap-20 overflow-hidden">
          <span className="rotate-90 text-black font-black text-lg tracking-[0.3em] whitespace-nowrap">SIGN IN ↗</span>
          <span className="rotate-90 text-black font-black text-lg tracking-[0.3em] whitespace-nowrap">SIGN IN ↗</span>
          <span className="rotate-90 text-black font-black text-lg tracking-[0.3em] whitespace-nowrap">SIGN IN ↗</span>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-red-500" />
          <span className="text-white font-black text-xl tracking-tighter uppercase">Muve𝄞</span>
        </div>

        {/* Center Text */}
        <div>
          <div className="w-40 h-2 bg-gradient-to-r from-purple-600 via-red-500 to-[#CCFF00] mb-6" />
          <h1 className="text-white text-4xl xl:text-5xl font-black leading-[1] tracking-tighter uppercase mb-6">
            The sound <br/> of your <br/> freedom.
          </h1>
          <p className="text-white/40 font-bold text-sm max-w-[240px] leading-relaxed uppercase">
            Stream, discover, and audit your music journey with precision.
          </p>
        </div>

        {/* Bottom Detail */}
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 border-2 border-white/20 flex items-center justify-center text-white/40 font-black text-sm">↗</div>
           <span className="text-white/20 font-black uppercase text-[10px] tracking-widest">v1.4.0 MUVE MUSIC CORP</span>
        </div>
      </div>

      {/* ══ RIGHT PANEL (CLEAN FORM) ════════════════════════ */}
      <div className="flex-1 flex flex-col p-5 sm:p-10 lg:p-16 min-h-screen overflow-y-auto">
        
        {/* Mobile / Laptop Top Bar */}
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-red-500" />
            <span className="font-black text-base uppercase">Muve𝄞</span>
          </div>
          <a 
            href={WEBSITE_URL} 
            className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-black/40 hover:text-black transition-colors ml-auto"
          >
            <ArrowLeft size={14} className="max-sm:hidden" /> Back <span className="max-sm:hidden">to platform</span>
          </a>
        </div>

        <div className="flex-1 flex items-center justify-center max-sm:items-start">
          <div className="w-full max-w-[380px]">
            <AnimatePresence mode="wait">
              <motion.div key={formType}
                initial={{ opacity:0, y:10 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-10 }}
                transition={{ duration:0.3, ease:[0.2, 0.8, 0.2, 1] }}>

                <header className="mb-8 sm:mb-10">
                   <h2 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase leading-[0.95] whitespace-pre-line mb-3">
                     {TITLES[formType]?.h}
                   </h2>
                   <p className="font-bold text-black/30 text-sm sm:text-base uppercase italic tracking-tight">
                     {TITLES[formType]?.sub}
                   </p>
                </header>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
                  {formType === "signup" && (
                    <Field label="Full Name" type="text" placeholder="WHO ARE YOU?"
                      value={name} onChange={e => setName(e.target.value)} required />
                  )}
                  {(formType === "login" || formType === "signup" || formType === "forgot") && (
                    <Field label="Email" type="email" placeholder="YOUR@EMAIL.COM"
                      value={email} onChange={e => setEmail(e.target.value)} required />
                  )}
                  {(formType === "login" || formType === "signup") && (
                    <Field label="Password" type="password" placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)} required />
                  )}
                  {formType === "signup" && (
                    <Field label="Confirm" type="password" placeholder="••••••••"
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  )}

                  {(formType === "verify" || formType === "reset") && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black tracking-widest uppercase text-black/50">Verification Code</label>
                      <input type="text" placeholder="· · · · · ·"
                        value={otp} onChange={e => setOtp(e.target.value)} maxLength="6" required
                        className="w-full border-2 sm:border-[3px] border-black px-4 py-4 text-center text-2xl sm:text-3xl font-black tracking-[0.4em] outline-none focus:bg-[#CCFF00] transition-colors"
                      />
                    </div>
                  )}

                  {formType === "reset" && (
                    <>
                      <Field label="New Password" type="password" placeholder="••••••••"
                        value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                      <Field label="Confirm New" type="password" placeholder="••••••••"
                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    </>
                  )}

                  <div className="mt-2 flex flex-col gap-4 sm:gap-5">
                    <button
                      type="submit" disabled={isLoading}
                      className="w-full py-4 border-2 sm:border-[3px] border-black bg-[#CCFF00] text-black font-black uppercase text-lg hover:shadow-[-6px_6px_0_0_#000] active:translate-x-1 active:-translate-y-1 active:shadow-[-2px_2px_0_0_#000] transition-all disabled:opacity-50"
                    >
                      {isLoading ? "..." : BTN[formType]}
                    </button>

                    <div className="flex flex-col gap-3">
                      {formType === "login" && (
                        <>
                          <button type="button" onClick={() => setFormType("signup")} className="text-left font-black uppercase text-[10px] tracking-widest hover:underline">
                            Create account ↗
                          </button>
                          <button type="button" onClick={() => setFormType("forgot")} className="text-left font-black uppercase text-[10px] tracking-widest text-black/30 hover:underline">
                            Forgot password? ↗
                          </button>
                        </>
                      )}
                      {formType === "signup" && (
                        <button type="button" onClick={() => setFormType("login")} className="text-left font-black uppercase text-[10px] tracking-widest hover:underline">
                          Already have an account? Log in ↗
                        </button>
                      )}
                      {(formType === "forgot" || formType === "reset" || formType === "verify") && (
                        <button type="button" onClick={() => setFormType("login")} className="text-left font-black uppercase text-[10px] tracking-widest hover:underline">
                          ← Back to login
                        </button>
                      )}
                    </div>
                  </div>
                </form>

              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Credit */}
        <div className="pt-8 sm:pt-10 text-[9px] font-black uppercase tracking-[0.2em] text-black/15 text-center sm:text-left">
          &copy; {new Date().getFullYear()} Muve𝄞 music corp.
        </div>
      </div>

    </div>
  );
};

export default Auth;