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

  // ── Data ──────────────────────────────────────────────────────────────────
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

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditAd(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (ad) => {
    setEditAd(ad);
    setForm({ 
      title: ad.title, 
      image_url: ad.banner_image_url || '', 
      link_url: ad.target_url || '', 
      is_active: ad.is_active 
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditAd(null); setForm(EMPTY_FORM); };

  // ── CRUD ──────────────────────────────────────────────────────────────────
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
    <div>
      {!loading && activeAd && (
        <Card style={{ marginBottom: 20, border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.04)', display: 'flex', alignItems: 'center', gap: 16 }} p={14}>
          <img src={activeAd.banner_image_url} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #222', flexShrink: 0 }} onError={e => e.target.style.display='none'} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#4ade80', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>● Live Ad</p>
            <p style={{ margin: '2px 0 0', fontSize: 14, color: '#e5e7eb', fontWeight: 600 }}>{activeAd.title}</p>
          </div>
          {activeAd.target_url && <a href={activeAd.target_url} target="_blank" rel="noreferrer" style={{ color: '#ec4899', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>View Link ↗</a>}
          <button onClick={() => toggleActive(activeAd)} style={{ padding: '6px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Deactivate
          </button>
        </Card>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <PageHeader
          title="Advertisements"
          subtitle={`${ads.length} ad${ads.length !== 1 ? 's' : ''} configured`}
        />
        <Btn variant="primary" onClick={openCreate}>
          <FiPlus size={14} /> New Ad
        </Btn>
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
                    <div style={{ width: 64, height: 42, borderRadius: 6, overflow: 'hidden', border: '1px solid #222', background: '#111' }}>
                      <img src={ad.banner_image_url} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                    </div>
                  </Td>
                  <Td>{ad.title}</Td>
                  <Td muted>
                    {ad.target_url
                      ? <a href={ad.target_url} target="_blank" rel="noreferrer" style={{ color: '#ec4899', textDecoration: 'none', fontSize: 12 }}>Open ↗</a>
                      : '—'}
                  </Td>
                  <Td muted>{new Date(ad.created_at).toLocaleDateString()}</Td>
                  <Td>
                    {ad.is_active
                      ? <Tag color="#4ade80">Active</Tag>
                      : <Tag color="#6b7280">Inactive</Tag>}
                  </Td>
                  <Td right>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => toggleActive(ad)}
                        title={ad.is_active ? 'Deactivate' : 'Set Active'}
                        style={{ padding: 6, borderRadius: 6, border: '1px solid #1f1f1f', background: 'transparent', color: ad.is_active ? '#ef4444' : '#4ade80', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', lineHeight: 1 }}
                        onMouseEnter={e => e.currentTarget.style.background = '#181818'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {ad.is_active ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                      <button
                        onClick={() => openEdit(ad)}
                        title="Edit"
                        style={{ padding: 6, borderRadius: 6, border: '1px solid #1f1f1f', background: 'transparent', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#181818'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        title="Delete"
                        style={{ padding: 6, borderRadius: 6, border: '1px solid transparent', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
          </tbody>
        )}
      </TableWrap>

      <Modal open={modalOpen} onClose={closeModal} title={editAd ? 'Edit Advertisement' : 'New Advertisement'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Ad Title *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Summer Premium Sale"
            autoFocus
          />
          <Input
            label="Banner Image URL"
            value={form.image_url}
            onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
            placeholder="https://example.com/banner.jpg"
          />
          {form.image_url && (
            <div style={{ width: '100%', height: 160, borderRadius: 8, overflow: 'hidden', border: '1px solid #1f1f1f', background: '#0a0a0a' }}>
              <img src={form.image_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.src = ''} />
            </div>
          )}
          <Input
            label="Target URL (Optional)"
            value={form.link_url}
            onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
            placeholder="https://your-promo.com"
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#e5e7eb', cursor: 'pointer', userSelect: 'none', padding: '10px 12px', borderRadius: 8, background: form.is_active ? 'rgba(74,222,128,0.06)' : '#0a0a0a', border: '1px solid', borderColor: form.is_active ? 'rgba(74,222,128,0.2)' : '#1f1f1f', transition: 'all 0.15s' }}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              style={{ accentColor: '#4ade80', width: 16, height: 16, cursor: 'pointer' }}
            />
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Set as Active Ad</p>
              <p style={{ margin: 0, fontSize: 11, color: '#4b5563' }}>This ad will appear as a popup when users open the app.</p>
            </div>
          </label>
        </div>
        <ModalFooter onCancel={closeModal} onSubmit={handleSubmit} submitLabel={editAd ? 'Update Ad' : 'Create Ad'} loading={saving} />
      </Modal>
    </div>
  );
};

export default AdminAds;
