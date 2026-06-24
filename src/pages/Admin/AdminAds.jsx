import React, { useEffect, useState } from 'react';
import { FiImage, FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiEdit2, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PageHeader, Card, Tag, Empty, SkeletonRows, Th, Td, Tr, TableWrap, Btn, Modal, Input, ModalFooter } from './AdminUI';

const EMPTY_FORM = { title: '', image_url: '', link_url: '', is_active: true };

const AdminAds = ({ api }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAd, setEditAd] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  /* ── Data ──────────────────────────────────────────────────────────────── */
  const fetchAds = async () => {
    try {
      const { data } = await api.get('/ads');
      setAds(data);
    } catch {
      toast.error('Failed to load ads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, [api]);

  /* ── Modal helpers ────────────────────────────────────────────────────── */
  const openCreate = () => { setEditAd(null); setForm(EMPTY_FORM); setModalOpen(true); };

  const openEdit = (ad) => {
    setEditAd(ad);
    setForm({ title: ad.title, image_url: ad.banner_image_url || '', link_url: ad.target_url || '', is_active: ad.is_active });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditAd(null); setForm(EMPTY_FORM); };

  /* ── CRUD ──────────────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      if (editAd) {
        await api.patch(`/ads/${editAd.id}`, form);
        toast.success('Ad updated');
      } else {
        await api.post('/ads', form);
        toast.success('Ad created');
      }
      closeModal();
      fetchAds();
    } catch (err) {
      console.error(err);
      toast.error(editAd ? 'Failed to update ad' : 'Failed to create ad');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (ad) => {
    try {
      await api.patch(`/ads/${ad.id}`, { is_active: !ad.is_active });
      toast.success(ad.is_active ? 'Ad deactivated' : 'Ad is now live!');
      fetchAds();
    } catch {
      toast.error('Failed to toggle ad status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this ad?')) return;
    try {
      await api.delete(`/ads/${id}`);
      toast.success('Ad deleted');
      setAds(prev => prev.filter(a => a.id !== id));
    } catch {
      toast.error('Failed to delete ad');
    }
  };

  const activeAd = ads.find(a => a.is_active);

  return (
    <div className="a-ads">
      <style>{`
        .a-ads .icon-btn {
          padding:6px;border-radius:6px;border:1px solid var(--a-border);
          background:transparent;cursor:pointer;display:flex;align-items:center;
          transition:all .12s;color:var(--a-muted);
        }
        .a-ads .icon-btn:hover { background:var(--a-hover);color:var(--a-text2); }
        .a-ads .icon-btn.toggle-on { color:#f87171; }
        .a-ads .icon-btn.toggle-on:hover { color:#fca5a5; }
        .a-ads .icon-btn.toggle-off { color:#4ade80; }
        .a-ads .icon-btn.toggle-off:hover { color:#86efac; }
        .a-ads .icon-btn.delete { border-color:transparent;color:var(--a-faint); }
        .a-ads .icon-btn.delete:hover { color:#f87171!important;background:rgba(248,113,113,.08)!important; }
        [data-admin-theme="dark"] .a-ads { --acc:#fb923c; }
        [data-admin-theme="light"] .a-ads { --acc:#ea580c; }
      `}</style>

      {/* Live ad banner */}
      {!loading && activeAd && (
        <Card style={{ marginBottom: 20, border: '1px solid rgba(74,222,128,.3)', background: 'rgba(74,222,128,.04)', display: 'flex', alignItems: 'center', gap: 16 }} p={14}>
          <img src={activeAd.banner_image_url} alt={activeAd.title}
            style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--a-border3)', flexShrink: 0 }}
            onError={e => e.target.style.display = 'none'} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#4ade80', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Syne',sans-serif" }}>● Live Ad</p>
            <p style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--a-text)', fontWeight: 600 }}>{activeAd.title}</p>
          </div>
          {activeAd.target_url && (
            <a href={activeAd.target_url} target="_blank" rel="noreferrer"
              style={{ color: '#fb923c', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
              View Link ↗
            </a>
          )}
          <button onClick={() => toggleActive(activeAd)}
            style={{ padding: '6px 12px', borderRadius: 6, background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.2)', color: '#f87171', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s' }}>
            Deactivate
          </button>
        </Card>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <PageHeader
          title="Advertisements"
          subtitle={`${ads.length} ad${ads.length !== 1 ? 's' : ''} configured`}
        />
        <Btn variant="primary" onClick={openCreate} icon={FiPlus}>New Ad</Btn>
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>Preview</Th>
            <Th>Title</Th>
            <Th>Link</Th>
            <Th>Created</Th>
            <Th>Status</Th>
            <Th right>Actions</Th>
          </tr>
        </thead>
        {loading ? <SkeletonRows cols={6} rows={5} /> : (
          <tbody>
            {ads.length === 0
              ? <tr><td colSpan={6}><Empty message="No ads yet. Create one to show it to users on login." /></td></tr>
              : ads.map(ad => (
                <Tr key={ad.id}>
                  <Td>
                    <div style={{ width: 64, height: 42, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--a-border3)', background: 'var(--a-bg3)' }}>
                      <img src={ad.banner_image_url} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => e.target.style.display = 'none'} />
                    </div>
                  </Td>
                  <Td><span style={{ color: 'var(--a-text)', fontSize: 13, fontWeight: 500 }}>{ad.title}</span></Td>
                  <Td muted>
                    {ad.target_url
                      ? <a href={ad.target_url} target="_blank" rel="noreferrer" style={{ color: '#fb923c', textDecoration: 'none', fontSize: 12 }}>Open ↗</a>
                      : '—'}
                  </Td>
                  <Td muted>{new Date(ad.created_at).toLocaleDateString()}</Td>
                  <Td>
                    {ad.is_active
                      ? <Tag color="#4ade80">Active</Tag>
                      : <Tag color="var(--a-muted)">Inactive</Tag>}
                  </Td>
                  <Td right>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => toggleActive(ad)} title={ad.is_active ? 'Deactivate' : 'Set Active'}
                        className={`icon-btn ${ad.is_active ? 'toggle-on' : 'toggle-off'}`}
                        style={{ fontSize: 18, lineHeight: 1 }}>
                        {ad.is_active ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                      <button onClick={() => openEdit(ad)} title="Edit" className="icon-btn">
                        <FiEdit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(ad.id)} title="Delete" className="icon-btn delete">
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))
            }
          </tbody>
        )}
      </TableWrap>

      <Modal open={modalOpen} onClose={closeModal} title={editAd ? 'Edit Advertisement' : 'New Advertisement'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Ad Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Summer Premium Sale" autoFocus />
          <Input label="Banner Image URL" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://example.com/banner.jpg" />
          {form.image_url && (
            <div style={{ width: '100%', height: 160, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--a-border)', background: 'var(--a-bg3)' }}>
              <img src={form.image_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.src = ''} />
            </div>
          )}
          <Input label="Target URL (Optional)" value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder="https://your-promo.com" />
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
            color: 'var(--a-text)', cursor: 'pointer', userSelect: 'none',
            padding: '10px 12px', borderRadius: 8,
            background: form.is_active ? 'rgba(74,222,128,.06)' : 'var(--a-bg3)',
            border: `1px solid ${form.is_active ? 'rgba(74,222,128,.2)' : 'var(--a-border)'}`,
            transition: 'all .15s',
          }}>
            <input type="checkbox" checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              style={{ accentColor: '#4ade80', width: 16, height: 16, cursor: 'pointer' }} />
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Set as Active Ad</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--a-muted)' }}>This ad will appear as a popup when users open the app.</p>
            </div>
          </label>
        </div>
        <ModalFooter onCancel={closeModal} onSubmit={handleSubmit} submitLabel={editAd ? 'Update Ad' : 'Create Ad'} loading={saving} />
      </Modal>
    </div>
  );
};

export default AdminAds;
