import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { usePlayer } from "../../context/PlayerContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ApiService from "../../services/ApiService";
import { API_CONFIG } from "../../config";
import { FiCamera, FiMusic, FiClock, FiList, FiPlay, FiSave } from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import DefaultAvatar from "../../assets/avatardef.png";

const SectionTitle = ({ children, subtitle }) => (
  <div style={{ marginBottom: 40 }}>
    <h2 style={{ fontSize: "2.5rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.04em", margin: 0 }}>{children}</h2>
    {subtitle && <p style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 11, opacity: 0.4, letterSpacing: "0.1em", marginTop: 4 }}>{subtitle}</p>}
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

const UpdateProfile = () => {
  const { user, setUser } = useUser();
  const { setCurrentSongId, setQueueUpdated } = usePlayer();
  const navigate = useNavigate();

  const BASE = API_CONFIG.AUTH_URL; 

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    dob: user?.dob || "",
    gender: user?.gender || "Male",
    profileImage: user?.image
      ? (user.image.startsWith("data:image") ? user.image : `data:image/png;base64,${user.image}`)
      : DefaultAvatar,
    file: null,
  });

  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total_listens: 0, playlists_count: 0, listening_time_hrs: 0 });
  const [recentHistory, setRecentHistory] = useState([]);

  useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      try {
        const statsRes = await axios.get(`${BASE}/stats`, { withCredentials: true })
        setStats(statsRes.data);
        const historyRes = await axios.get(`${BASE}/play-history`, { withCredentials: true })
        setRecentHistory(historyRes.data || []);
      } catch {}
    };
    load();
  }, [user]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData(prev => ({ ...prev, file }));
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => setFormData(prev => ({ ...prev, profileImage: reader.result }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("name",   formData.name);
    fd.append("email",  formData.email);
    fd.append("dob",    formData.dob);
    fd.append("gender", formData.gender);
    if (formData.file) fd.append("image", formData.file);
    try {
      const response = await axios.post(`${BASE}/update-account`, fd,
        { headers: { "Content-Type": "multipart/form-data" }, withCredentials: true });
      setUser(response.data.user || { ...user, name: formData.name, dob: formData.dob, gender: formData.gender });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update profile.");
    } finally { setSaving(false); }
  };

  const playSong = async (id) => {
    if (!user?.email) return;
    try {
      await axios.post(`${API_CONFIG.QUEUE_URL}/add`, { email: user.email, songIds: [id], album: false });
      setCurrentSongId(id); setQueueUpdated(prev => !prev);
    } catch {}
  };

  return (
    <div style={{ padding: "40px 0" }}>
      <SectionTitle subtitle="Your identity and activity on Muve𝄞">Account Profile</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 60, alignItems: "start" }}>
        
        {/* ── PROFILE FORM ── */}
        <div style={{ padding: "40px", border: "4px solid #000", background: "#fff" }}>
           <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", gap: 30, alignItems: "center", marginBottom: 40 }}>
                 <div style={{ width: 100, height: 100, border: "4px solid #000", position: "relative", overflow: "hidden", flexShrink: 0 }}>
                    <img src={formData.profileImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Avatar" />
                    <label style={{ 
                      position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", 
                      display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, 
                      cursor: "pointer", transition: "opacity 0.2s" 
                    }} className="hover:opacity-100">
                      <FiCamera color="#fff" size={24} />
                      <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                    </label>
                 </div>
                 <div>
                    <h3 style={{ fontSize: "1.5rem", fontWeight: 900, margin: 0 }}>{formData.name || "UNNAMED"}</h3>
                    <p style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 10, opacity: 0.4, letterSpacing: "0.1em" }}>ID: {user?.email?.split('@')[0]}</p>
                 </div>
              </div>

              <MInput label="Display Name" name="name" value={formData.name} onChange={handleChange} placeholder="Required" required />
              <MInput label="Account Email" type="email" value={formData.email} disabled style={{ opacity: 0.3, background: "#f5f5f5", cursor: "not-allowed" }} />
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                 <MInput label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleChange} />
                 <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8, opacity: 0.5 }}>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} style={{ 
                       width: "100%", padding: "16px", background: "#fff", border: "3px solid #000",
                       fontWeight: 700, fontSize: 14, outline: "none", cursor: "pointer"
                    }}>
                       <option>Male</option>
                       <option>Female</option>
                       <option>Other</option>
                    </select>
                 </div>
              </div>

              <button type="submit" disabled={saving} style={{ 
                 width: "100%", padding: "20px", background: "#000", color: "#CCFF00", 
                 fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em",
                 border: "none", cursor: "pointer", marginTop: 20
              }}>
                 {saving ? "SAVING..." : "SAVE PROFILE ↗"}
              </button>
           </form>
        </div>

        {/* ── STATS & HISTORY ── */}
        <div>
           {/* Stats Grid */}
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 40 }}>
              {[
                { label: "Listen Count", value: stats.total_listens, color: "#CCFF00" },
                { label: "Active Playlists", value: stats.playlists_count, color: "#000", inverse: true },
              ].map(s => (
                <div key={s.label} style={{ 
                  padding: "30px", border: "4px solid #000", 
                  background: s.inverse ? "#000" : "#fff", color: s.inverse ? "#fff" : "#000" 
                }}>
                   <p style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 9, letterSpacing: "0.1em", opacity: 0.5 }}>{s.label}</p>
                   <h4 style={{ fontSize: "3rem", fontWeight: 900, margin: "10px 0 0" }}>{s.value}</h4>
                </div>
              ))}
           </div>

           {/* Recently Played */}
           <div style={{ padding: "40px", border: "4px solid #000", background: "#f5f5f5" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
                 <p style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 11 }}>Playback History</p>
                 <FiClock opacity={0.3} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                 {recentHistory.length > 0 ? recentHistory.slice(0, 5).map((song, i) => (
                    <div key={i} onClick={() => playSong(song.id)} className="group" style={{ 
                       padding: "12px", border: "2px solid #000", background: "#fff", 
                       display: "flex", alignItems: "center", gap: 14, cursor: "pointer" 
                    }}>
                       <div style={{ width: 25, fontSize: 10, fontWeight: 900, opacity: 0.2 }}>0{i+1}</div>
                       <div style={{ flex: 1, overflow: "hidden" }}>
                          <p style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 11, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</p>
                          <p style={{ fontWeight: 700, fontSize: 9, opacity: 0.4, margin: 0 }}>{song.artist_name}</p>
                       </div>
                       <div style={{ width: 32, height: 32, border: "2px solid #000", background: "#CCFF00", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FiPlay size={12} />
                       </div>
                    </div>
                 )) : <p style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 10, opacity: 0.2, textAlign: "center", padding: "40px 0" }}>NO HISTORY FOUND.</p>}
              </div>

              <button style={{ 
                width: "100%", background: "transparent", border: "2px solid #000", 
                padding: "16px", marginTop: 30, fontWeight: 900, textTransform: "uppercase", fontSize: 11, cursor: "pointer"
              }}>
                View All Activity ↗
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default UpdateProfile;
