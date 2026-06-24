import React, { useEffect, useState } from 'react';
import { FiTrash2, FiPlus, FiUser, FiMic, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PageHeader, Btn, Tag, Empty, SkeletonRows, Th, Td, Tr, TableWrap, Modal, Input, Textarea, ModalFooter, Cover, Pagination, card } from './AdminUI';

const AdminArtists = ({ api }) => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', image_url: '' });
  const [editingArtist, setEditingArtist] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const fetch_ = async () => {
    setLoading(true);
    try { const { data } = await api.get('/artists'); setArtists(data); }
    catch { toast.error('Failed to load artists'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, [api]);

  const del = async (id) => {
    if (!window.confirm('Delete artist and all their songs/albums?')) return;
    try { await api.delete(`/artists/${id}`); setArtists(a => a.filter(x => x.id !== id)); toast.success('Artist deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const saveArtist = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editingArtist) {
        await api.patch(`/artists/${editingArtist.id}`, form);
        toast.success('Artist updated');
      } else {
        await api.post('/artists', form);
        toast.success('Artist added');
      }
      setShowModal(false); setEditingArtist(null); setForm({ name: '', bio: '', image_url: '' }); fetch_();
    }
    catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const openEdit = (a) => {
    setEditingArtist(a);
    setForm({ name: a.name||'', bio: a.bio||'', image_url: a.image_url||'' });
    setShowModal(true);
  };

  const paginated = artists.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="a-artists">
      <style>{`
        .a-artists .row-icon-btn { padding:5px 8px;border-radius:6px;background:transparent;border:1px solid transparent;cursor:pointer;color:var(--a-faint);transition:all .12s;display:inline-flex; }
        .a-artists .row-icon-btn.edit:hover { color:#a78bfa!important;border-color:rgba(167,139,250,.25)!important;background:rgba(167,139,250,.08)!important; }
        .a-artists .row-icon-btn.danger:hover { color:#f87171!important;border-color:rgba(248,113,113,.25)!important;background:rgba(248,113,113,.08)!important; }
        [data-admin-theme="dark"] .a-artists { --acc:#a78bfa; }
        [data-admin-theme="light"] .a-artists { --acc:#7c3aed; }
      `}</style>

      <PageHeader
        title="Artists"
        subtitle={`${artists.length} artists`}
        action={<Btn icon={FiPlus} onClick={() => { setEditingArtist(null); setForm({name:'',bio:'',image_url:''}); setShowModal(true); }}>Add Artist</Btn>}
      />

      <div style={{ ...card, overflow: 'hidden' }}>
        <TableWrap>
          <thead><tr><Th>Artist</Th><Th>Songs</Th><Th>Added</Th><Th right>Actions</Th></tr></thead>
          {loading ? <SkeletonRows cols={4} rows={itemsPerPage} /> : (
            <tbody>
              {paginated.length === 0
                ? <tr><td colSpan={4}><Empty message="No artists found" /></td></tr>
                : paginated.map(a => (
                  <Tr key={a.id}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Cover src={a.image_url} size={36} radius={18} fallback={<FiUser size={14} style={{ color: 'var(--a-faint)' }} />} />
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--a-text)' }}>{a.name}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--a-faint)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.bio || 'No bio'}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td muted><Tag color="#a78bfa">{a.song_count || 0} songs</Tag></Td>
                    <Td muted>{new Date(a.created_at).toLocaleDateString()}</Td>
                    <Td right>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button onClick={() => openEdit(a)} title="Edit artist" className="row-icon-btn edit">
                          <FiEdit2 size={13} />
                        </button>
                        <button onClick={() => del(a.id)} title="Delete artist" className="row-icon-btn danger">
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
        <Pagination current={page} total={artists.length} limit={itemsPerPage} onPageChange={setPage} />
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditingArtist(null); }} title={editingArtist ? `Edit Artist — "${editingArtist.name}"` : 'Add Artist'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Artist name" />
          <Input label="Image URL" value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
          <Textarea label="Bio" rows={3} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Short biography..." />
        </div>
        <ModalFooter
          onCancel={() => { setShowModal(false); setEditingArtist(null); }}
          onSubmit={saveArtist}
          loading={saving}
          submitLabel={editingArtist ? 'Update Artist' : 'Add Artist'}
        />
      </Modal>
    </div>
  );
};

export default AdminArtists;
