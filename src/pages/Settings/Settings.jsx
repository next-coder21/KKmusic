import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import { User, Shield, Bell, Monitor, Trash2, LogOut, Save, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import ApiService from "../../services/ApiService";
import { API_CONFIG } from "../../config";
import axios from "axios";

const BASE = API_CONFIG.AUTH_URL; 

const TABS = {
  ACCOUNT:      'account',
  PRIVACY:      'privacy',
  NOTIFICATIONS:'notifications',
  SESSIONS:     'sessions',
};

const SectionHeader = ({ title, desc }) => (
  <div style={{ marginBottom: 40 }}>
    <h2 style={{ fontSize: "2.5rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.04em", margin: 0, color: "#000" }}>{title}</h2>
    {desc && <p style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 10, opacity: 0.4, letterSpacing: "0.1em", marginTop: 4 }}>{desc}</p>}
  </div>
);

const MInput = ({ label, ...props }) => (
  <div style={{ marginBottom: 24 }}>
    <label style={{ display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8, opacity: 0.5 }}>{label}</label>
    <input 
      {...props}
      style={{
        width: "100%", padding: "16px", background: "#fff", border: "3px solid #000",
        fontWeight: 700, fontSize: 14, outline: "none", transition: "all 0.1s",
        ...props.style
      }}
      onFocus={e => e.target.style.background = "#CCFF00"}
      onBlur={e => e.target.style.background = "#fff"}
    />
  </div>
);

const MToggle = ({ checked, onChange }) => (
  <button onClick={onChange} style={{ 
    width: 60, height: 32, background: checked ? "#CCFF00" : "#000", 
    border: "3px solid #000", cursor: "pointer", position: "relative", transition: "background 0.2s" 
  }}>
    <div style={{ 
      position: "absolute", top: 2, left: checked ? 30 : 2, 
      width: 22, height: 22, background: checked ? "#000" : "#fff",
      border: "2px solid #000", transition: "left 0.2s"
    }} />
  </button>
);

const MButton = ({ children, onClick, variant="primary", disabled, style }) => (
  <button onClick={onClick} disabled={disabled} style={{ 
    width: "100%", padding: "18px", background: variant === "danger" ? "#fff" : "#000", 
    color: variant === "danger" ? "#ff4444" : "#CCFF00", 
    border: variant === "danger" ? "3px solid #ff4444" : "3px solid #000",
    fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
    cursor: "pointer", transition: "all 0.15s", opacity: disabled ? 0.3 : 1,
    ...style
  }}>
    {children}
  </button>
);

const AccountTab = () => {
  const { user, setUser } = useUser();
  const [name, setName] = useState(user?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleUpdate = async (e) => {
    e.preventDefault(); setIsLoading(true);
    try {
      const fd = new FormData(); fd.append("name", name); fd.append("email", user.email);
      const r = await axios.post(`${BASE}/update-account`, fd, { headers:{"Content-Type":"multipart/form-data"}, withCredentials:true });
      setUser(r.data.user || { ...user, name });
      toast.success("Identity Updated");
    } catch { toast.error("Failed to update profile."); } finally { setIsLoading(false); }
  };

  return (
    <div>
      <SectionHeader title="User Identity" desc="Manage your personal credentials." />
      <div style={{ maxWidth: 500 }}>
         <form onSubmit={handleUpdate}>
            <MInput label="Full Name" value={name} onChange={e=>setName(e.target.value)} />
            <MInput label="Verified Email" value={user?.email||''} disabled style={{ opacity: 0.3, background: "#f5f5f5", cursor: "not-allowed" }} />
            <MButton disabled={isLoading} style={{ marginTop: 20 }}>{isLoading ? "UPDATING..." : "COMMIT CHANGES ↗"}</MButton>
         </form>

         <div style={{ marginTop: 60, padding: "30px", border: "4px solid #ff4444", background: "#fff" }}>
            <h4 style={{ color: "#ff4444", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: 13 }}>Danger Zone</h4>
            <p style={{ fontSize: 11, fontWeight: 700, margin: "8px 0 20px", opacity: 0.5 }}>PERMANENT DELETION OF ACCOUNT DATA. CANNOT BE UNDONE.</p>
            <MButton variant="danger">DESTROY ACCOUNT</MButton>
         </div>
      </div>
    </div>
  );
};

const PrivacyTab = () => {
  const [saveSearch, setSaveSearch] = useState(() => localStorage.getItem("kk-save-search")!=="false");
  const [savePlay,   setSavePlay  ] = useState(() => localStorage.getItem("kk-save-plays")!=="false");

  useEffect(() => {
    localStorage.setItem("kk-save-search", saveSearch);
    localStorage.setItem("kk-save-plays",  savePlay);
  }, [saveSearch, savePlay]);

  return (
    <div style={{ maxWidth: 600 }}>
       <SectionHeader title="Privacy Protocol" desc="Control how your data is logged." />
       
       <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {[
            { label: "Log Search Queries", checked: saveSearch, set: setSaveSearch, desc: "Records local search history for quick access." },
            { label: "Track Playback Events", checked: savePlay, set: setSavePlay, desc: "Saves listening history for personalized charts." }
          ].map(p => (
            <div key={p.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", border: "3px solid #000", background: "#fff" }}>
               <div>
                  <h4 style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 13, margin: 0 }}>{p.label}</h4>
                  <p style={{ fontSize: 10, fontWeight: 800, opacity: 0.4, margin: "4px 0 0" }}>{p.desc}</p>
               </div>
               <MToggle checked={p.checked} onChange={() => p.set(!p.checked)} />
            </div>
          ))}
       </div>

       <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <MButton variant="danger" style={{ border: "3px solid #000", color: "#000" }}>Clear Log</MButton>
          <MButton style={{ background: "#fff", color: "#000" }}>Export Data</MButton>
       </div>
    </div>
  );
};

// ─── MAIN ───
const Settings = () => {
  const [activeTab, setActiveTab] = useState(TABS.ACCOUNT);
  const navigate = useNavigate();

  const renderTab = () => ({
    [TABS.ACCOUNT]:      <AccountTab/>,
    [TABS.PRIVACY]:      <PrivacyTab/>,
    [TABS.NOTIFICATIONS]:<div style={{ opacity: 0.2, fontWeight: 900 }}>CHANNEL SYNC PENDING...</div>,
    [TABS.SESSIONS]:     <div style={{ opacity: 0.2, fontWeight: 900 }}>ACTIVE SESSION TRACKER PENDING...</div>,
  }[activeTab]);

  return (
    <div style={{ padding: "40px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 60, alignItems: "start" }}>
        
        {/* Navigation */}
        <div style={{ position: "sticky", top: 40 }}>
           <h1 style={{ fontSize: "1.2rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 40, borderBottom: "4px solid #000", paddingBottom: 10 }}>Preference</h1>
           <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { id: TABS.ACCOUNT,    icon: User,    label: "Account" },
                { id: TABS.PRIVACY,    icon: Shield,  label: "Protocol" },
                { id: TABS.NOTIFICATIONS, icon: Bell, label: "Alerts" },
                { id: TABS.SESSIONS,   icon: Monitor, label: "Security" },
              ].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ 
                   display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", 
                   background: activeTab === t.id ? "#000" : "transparent",
                   color: activeTab === t.id ? "#CCFF00" : "#000",
                   border: "none", cursor: "pointer", textAlign: "left", transition: "all 0.15s"
                }}>
                   <span style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.1em" }}>{t.label}</span>
                   {activeTab === t.id ? <ChevronRight size={14} /> : <t.icon size={14} opacity={0.3} />}
                </button>
              ))}
           </div>
        </div>

        {/* Content Area */}
        <div style={{ padding: "60px", border: "4px solid #000", background: "#f5f5f5" }}>
           <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                {renderTab()}
              </motion.div>
           </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default Settings;
