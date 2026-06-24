import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../../context/UserContext";
import { usePlayer } from "../../context/PlayerContext";
import { useNavigate } from "react-router-dom";
import http from "../../services/http";
import {
  FiCamera, FiClock, FiPlay, FiUser, FiHeadphones,
  FiList, FiHeart, FiEdit3, FiCalendar, FiMail,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import DefaultAvatar from "../../assets/avatardef.png";

/* ─────────────────────────────────────────────
   ANIMATION VARIANTS
───────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const cardHover = {
  rest:  { y: 0,  boxShadow: "0 0 0 0 transparent" },
  hover: { y: -3, boxShadow: "0 8px 32px rgba(200,255,0,0.08)" },
};

/* ─────────────────────────────────────────────
   SKELETON BONE
───────────────────────────────────────────── */
const Bone = ({ w = "100%", h = 16, r = 8, style = {} }) => (
  <div className="profile-skeleton-bone" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

/* ─────────────────────────────────────────────
   HERO SKELETON
───────────────────────────────────────────── */
const HeroSkeleton = () => (
  <div className="profile-hero">
    <div className="profile-hero-inner">
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <Bone w={104} h={104} r={52} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <Bone w={100} h={11} r={4} style={{ marginBottom: 12 }} />
          <Bone w={220} h={36} r={8} style={{ marginBottom: 10 }} />
          <Bone w={160} h={14} r={4} style={{ marginBottom: 20 }} />
          <div style={{ display: "flex", gap: 10 }}>
            <Bone w={100} h={32} r={999} />
            <Bone w={100} h={32} r={999} />
            <Bone w={100} h={32} r={999} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   FORM SKELETON
───────────────────────────────────────────── */
const FormSkeleton = () => (
  <div className="profile-card profile-form-card">
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
      <Bone w={3} h={20} r={2} />
      <Bone w={140} h={16} r={4} />
    </div>
    <Bone w={80} h={10} r={4} style={{ marginBottom: 10 }} />
    <Bone h={48} r={10} style={{ marginBottom: 24 }} />
    <Bone w={80} h={10} r={4} style={{ marginBottom: 10 }} />
    <Bone h={48} r={10} style={{ marginBottom: 24 }} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
      {[0, 1].map(i => (
        <div key={i}>
          <Bone w={60} h={10} r={4} style={{ marginBottom: 10 }} />
          <Bone h={48} r={10} />
        </div>
      ))}
    </div>
    <Bone h={52} r={10} />
  </div>
);

/* ─────────────────────────────────────────────
   RIGHT COLUMN SKELETON
───────────────────────────────────────────── */
const RightSkeleton = () => (
  <div>
    <div className="profile-stats-row" style={{ marginBottom: 28 }}>
      {[0, 1, 2].map(i => (
        <div key={i} className="profile-card" style={{ padding: "20px 16px" }}>
          <Bone w={60} h={10} r={4} style={{ marginBottom: 12 }} />
          <Bone w={50} h={36} r={6} />
        </div>
      ))}
    </div>
    <div className="profile-card" style={{ padding: 24 }}>
      <Bone w={160} h={14} r={4} style={{ marginBottom: 20 }} />
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <Bone w={36} h={36} r={18} />
          <div style={{ flex: 1 }}>
            <Bone h={12} r={4} style={{ marginBottom: 6 }} />
            <Bone w="60%" h={10} r={4} />
          </div>
          <Bone w={32} h={32} r={16} />
        </div>
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   STAT PILL (hero row)
───────────────────────────────────────────── */
const StatPill = ({ icon: Icon, value, label }) => (
  <div className="profile-stat-pill">
    <Icon size={13} aria-hidden="true" />
    <span className="profile-stat-pill-value">{value}</span>
    <span className="profile-stat-pill-label">{label}</span>
  </div>
);

/* ─────────────────────────────────────────────
   STAT CARD (right column)
───────────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, index }) => (
  <motion.div
    className="profile-card profile-stat-card"
    variants={cardHover}
    initial="rest"
    whileHover="hover"
    custom={index}
  >
    <div className="profile-stat-icon-wrap">
      {Icon && <Icon size={14} />}
    </div>
    <div className="profile-stat-value">{value ?? 0}</div>
    <div className="profile-stat-label">{label}</div>
  </motion.div>
);

/* ─────────────────────────────────────────────
   FIELD WRAPPER
───────────────────────────────────────────── */
const DarkInput = ({ label, icon: Icon, disabled, ...props }) => (
  <div style={{ marginBottom: 20 }}>
    <label className="profile-input-label">
      {Icon && <Icon size={11} style={{ display: "inline", marginRight: 5, opacity: 0.6 }} aria-hidden="true" />}
      {label}
    </label>
    <input
      {...props}
      disabled={disabled}
      className={`profile-input${disabled ? " profile-input--disabled" : ""}`}
    />
  </div>
);

const DarkSelect = ({ label, icon: Icon, ...props }) => (
  <div style={{ marginBottom: 20 }}>
    <label className="profile-input-label">
      {Icon && <Icon size={11} style={{ display: "inline", marginRight: 5, opacity: 0.6 }} aria-hidden="true" />}
      {label}
    </label>
    <select {...props} className="profile-input profile-select">{props.children}</select>
  </div>
);

/* ─────────────────────────────────────────────
   SECTION HEADER (Settings-style)
───────────────────────────────────────────── */
const SectionHeader = ({ title, desc }) => (
  <div className="profile-section-header">
    <div className="profile-section-accent-bar" aria-hidden="true" />
    <div>
      <h3 className="profile-section-title">{title}</h3>
      {desc && <p className="profile-section-desc">{desc}</p>}
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   HISTORY ROW
───────────────────────────────────────────── */
const HistoryRow = ({ song, index, onPlay }) => {
  const [hovered, setHovered] = useState(false);

  const thumb = song.cover_image
    ? (song.cover_image.startsWith("data:") ? song.cover_image : `data:image/jpeg;base64,${song.cover_image}`)
    : null;

  return (
    <motion.div
      className={`profile-history-row${hovered ? " profile-history-row--hovered" : ""}`}
      variants={fadeUp}
      custom={index * 0.5}
      initial="hidden"
      animate="visible"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onPlay(song.id)}
    >
      <div className="profile-history-thumb">
        {thumb
          ? <img src={thumb} alt={song.title} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
          : <FiHeadphones size={14} style={{ opacity: 0.4 }} aria-hidden="true" />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="profile-history-title">{song.title}</p>
        <p className="profile-history-artist">{song.artist_name || "Unknown Artist"}</p>
      </div>
      <button
        className="profile-history-play"
        aria-label={`Play ${song.title}`}
        onClick={e => { e.stopPropagation(); onPlay(song.id); }}
      >
        <FiPlay size={11} aria-hidden="true" />
      </button>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
const UpdateProfile = () => {
  const { user, setUser } = useUser();
  const { setCurrentSongId, setQueueUpdated } = usePlayer();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name:         user?.name   || "",
    email:        user?.email  || "",
    dob:          user?.dob ? user.dob.split('T')[0] : "",
    gender:       user?.gender ?? "",
    profileImage: user?.image
      ? (user.image.startsWith("data:image") ? user.image : `data:image/png;base64,${user.image}`)
      : DefaultAvatar,
    file: null,
  });

  const [saving,        setSaving]        = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [stats,         setStats]         = useState({ total_listens: 0, playlists_count: 0, favourites_count: 0, listening_time_hrs: 0 });
  const [recentHistory, setRecentHistory] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    setFormData(prev => ({
      ...prev,
      name:   user.name   || "",
      email:  user.email  || "",
      dob:    user.dob ? user.dob.split("T")[0] : "",
      gender: user.gender ?? "",
    }));
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, historyRes] = await Promise.all([
          http.get("/auth/stats"),
          http.get("/auth/play-history"),
        ]);
        setStats(statsRes.data || {});
        setRecentHistory(historyRes.data || []);
      } catch {
        /* non-fatal */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const isDirty = !user || (
    formData.name   !== (user.name   || "") ||
    formData.dob    !== (user.dob ? user.dob.split("T")[0] : "") ||
    formData.gender !== (user.gender ?? "") ||
    formData.file   !== null
  );

  const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData(prev => ({ ...prev, file }));
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => setFormData(prev => ({ ...prev, profileImage: reader.result }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("name",   formData.name);
    fd.append("email",  formData.email);
    if (formData.dob) fd.append("dob", formData.dob);
    fd.append("gender", formData.gender);
    if (formData.file) fd.append("image", formData.file);
    try {
      const response = await http.post("/auth/update-account", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(response.data.user || { ...user, name: formData.name, dob: formData.dob, gender: formData.gender });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const playSong = async id => {
    if (!user?.email) return;
    try {
      await http.post("/auth/queue/add", { songIds: [id], album: false });
      setCurrentSongId(id);
      setQueueUpdated(prev => !prev);
    } catch {
      /* silent */
    }
  };

  const listeningHrs = stats.listening_time_hrs != null
    ? `${Number(stats.listening_time_hrs).toFixed(1)}h`
    : "0h";

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <motion.div
      className="profile-page"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >

      {/* ══════════════════════════════
          HERO SECTION
      ══════════════════════════════ */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="hero-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HeroSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="hero"
            className="profile-hero"
            variants={fadeUp}
            custom={0}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
          >
            {/* Decorative gradient blob */}
            <div className="profile-hero-blob" aria-hidden="true" />

            <div className="profile-hero-inner">
              {/* Eyebrow */}
              <div className="profile-hero-eyebrow">
                <FiUser size={12} aria-hidden="true" />
                <span>Your Account</span>
              </div>

              <div className="profile-hero-row">
                {/* Avatar */}
                <div className="profile-hero-avatar-wrap">
                  <div className="profile-avatar-ring">
                    <img
                      src={formData.profileImage}
                      alt={formData.name || "Avatar"}
                      className="profile-avatar-img"
                    />
                    <label
                      className="profile-avatar-overlay"
                      aria-label="Change profile photo"
                      tabIndex={0}
                      onKeyDown={e => e.key === "Enter" && fileInputRef.current?.click()}
                    >
                      <FiCamera size={18} aria-hidden="true" />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        hidden
                      />
                    </label>
                  </div>
                </div>

                {/* Info */}
                <div className="profile-hero-info">
                  <h1 className="profile-hero-name">{formData.name || "Unnamed"}</h1>
                  <p className="profile-hero-email">
                    <FiMail size={11} aria-hidden="true" />
                    {user?.email || ""}
                  </p>

                  {/* Stat pills */}
                  <div className="profile-hero-pills">
                    <StatPill icon={FiHeadphones} value={stats.total_listens ?? 0} label="Plays" />
                    <StatPill icon={FiClock}      value={listeningHrs}             label="Listened" />
                    <StatPill icon={FiHeart}      value={stats.favourites_count ?? 0} label="Favourites" />
                    <StatPill icon={FiList}       value={stats.playlists_count ?? 0} label="Playlists" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════
          TWO-COLUMN GRID
      ══════════════════════════════ */}
      <div className="profile-grid">

        {/* ── LEFT COLUMN ── */}
        <div className="profile-left">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="form-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <FormSkeleton />
              </motion.div>
            ) : (
              <motion.div
                key="form-content"
                className="profile-card profile-form-card"
                variants={fadeUp}
                custom={1}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
              >
                <SectionHeader
                  title="Edit Profile"
                  desc="Update your display name, date of birth, and gender."
                />

                <form onSubmit={handleSubmit}>
                  <DarkInput
                    label="Display Name"
                    icon={FiEdit3}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your display name"
                    required
                  />

                  <DarkInput
                    label="Account Email"
                    icon={FiMail}
                    type="email"
                    value={formData.email}
                    disabled
                  />

                  <div className="profile-form-row">
                    <DarkInput
                      label="Date of Birth"
                      icon={FiCalendar}
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                    />
                    <DarkSelect
                      label="Gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </DarkSelect>
                  </div>

                  <button
                    type="submit"
                    disabled={saving || !isDirty}
                    className={`profile-save-btn${saving ? " profile-save-btn--loading" : ""}${!isDirty ? " profile-save-btn--disabled" : ""}`}
                    aria-busy={saving}
                  >
                    {saving ? (
                      <>
                        <span className="profile-save-spinner" aria-hidden="true" />
                        Saving…
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="profile-right">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="right-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RightSkeleton />
              </motion.div>
            ) : (
              <motion.div key="right-content" initial="hidden" animate="visible" exit={{ opacity: 0 }}>

                {/* Stat cards */}
                <motion.div className="profile-stats-row" variants={fadeUp} custom={1}>
                  <StatCard label="Listen Count" value={stats.total_listens}   icon={FiHeadphones} index={0} />
                  <StatCard label="Playlists"    value={stats.playlists_count} icon={FiList}       index={1} />
                  <StatCard label="Favourites"   value={stats.favourites_count}icon={FiHeart}      index={2} />
                </motion.div>

                {/* Playback history */}
                <motion.div className="profile-card profile-history-card" variants={fadeUp} custom={2}>
                  <div className="profile-history-header">
                    <div className="profile-section-accent-bar" aria-hidden="true" />
                    <FiClock size={14} className="profile-history-clock" aria-hidden="true" />
                    <h3 className="profile-history-heading">Playback History</h3>
                  </div>

                  <div className="profile-history-list">
                    {recentHistory.length > 0 ? (
                      recentHistory.slice(0, 10).map((song, i) => (
                        <HistoryRow key={song.id ?? i} song={song} index={i} onPlay={playSong} />
                      ))
                    ) : (
                      <motion.div
                        className="profile-history-empty"
                        variants={fadeUp}
                        custom={0}
                        initial="hidden"
                        animate="visible"
                      >
                        <FiClock size={28} className="profile-history-empty-icon" aria-hidden="true" />
                        <p className="profile-history-empty-text">No history yet</p>
                        <p className="profile-history-empty-sub">Songs you play will appear here.</p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
};

export default UpdateProfile;
