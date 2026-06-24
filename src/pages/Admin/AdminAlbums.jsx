import React, { useEffect, useState } from 'react';
import { FiTrash2, FiPlus, FiDisc, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PageHeader, Btn, Tag, Empty, SkeletonRows, Th, Td, Tr, TableWrap, Modal, Input, FormRow, ModalFooter, Cover, Pagination, card } from './AdminUI';

const iStyle = {
  width: '100%',
  background: 'var(--a-bg3)',
  border: '1px solid var(--a-border)',
  borderRadius: 8,
  padding: '9px 12px',
  color: 'var(--a-text)',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color .12s',
};

const AdminAlbums = ({ api }) => {
  const [albums,  setAlbums ] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving,    setSaving  ] = useState(false);
  const [form, setForm] = useState({ title: '', artist_id: '', cover_url: '' });
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [al, ar] = await Promise.all([api.get('/albums'), api.get('/artists')]);
      setAlbums(al.data); setArtists(ar.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [api]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete album and its songs?')) return;
    try { await api.delete(`/albums/${id}`); setAlbums(a => a.filter(x => x.id !== id)); toast.success('Album deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const saveAlbum = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = { title: form.title, artist_id: form.artist_id || null, cover_url: form.cover_url || null };
      if (editingAlbum) {
        await api.patch(`/albums/${editingAlbum.id}`, payload);
        toast.success('Album updated');
      } else {
        await api.post('/albums', payload);
        toast.success('Album added');
      }
      setShowModal(false); setEditingAlbum(null); setForm({ title: '', artist_id: '', cover_url: '' }); fetchAll();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const openEdit = (al) => {
    setEditingAlbum(al);
    setForm({ title: al.title || '', artist_id: al.artist_id || '', cover_url: al.cover_url || '' });
    setShowModal(true);
  };

  const paginated = albums.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="a-albums">
      <style>{`
        .a-albums .row-icon-btn { padding:5px 8px;border-radius:6px;background:transparent;border:1px solid transparent;cursor:pointer;color:var(--a-faint);transition:all .12s;display:inline-flex; }
        .a-albums .row-icon-btn.edit:hover { color:#34d399!important;border-color:rgba(52,211,153,.25)!important;background:rgba(52,211,153,.08)!important; }
        .a-albums .row-icon-btn.danger:hover { color:#f87171!important;border-color:rgba(248,113,113,.25)!important;background:rgba(248,113,113,.08)!important; }
        [data-admin-theme="dark"] .a-albums { --acc:#34d399; }
        [data-admin-theme="light"] .a-albums { --acc:#059669; }
      `}</style>

      <PageHeader
        title="Albums"
        subtitle={`${albums.length} albums`}
        action={<Btn icon={FiPlus} onClick={() => { setEditingAlbum(null); setForm({ title: '', artist_id: '', cover_url: '' }); setShowModal(true); }}>Add Album</Btn>}
      />

      <div style={{ ...card, overflow: 'hidden' }}>
        <TableWrap>
          <thead><tr><Th>Album</Th><Th>Artist</Th><Th>Songs</Th><Th right>Actions</Th></tr></thead>
          {loading ? <SkeletonRows cols={4} rows={itemsPerPage} /> : (
            <tbody>
              {paginated.length === 0
                ? <tr><td colSpan={4}><Empty message="No albums found" /></td></tr>
                : paginated.map(al => (
                  <Tr key={al.id}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Cover src={al.cover_url} size={36} radius={7} fallback={<FiDisc size={13} style={{ color: 'var(--a-faint)' }} />} />
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--a-text)' }}>{al.title}</p>
                      </div>
                    </Td>
                    <Td muted>{al.artist_name || '—'}</Td>
                    <Td muted><Tag color="#34d399">{al.song_count || 0} tracks</Tag></Td>
                    <Td right>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button onClick={() => openEdit(al)} title="Edit album" className="row-icon-btn edit">
                          <FiEdit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(al.id)} title="Delete album" className="row-icon-btn danger">
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))
              }
            </tbody>
          )}
        </TableWrap>
        <Pagination current={page} total={albums.length} limit={itemsPerPage} onPageChange={setPage} />
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditingAlbum(null); }} title={editingAlbum ? `Edit Album — "${editingAlbum.title}"` : 'Add Album'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Album title" />
          <Input label="Cover URL" value={form.cover_url} onChange={e => setForm(p => ({ ...p, cover_url: e.target.value }))} placeholder="https://..." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 10, color: 'var(--a-muted)', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600, fontFamily: "'Syne',sans-serif" }}>Artist</label>
            <select value={form.artist_id} onChange={e => setForm(p => ({ ...p, artist_id: e.target.value }))}
              style={iStyle}
              onFocus={e => e.target.style.borderColor = '#34d399'}
              onBlur={e => e.target.style.borderColor = 'var(--a-border)'}>
              <option value="">— No Artist —</option>
              {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>
        <ModalFooter
          onCancel={() => { setShowModal(false); setEditingAlbum(null); }}
          onSubmit={saveAlbum}
          loading={saving}
          submitLabel={editingAlbum ? 'Update Album' : 'Add Album'}
        />
      </Modal>
    </div>
  );
};

export default AdminAlbums;
