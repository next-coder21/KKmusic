import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiSearch, FiEye, FiTrash2, FiSend, FiCheck,
  FiX, FiImage, FiUsers, FiShield, FiUser, FiCalendar, FiSettings,
  FiGift, FiMusic, FiChevronRight, FiAlertCircle, FiLayers,
  FiCopy, FiRadio, FiZap
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PageHeader, Btn, card } from './AdminUI';

/* ─── Type config ─────────────────────────────────────────────────────────── */
const TC = {
  system:      { Icon: FiSettings,    label: 'System',      color: '#818cf8' },
  promo:       { Icon: FiGift,        label: 'Promo',       color: '#f59e0b' },
  new_release: { Icon: FiMusic,       label: 'Release',     color: '#34d399' },
  event:       { Icon: FiCalendar,    label: 'Event',       color: '#60a5fa' },
  maintenance: { Icon: FiAlertCircle, label: 'Maintenance', color: '#f87171' },
};

const ST = {
  sent:      { dot: '#4ade80', label: 'Transmitted', color: '#4ade80' },
  scheduled: { dot: '#f59e0b', label: 'Queued',      color: '#f59e0b' },
  draft:     { dot: 'var(--a-faint)', label: 'Draft', color: 'var(--a-muted)' },
};

const getStatus = (a) => a.sent_at ? 'sent' : a.scheduled_at ? 'scheduled' : 'draft';

/* ─── Section label ───────────────────────────────────────────────────────── */
const SL = ({ children, color = '#60a5fa' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
    <span style={{ width: 3, height: 14, borderRadius: 2, background: color, flexShrink: 0 }} />
    <span style={{ fontSize: 10, color: 'var(--a-muted)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>{children}</span>
    <div style={{ flex: 1, height: 1, background: 'var(--a-border)' }} />
  </div>
);

/* ─── Input style using CSS tokens ───────────────────────────────────────── */
const iSt = {
  width: '100%',
  background: 'var(--a-bg3)',
  border: '1px solid var(--a-border)',
  borderRadius: 8,
  padding: '9px 12px',
  color: 'var(--a-text)',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.12s',
};
const onFo = e => e.target.style.borderColor = '#60a5fa';
const onBl = e => e.target.style.borderColor = 'var(--a-border)';

/* ════════════════════════════════════════════════════════════════════════════ */
const AdminAnnouncements = ({ api }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState('none');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '', body: '', type: 'system', target: 'all',
    target_emails: [], action_url: '', action_label: '',
    scheduled_at: '', send_immediately: true,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const fileRef = useRef(null);

  /* ── Logic — all original, untouched ────────────────────────────────────── */
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const status = filter === 'all' ? '' : filter;
      const { data } = await api.get(`/announcements?status=${status}`);
      setAnnouncements(data.announcements || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchAnnouncements(); }, [filter, api]);

  const resetForm = () => {
    setFormData({ title: '', body: '', type: 'system', target: 'all', target_emails: [], action_url: '', action_label: '', scheduled_at: '', send_immediately: true });
    setImagePreview(null); setImageFile(null); setSelectedId(null);
  };

  const handleCreateNew = () => { resetForm(); setViewMode('compose'); };

  const handleEdit = (ann) => {
    if (ann.sent_at) { toast.error('Cannot edit a sent announcement'); return; }
    setFormData({ ...ann, send_immediately: !ann.scheduled_at, scheduled_at: ann.scheduled_at ? ann.scheduled_at.substring(0, 16) : '' });
    setImagePreview(ann.image_url); setSelectedId(ann.id); setViewMode('edit');
  };

  const compressImage = (file) => new Promise(res => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = ev => {
      const img = new Image();
      img.src = ev.target.result;
      img.onload = () => {
        const c = document.createElement('canvas');
        const sc = 800 / img.width;
        c.width = 800; c.height = img.height * sc;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        let url = c.toDataURL('image/jpeg', 0.7);
        if (url.length > 60000) url = c.toDataURL('image/jpeg', 0.5);
        res(url);
      };
    };
  });

  const handleImageChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setIsSubmitting(true);
    try { setImagePreview(await compressImage(f)); setImageFile(null); }
    catch { toast.error('Compression failed'); }
    finally { setIsSubmitting(false); }
  };

  const handlePreview = (id) => {
    const ann = announcements.find(a => a.id === id);
    if (ann) {
      setFormData({ ...ann, send_immediately: !ann.scheduled_at, scheduled_at: ann.scheduled_at ? ann.scheduled_at.substring(0, 16) : '' });
      setImagePreview(ann.image_url);
    }
    setSelectedId(id); setViewMode('preview');
  };

  const handleDuplicate = (ann) => {
    if (!ann) return;
    setFormData({ title: `${ann.title} (Copy)`, body: ann.body, type: ann.type, target: ann.target, target_emails: [...(ann.target_emails || [])], action_url: ann.action_url || '', action_label: ann.action_label || '', scheduled_at: '', send_immediately: true });
    setImagePreview(ann.image_url); setImageFile(null); setSelectedId(null); setViewMode('compose');
    toast.success('Copied to new draft');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(p => p.filter(a => a.id !== id));
      if (selectedId === id) setViewMode('none');
      toast.success('Deleted');
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed'); }
  };

  const handleAddEmail = (e) => {
    if (e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const em = emailInput.trim().replace(',', '');
    if (em && /^\S+@\S+\.\S+$/.test(em)) {
      if (!formData.target_emails.includes(em)) setFormData(p => ({ ...p, target_emails: [...p.target_emails, em] }));
      setEmailInput('');
    } else if (em) toast.error('Invalid email');
  };

  const removeEmail = (em) => setFormData(p => ({ ...p, target_emails: p.target_emails.filter(x => x !== em) }));

  const handleSave = async (isDraft = true) => {
    if (!formData.title.trim()) { toast.error('Title required'); return; }
    setIsSubmitting(true);
    const fd = new FormData();
    Object.keys(formData).forEach(k => {
      if (k === 'target_emails') fd.append(k, JSON.stringify(formData[k]));
      else if (k === 'scheduled_at' && formData.send_immediately) fd.append(k, '');
      else fd.append(k, formData[k]);
    });
    if (imageFile) fd.append('image', imageFile);
    else if (imagePreview && typeof imagePreview === 'string') fd.append('image_url', imagePreview);
    try {
      if (viewMode === 'edit') { await api.put(`/announcements/${selectedId}`, fd); toast.success('Updated'); }
      else { const r = await api.post('/announcements', fd); setSelectedId(r.data.id); toast.success('Draft saved'); }
      fetchAnnouncements();
      if (!isDraft) setShowConfirm(true);
    } catch { toast.error('Save failed'); }
    finally { setIsSubmitting(false); }
  };

  const handlePublish = async () => {
    if (!selectedId) { toast.error('No announcement selected'); return; }
    setIsSubmitting(true);
    try {
      const r = await api.post(`/announcements/${selectedId}/publish`);
      toast.success(`Sent to ${r.data.notified_count} users`);
      setShowConfirm(false); setViewMode('none'); fetchAnnouncements();
    } catch (err) { toast.error(err.response?.data?.error || 'Publish failed'); }
    finally { setIsSubmitting(false); }
  };

  const filtered = announcements.filter(a => a.title?.toLowerCase().includes(search.toLowerCase()));
  const selectedAnn = announcements.find(a => a.id === selectedId);

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="a-ann" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:1} }
        .a-ann-split { display:flex;gap:14px;flex:1;overflow:hidden; }
        .a-ann-left { width:36%;min-width:260px;display:flex;flex-direction:column;overflow:hidden; }
        .a-ann-right { flex:1;overflow:hidden;position:relative;display:flex;flex-direction:column; }
        @media(max-width:768px){
          .a-ann-split { flex-direction:column; }
          .a-ann-left,.a-ann-right { width:100%;height:100%;flex-shrink:0; }
          .a-ann-split.mobile-feed .a-ann-right { display:none!important; }
          .a-ann-split.mobile-detail .a-ann-left { display:none!important; }
        }
        .a-ann .feed-pill { padding:4px 10px;border-radius:6px;font-family:inherit;font-size:10px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:.06em;transition:all .12s; }
        .a-ann .feed-pill.active { border:1px solid rgba(96,165,250,.4);background:rgba(96,165,250,.1);color:#60a5fa; }
        .a-ann .feed-pill.inactive { border:1px solid var(--a-border);background:transparent;color:var(--a-muted); }
        .a-ann .feed-pill.inactive:hover { color:var(--a-text2);border-color:var(--a-border3); }
        .a-ann .small-icon-btn { padding:4px;background:none;border:none;cursor:pointer;color:var(--a-faint);border-radius:4px;display:flex;transition:color .12s; }
        .a-ann .small-icon-btn:hover { color:var(--a-muted); }
        .a-ann .small-icon-btn.del:hover { color:#f87171!important; }
        [data-admin-theme="dark"] .a-ann { --acc:#60a5fa; }
        [data-admin-theme="light"] .a-ann { --acc:#2563eb; }
      `}</style>

      <PageHeader
        title="Broadcasts"
        subtitle="Send announcements to your listeners"
        action={<Btn icon={FiPlus} onClick={handleCreateNew}>New Broadcast</Btn>}
      />

      <div className={`a-ann-split ${viewMode === 'none' ? 'mobile-feed' : 'mobile-detail'}`}>

        {/* ── LEFT FEED ────────────────────────────────────────────── */}
        <div className="a-ann-left" style={card}>
          <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid var(--a-border)' }}>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <FiSearch size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--a-faint)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                style={{ ...iSt, paddingLeft: 30, fontSize: 12 }} onFocus={onFo} onBlur={onBl} />
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {['all', 'draft', 'scheduled', 'sent'].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`feed-pill ${filter === f ? 'active' : 'inactive'}`}>{f}</button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {loading ? [...Array(5)].map((_, i) => (
              <div key={i} style={{ height: 68, borderRadius: 8, background: 'var(--a-border2)', marginBottom: 5, animation: 'shimmer 1.4s ease-in-out infinite' }} />
            )) : filtered.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.35 }}>
                <FiLayers size={28} style={{ color: 'var(--a-muted)', marginBottom: 10 }} />
                <p style={{ fontSize: 12, color: 'var(--a-muted)', margin: 0 }}>No broadcasts found</p>
              </div>
            ) : filtered.map((ann, i) => {
              const status = getStatus(ann);
              const tc = TC[ann.type] || TC.system;
              const sc = ST[status];
              const TypeIcon = tc.Icon;
              const active = selectedId === ann.id;

              return (
                <motion.div key={ann.id}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => ann.sent_at ? handlePreview(ann.id) : handleEdit(ann)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 9,
                    padding: '9px 10px 9px 11px', marginBottom: 4, borderRadius: 9,
                    cursor: 'pointer', transition: 'all 0.12s',
                    border: `1px solid ${active ? 'rgba(96,165,250,.25)' : 'var(--a-border)'}`,
                    borderLeft: `3px solid ${active ? '#60a5fa' : sc.dot}`,
                    background: active ? 'rgba(96,165,250,.05)' : 'transparent',
                  }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: `${tc.color}15`, border: `1px solid ${tc.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tc.color, flexShrink: 0, overflow: 'hidden' }}>
                    {ann.image_url ? <img src={ann.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <TypeIcon size={13} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                      <span style={{ fontSize: 9, color: tc.color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{tc.label}</span>
                      <span style={{ fontSize: 9, color: 'var(--a-border3)' }}>·</span>
                      <span style={{ fontSize: 9, color: 'var(--a-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {ann.target === 'all' ? 'All' : ann.target === 'verified' ? 'Verified' : `${ann.target_emails?.length || 0} users`}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--a-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ann.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: sc.dot }} />
                      <span style={{ fontSize: 9, color: sc.color, fontWeight: 600 }}>
                        {sc.label}{ann.sent_at && ` · ${new Date(ann.sent_at).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                    <button onClick={e => { e.stopPropagation(); handleDuplicate(ann); }} className="small-icon-btn" title="Duplicate">
                      <FiCopy size={11} />
                    </button>
                    {!ann.sent_at && (
                      <button onClick={e => { e.stopPropagation(); handleDelete(ann.id); }} className="small-icon-btn del" title="Delete">
                        <FiTrash2 size={11} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────────────── */}
        <div className="a-ann-right" style={card}>
          <AnimatePresence mode="wait">

            {viewMode === 'none' && (
              <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.3 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px dashed var(--a-border3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <FiRadio size={22} style={{ color: 'var(--a-faint)' }} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--a-faint)', margin: 0 }}>Select or create a broadcast</p>
              </motion.div>
            )}

            {viewMode === 'preview' && (
              <motion.div key="preview" initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -16, opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--a-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <button onClick={() => setViewMode('none')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>
                    <FiChevronRight size={12} style={{ transform: 'rotate(180deg)' }} /> Back
                  </button>
                  <span style={{ fontSize: 10, color: 'var(--a-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Syne',sans-serif" }}>Preview</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn variant="ghost" size="sm" icon={FiCopy} onClick={() => handleDuplicate(selectedAnn)}>Duplicate</Btn>
                    {!selectedAnn?.sent_at && <Btn size="sm" icon={FiSend} onClick={() => setShowConfirm(true)}>Send</Btn>}
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: 'var(--a-bg)' }}>
                  <div style={{ width: '100%', maxWidth: 360, background: 'var(--a-bg2)', border: '1px solid var(--a-border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.35)' }}>
                    {imagePreview && <div style={{ aspectRatio: '2/1', overflow: 'hidden' }}><img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
                    <div style={{ padding: 18 }}>
                      {(() => {
                        const tc = TC[formData.type] || TC.system;
                        const TI = tc.Icon;
                        return (
                          <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${tc.color}15`, border: `1px solid ${tc.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tc.color, flexShrink: 0 }}><TI size={14} /></div>
                            <div>
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--a-text)' }}>{formData.title || 'Broadcast Title'}</p>
                              <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--a-faint)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>KK Music Team</p>
                            </div>
                          </div>
                        );
                      })()}
                      <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--a-text2)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{formData.body || 'Message content...'}</p>
                      {formData.action_url && (
                        <button style={{ width: '100%', padding: 10, borderRadius: 8, background: 'linear-gradient(135deg,#60a5fa,#818cf8)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                          {formData.action_label || 'Action'}
                        </button>
                      )}
                    </div>
                    <div style={{ padding: '8px 18px', borderTop: '1px solid var(--a-border)', background: 'var(--a-bg3)' }}>
                      <p style={{ margin: 0, fontSize: 10, color: 'var(--a-faint)', textAlign: 'center', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Target: <span style={{ color: '#60a5fa' }}>{formData.target === 'all' ? 'All users' : formData.target === 'verified' ? 'Verified' : `${formData.target_emails.length} specific`}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {(viewMode === 'compose' || viewMode === 'edit') && (
              <motion.div key="compose" initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -16, opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--a-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiZap size={13} style={{ color: '#60a5fa' }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--a-text)', fontFamily: "'Syne',sans-serif" }}>{viewMode === 'edit' ? 'Edit Broadcast' : 'New Broadcast'}</span>
                  </div>
                  <button onClick={() => setViewMode('none')} style={{ padding: 5, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--a-faint)', display: 'flex' }}>
                    <FiX size={15} />
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 100px' }}>

                  <div style={{ marginBottom: 26 }}>
                    <SL color="#60a5fa">Content</SL>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <label style={{ fontSize: 10, color: 'var(--a-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>Title *</label>
                          <span style={{ fontSize: 10, color: formData.title.length > 240 ? '#f87171' : 'var(--a-faint)' }}>{formData.title.length}/255</span>
                        </div>
                        <input style={{ ...iSt, fontWeight: 600 }} placeholder="What's the announcement?" maxLength={255}
                          value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                          onFocus={onFo} onBlur={onBl} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, color: 'var(--a-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: "'Syne',sans-serif", marginBottom: 8 }}>Category</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {Object.entries(TC).map(([key, cfg]) => {
                            const Icon = cfg.Icon;
                            const active = formData.type === key;
                            return (
                              <button key={key} onClick={() => setFormData(p => ({ ...p, type: key }))}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 7, border: `1px solid ${active ? cfg.color + '40' : 'var(--a-border)'}`, background: active ? cfg.color + '12' : 'transparent', color: active ? cfg.color : 'var(--a-muted)', cursor: 'pointer', transition: 'all 0.12s', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', letterSpacing: '0.04em' }}>
                                <Icon size={11} /> {cfg.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, color: 'var(--a-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: "'Syne',sans-serif", marginBottom: 5 }}>Body</label>
                        <textarea style={{ ...iSt, resize: 'none', lineHeight: 1.65 }} rows={4}
                          placeholder="Describe your announcement..."
                          value={formData.body} onChange={e => setFormData(p => ({ ...p, body: e.target.value }))}
                          onFocus={onFo} onBlur={onBl} />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 26 }}>
                    <SL color="#818cf8">Banner Image</SL>
                    <div onClick={() => fileRef.current.click()}
                      style={{ border: `2px dashed ${imagePreview ? '#60a5fa' : 'var(--a-border)'}`, borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', background: imagePreview ? 'rgba(96,165,250,.04)' : 'transparent', transition: 'all 0.12s' }}>
                      <input type="file" ref={fileRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageChange} />
                      {imagePreview ? (
                        <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
                          <img src={imagePreview} alt="" style={{ width: '100%', aspectRatio: '2/1', objectFit: 'cover', borderRadius: 8 }} />
                          <button onClick={e => { e.stopPropagation(); setImagePreview(null); setImageFile(null); }}
                            style={{ position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <FiX size={10} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center' }}>
                          <FiImage size={24} style={{ color: 'var(--a-faint)', marginBottom: 8 }} />
                          <p style={{ margin: 0, fontSize: 11, color: 'var(--a-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Click to upload · PNG / JPG · Max 2MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: 26 }}>
                    <SL color="#34d399">Call to Action</SL>
                    <div className="a-ann-grid2" style={{ display: 'grid', gap: 10 }}>
                      <style>{`.a-ann-grid2 { grid-template-columns:1fr 1fr; } @media(max-width:600px){ .a-ann-grid2 { grid-template-columns:1fr; } }`}</style>
                      {[['Action URL', 'https://...', 'action_url'], ['Button Label', 'Listen now', 'action_label']].map(([lbl, ph, key]) => (
                        <div key={key}>
                          <label style={{ display: 'block', fontSize: 10, color: 'var(--a-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: "'Syne',sans-serif", marginBottom: 5 }}>{lbl}</label>
                          <input style={{ ...iSt, fontSize: 12 }} placeholder={ph} value={formData[key]} onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))} onFocus={onFo} onBlur={onBl} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 26 }}>
                    <SL color="#4ade80">Audience</SL>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                      {[{ id: 'all', label: 'All Users', Ic: FiUsers }, { id: 'verified', label: 'Verified', Ic: FiShield }, { id: 'specific', label: 'Specific', Ic: FiUser }].map(t => {
                        const active = formData.target === t.id;
                        return (
                          <button key={t.id} onClick={() => setFormData(p => ({ ...p, target: t.id }))}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 8px', borderRadius: 9, border: `1px solid ${active ? 'rgba(96,165,250,.3)' : 'var(--a-border)'}`, background: active ? 'rgba(96,165,250,.07)' : 'transparent', cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'inherit' }}>
                            <t.Ic size={16} style={{ color: active ? '#60a5fa' : 'var(--a-faint)' }} />
                            <span style={{ fontSize: 10, color: active ? '#60a5fa' : 'var(--a-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {formData.target === 'specific' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <div style={{ background: 'var(--a-bg3)', border: '1px solid var(--a-border)', borderRadius: 8, padding: 8, minHeight: 72, display: 'flex', flexWrap: 'wrap', gap: 5, alignContent: 'flex-start' }}>
                          {formData.target_emails.map(em => (
                            <span key={em} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(96,165,250,.1)', border: '1px solid rgba(96,165,250,.2)', borderRadius: 5, padding: '3px 7px', fontSize: 11, color: '#60a5fa' }}>
                              {em} <FiX size={10} style={{ cursor: 'pointer' }} onClick={() => removeEmail(em)} />
                            </span>
                          ))}
                          <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'var(--a-text)', flex: 1, minWidth: 180, fontFamily: 'inherit' }}
                            placeholder="Type email, press Enter..." value={emailInput} onChange={e => setEmailInput(e.target.value)} onKeyDown={handleAddEmail} />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div>
                    <SL color="#f59e0b">Scheduling</SL>
                    <div className="a-ann-grid2" style={{ display: 'grid', gap: 8 }}>
                      {[{ val: true, label: 'Send immediately' }, { val: false, label: 'Schedule later' }].map(opt => {
                        const active = formData.send_immediately === opt.val;
                        return (
                          <button key={String(opt.val)} onClick={() => setFormData(p => ({ ...p, send_immediately: opt.val }))}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 8, border: `1px solid ${active ? 'rgba(245,158,11,.3)' : 'var(--a-border)'}`, background: active ? 'rgba(245,158,11,.07)' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}>
                            <span style={{ fontSize: 12, color: active ? 'var(--a-text)' : 'var(--a-muted)', fontWeight: active ? 600 : 400 }}>{opt.label}</span>
                            {active && <FiCheck size={12} style={{ color: '#f59e0b' }} />}
                          </button>
                        );
                      })}
                    </div>
                    {!formData.send_immediately && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 10 }}>
                        <input type="datetime-local" style={{ ...iSt, fontSize: 12 }}
                          value={formData.scheduled_at} onChange={e => setFormData(p => ({ ...p, scheduled_at: e.target.value }))}
                          min={new Date(Date.now() + 5 * 60000).toISOString().substring(0, 16)}
                          onFocus={onFo} onBlur={onBl} />
                      </motion.div>
                    )}
                  </div>
                </div>

                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 18px', background: 'var(--a-bg2)', borderTop: '1px solid var(--a-border)', display: 'flex', justifyContent: 'flex-end', gap: 8, zIndex: 10 }}>
                  <Btn variant="ghost" onClick={() => handleSave(true)} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Draft'}</Btn>
                  <Btn variant="outline" icon={FiEye} onClick={() => setViewMode('preview')}>Preview</Btn>
                  <Btn icon={FiSend} onClick={() => handleSave(false)} disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Ready to Send'}</Btn>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Confirm modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showConfirm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirm(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }} />
            <motion.div initial={{ scale: 0.93, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.93, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              style={{ position: 'relative', zIndex: 10, ...card, width: '100%', maxWidth: 400, padding: 28, boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
              <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: 1, background: 'linear-gradient(90deg,transparent,rgba(96,165,250,.4),transparent)' }} />
              <div style={{ width: 44, height: 44, borderRadius: 11, background: 'rgba(96,165,250,.1)', border: '1px solid rgba(96,165,250,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: '#60a5fa' }}>
                <FiSend size={18} />
              </div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, textAlign: 'center', margin: '0 0 8px', color: 'var(--a-text)', letterSpacing: '-0.02em' }}>Confirm Transmission</h2>
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--a-muted)', margin: '0 0 20px', lineHeight: 1.6 }}>
                Sending <span style={{ color: 'var(--a-text)', fontWeight: 600 }}>"{formData.title}"</span> to{' '}
                <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {formData.target === 'all' ? 'all users' : formData.target === 'verified' ? 'verified fans' : `${formData.target_emails.length} users`}
                </span>. Cannot be undone.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
                {[['Type', TC[formData.type]?.label || formData.type], ['Target', formData.target], ['Image', imagePreview ? 'Yes' : 'No'], ['Send', formData.send_immediately ? 'Now' : 'Scheduled']].map(([k, v]) => (
                  <div key={k} style={{ padding: '7px 10px', borderRadius: 7, background: 'var(--a-bg3)', border: '1px solid var(--a-border)', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 2px', fontSize: 9, color: 'var(--a-faint)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{k}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--a-text)', fontWeight: 600, textTransform: 'capitalize' }}>{v}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Btn variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Btn>
                <Btn onClick={handlePublish} disabled={isSubmitting}>{isSubmitting ? 'Sending...' : formData.send_immediately ? 'Send Now' : 'Schedule'}</Btn>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAnnouncements;
