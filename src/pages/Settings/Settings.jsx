import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import { User, Shield, Bell, Monitor, Trash2, LogOut, Save, ChevronRight, Clock } from "lucide-react";
import { FiMonitor, FiSmartphone, FiShield } from "react-icons/fi";
import toast from "react-hot-toast";
import http from "../../services/http";
import "./Settings.css";

const TABS = {
  ACCOUNT:       "account",
  PRIVACY:       "privacy",
  NOTIFICATIONS: "notifications",
  SESSIONS:      "sessions",
};

// ─── SECTION HEADER ───────────────────────────────────────────
const SectionHeader = ({ title, desc }) => (
  <div className="settings-section-header">
    <div className="settings-section-header__accent-bar" aria-hidden="true" />
    <div>
      <h2 className="settings-section-header__title">{title}</h2>
      {desc && <p className="settings-section-header__desc">{desc}</p>}
    </div>
  </div>
);

// ─── MINPUT ───────────────────────────────────────────────────
const MInput = ({ label, id, disabled, ...props }) => {
  const inputId = id || `minput-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="settings-input-wrap">
      <label htmlFor={inputId} className="settings-input-label">
        {label}
      </label>
      <input
        id={inputId}
        disabled={disabled}
        className={`settings-input${disabled ? " settings-input--disabled" : ""}`}
        {...props}
      />
    </div>
  );
};

// ─── MTOGGLE ──────────────────────────────────────────────────
const MToggle = ({ checked, onChange, "aria-label": ariaLabel }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={onChange}
    className={`settings-toggle${checked ? " settings-toggle--on" : ""}`}
  >
    <span className="settings-toggle__thumb" />
  </button>
);

// ─── MBUTTON ──────────────────────────────────────────────────
const MButton = ({ children, onClick, variant = "primary", disabled, className = "" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`settings-btn settings-btn--${variant}${disabled ? " settings-btn--disabled" : ""} ${className}`}
  >
    {children}
  </button>
);

// ─── ACCOUNT TAB ──────────────────────────────────────────────
const AccountTab = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("email", user.email);
      const r = await http.post("/auth/update-account", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(r.data.user || { ...user, name });
      toast.success("Identity Updated");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDestroyAccount = async () => {
    const confirmed = window.confirm(
      "This will permanently delete your account and all associated data. This action cannot be undone.\n\nType OK to confirm."
    );
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      await http.delete("/auth/account");
      localStorage.clear();
      setUser(null);
      navigate("/login");
    } catch {
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const initials = (user?.name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      <SectionHeader title="User Identity" desc="Manage your personal credentials." />

      {/* Avatar */}
      <div className="settings-avatar-wrap">
        <div className="settings-avatar" aria-label="Profile avatar">
          <span className="settings-avatar__initials">{initials}</span>
          <div className="settings-avatar__overlay" aria-hidden="true">
            <User size={18} />
          </div>
        </div>
        <div>
          <p className="settings-avatar__name">{user?.name || "—"}</p>
          <p className="settings-avatar__email">{user?.email || "—"}</p>
        </div>
      </div>

      <div className="settings-form-wrap">
        <form onSubmit={handleUpdate}>
          <MInput
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <MInput
            label="Verified Email"
            value={user?.email || ""}
            disabled
          />
          <MButton disabled={isLoading} className="settings-btn--full">
            {isLoading ? "UPDATING…" : "COMMIT CHANGES ↗"}
          </MButton>
        </form>

        {/* Danger zone */}
        <div className="settings-danger-zone">
          <h4 className="settings-danger-zone__title">Danger Zone</h4>
          <p className="settings-danger-zone__desc">
            PERMANENT DELETION OF ACCOUNT DATA. CANNOT BE UNDONE.
          </p>
          <MButton variant="danger" className="settings-btn--full" onClick={handleDestroyAccount} disabled={isDeleting}>
            {isDeleting ? "DELETING…" : "DESTROY ACCOUNT"}
          </MButton>
        </div>
      </div>
    </div>
  );
};

// ─── PRIVACY TAB ──────────────────────────────────────────────
const PrivacyTab = () => {
  const [saveSearch, setSaveSearch] = useState(
    () => localStorage.getItem("kk-save-search") !== "false"
  );
  const [savePlay, setSavePlay] = useState(
    () => localStorage.getItem("kk-save-plays") !== "false"
  );
  const [clearingLog, setClearingLog] = useState(false);
  const [logCleared, setLogCleared]   = useState(false);

  useEffect(() => {
    localStorage.setItem("kk-save-search", saveSearch);
    localStorage.setItem("kk-save-plays", savePlay);
  }, [saveSearch, savePlay]);

  const handleClearLog = async () => {
    setClearingLog(true);
    try {
      await http.delete("/auth/play-history");
      setLogCleared(true);
      toast.success("Play history cleared");
      setTimeout(() => setLogCleared(false), 3000);
    } catch {
      toast.error("Failed to clear history");
    } finally {
      setClearingLog(false);
    }
  };

  const toggleRows = [
    {
      label: "Log Search Queries",
      checked: saveSearch,
      set: setSaveSearch,
      desc: "Records local search history for quick access.",
    },
    {
      label: "Track Playback Events",
      checked: savePlay,
      set: setSavePlay,
      desc: "Saves listening history for personalized charts.",
    },
  ];

  return (
    <div className="settings-privacy-wrap">
      <SectionHeader title="Privacy Protocol" desc="Control how your data is logged." />

      <div className="settings-toggle-list">
        {toggleRows.map((row, i) => (
          <div key={row.label} className="settings-toggle-row">
            <div className="settings-toggle-row__text">
              <h4 className="settings-toggle-row__label">{row.label}</h4>
              <p className="settings-toggle-row__desc">{row.desc}</p>
            </div>
            <MToggle
              checked={row.checked}
              onChange={() => row.set(!row.checked)}
              aria-label={row.label}
            />
          </div>
        ))}
      </div>

      <div className="settings-privacy-actions">
        <MButton variant="ghost" onClick={handleClearLog} disabled={clearingLog}>
          {logCleared ? "Cleared ✓" : clearingLog ? "Clearing…" : "Clear Log"}
        </MButton>
        <MButton variant="ghost" disabled title="Coming soon">Export Data</MButton>
      </div>
    </div>
  );
};

// ─── COMING SOON ──────────────────────────────────────────────
const ComingSoon = ({ title, message }) => (
  <div
    role="status"
    aria-label={`${title} — coming soon`}
    className="settings-coming-soon"
  >
    <Clock size={40} aria-hidden="true" className="settings-coming-soon__icon" />
    <h3 className="settings-coming-soon__title">{title}</h3>
    <p className="settings-coming-soon__body">
      {message ||
        "This feature is under construction and will be available in a future update."}
    </p>
  </div>
);

// ─── SESSIONS TAB ─────────────────────────────────────────────
function relativeTime(dateStr) {
  if (!dateStr) return "Unknown";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hrs   = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)  return "Just now";
  if (mins < 60) return `${mins} minutes ago`;
  if (hrs  < 24) return `${hrs} ${hrs === 1 ? "hour" : "hours"} ago`;
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

const SessionsTab = () => {
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [revoking,  setRevoking]  = useState(null);

  useEffect(() => {
    let alive = true;
    http.get("/auth/sessions")
      .then(r => { if (alive) setSessions(r.data || []); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const handleRevoke = async (sessionId) => {
    setRevoking(sessionId);
    try {
      await http.delete(`/auth/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success("Session revoked");
    } catch {
      toast.error("Failed to revoke session");
    } finally {
      setRevoking(null);
    }
  };

  const skeletonRows = Array.from({ length: 3 });

  return (
    <div>
      <SectionHeader title="Active Sessions" desc="Manage devices that have access to your account." />

      {loading ? (
        <div className="sessions-list">
          {skeletonRows.map((_, i) => (
            <div key={i} className="session-row">
              <div className="session-row__icon-wrap" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="settings-skel" style={{ width: 18, height: 18, borderRadius: 4 }} />
              </div>
              <div className="session-row__body">
                <div className="settings-skel" style={{ width: "40%", height: 12, marginBottom: 6 }} />
                <div className="settings-skel" style={{ width: "60%", height: 10 }} />
              </div>
              <div className="settings-skel" style={{ width: 64, height: 30, borderRadius: 8 }} />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="settings-coming-soon" style={{ padding: "48px 24px" }}>
          <FiShield size={40} className="settings-coming-soon__icon" aria-hidden="true" />
          <h3 className="settings-coming-soon__title">No Active Sessions</h3>
          <p className="settings-coming-soon__body">No other devices are signed in to your account.</p>
        </div>
      ) : (
        <div className="sessions-list">
          {sessions.map((session, i) => {
            const isCurrent  = i === 0;
            const isMobileDevice = (session.device_type || "").toLowerCase().includes("mobile");
            const DeviceIcon = isMobileDevice ? FiSmartphone : FiMonitor;

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.045 }}
                className={`session-row${isCurrent ? " session-row--current" : ""}`}
              >
                <div className="session-row__icon-wrap" aria-hidden="true">
                  <DeviceIcon size={18} />
                </div>
                <div className="session-row__body">
                  <div className="session-row__device">
                    {session.device_type || (isMobileDevice ? "Mobile" : "Web Browser")}
                    {isCurrent && (
                      <span className="session-row__current-badge">Current</span>
                    )}
                  </div>
                  <div className="session-row__meta">
                    {session.ip_address && <span>{session.ip_address}</span>}
                    {session.ip_address && <span className="session-row__dot" aria-hidden="true">·</span>}
                    <span>{relativeTime(session.last_active)}</span>
                  </div>
                </div>
                {!isCurrent && (
                  <button
                    onClick={() => handleRevoke(session.id)}
                    disabled={revoking === session.id}
                    aria-label={`Revoke session from ${session.device_type || "this device"}`}
                    className="session-revoke-btn"
                  >
                    {revoking === session.id ? "Revoking…" : "Revoke"}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────
const Settings = () => {
  const [activeTab, setActiveTab] = useState(TABS.ACCOUNT);

  const tabs = [
    { id: TABS.ACCOUNT,       icon: User,    label: "Account" },
    { id: TABS.PRIVACY,       icon: Shield,  label: "Protocol" },
    { id: TABS.NOTIFICATIONS, icon: Bell,    label: "Alerts" },
    { id: TABS.SESSIONS,      icon: Monitor, label: "Security" },
  ];

  const renderTab = () =>
    ({
      [TABS.ACCOUNT]:       <AccountTab />,
      [TABS.PRIVACY]:       <PrivacyTab />,
      [TABS.NOTIFICATIONS]: (
        <ComingSoon
          title="Alerts"
          message="Push and email notification controls are coming in an upcoming release."
        />
      ),
      [TABS.SESSIONS]: <SessionsTab />,
    }[activeTab]);

  return (
    <div className="settings-page">
      {/* Decorative lime radial glow — top-right corner */}
      <div className="settings-page__glow" aria-hidden="true" />

      <div className="settings-layout">
        {/* ── Sidebar ── */}
        <aside className="settings-sidebar">
          <p className="settings-sidebar__eyebrow">Preferences</p>
          <nav aria-label="Settings navigation">
            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`settings-nav-item${isActive ? " settings-nav-item--active" : ""}`}
                >
                  <t.icon
                    size={15}
                    aria-hidden="true"
                    className="settings-nav-item__icon"
                  />
                  <span className="settings-nav-item__label">{t.label}</span>
                  {isActive && (
                    <ChevronRight
                      size={12}
                      aria-hidden="true"
                      className="settings-nav-item__chevron"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Content Panel ── */}
        <div className="settings-content-panel">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;
