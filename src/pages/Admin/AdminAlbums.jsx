import React, { useEffect, useState } from 'react';
import { FiTrash2, FiPlus, FiDisc, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PageHeader, Btn, Tag, Empty, SkeletonRows, Th, Td, Tr, TableWrap, Modal, Input, FormRow, ModalFooter, Cover, Pagination, card } from './AdminUI';

const iStyle = {
  width:'100%',background:'#0a0a0a',border:'1px solid #1f1f1f',borderRadius:8,
  padding:'9px 12px',color:'#f9fafb',fontSize:13,outline:'none',
  fontFamily:'inherit',transition:'border-color .12s',
};

const AdminAlbums = ({ api }) => {
  const [albums,  setAlbums ] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving,    setSaving  ] = useState(false);
  const [form, setForm] = useState({ title:'', artist_id:'', cover_url:'' });
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
    try { await api.delete(`/albums/${id}`); setAlbums(a=>a.filter(x=>x.id!==id)); toast.success('Album deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const saveAlbum = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = { title:form.title, artist_id:form.artist_id||null, cover_url:form.cover_url||null };
      if (editingAlbum) {
        await api.patch(`/albums/${editingAlbum.id}`, payload);
        toast.success('Album updated');
      } else {
        await api.post('/albums', payload);
        toast.success('Album added');
      }
      setShowModal(false); setEditingAlbum(null); setForm({ title:'', artist_id:'', cover_url:'' }); fetchAll();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const openEdit = (al) => {
    setEditingAlbum(al);
    setForm({ title: al.title||'', artist_id: al.artist_id||'', cover_url: al.cover_url||'' });
    setShowModal(true);
  };

  const paginated = albums.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div>
      <PageHeader title="Albums" subtitle={`${albums.length} albums`} action={<Btn icon={FiPlus} onClick={()=>{ setEditingAlbum(null); setForm({title:'',artist_id:'',cover_url:''}); setShowModal(true); }}>Add Album</Btn>}/>
      <div style={{ ...card, overflow: 'hidden' }}>
        <TableWrap>
          <thead><tr><Th>Album</Th><Th>Artist</Th><Th>Songs</Th><Th right>Actions</Th></tr></thead>
          {loading?<SkeletonRows cols={4} rows={itemsPerPage}/>:(
            <tbody>
              {paginated.length===0?<tr><td colSpan={4}><Empty message="No albums found"/></td></tr>:paginated.map(al=>(
              <Tr key={al.id}>
                <Td>
                  <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                    <Cover src={al.cover_url} size={36} radius={7} fallback={<FiDisc size={13} style={{ color:'#374151' }}/>}/>
                    <p style={{ margin:0,fontSize:13,fontWeight:600,color:'#e5e7eb' }}>{al.title}</p>
                  </div>
                </Td>
                <Td muted>{al.artist_name||'—'}</Td>
                <Td muted><Tag color="#2dd4bf">{al.song_count||0} tracks</Tag></Td>
                <Td right>
                   <div style={{ display:'flex',gap:4,justifyContent:'flex-end' }}>
                    <button onClick={()=>openEdit(al)}
                      style={{ padding:'5px 8px',borderRadius:6,background:'transparent',border:'1px solid transparent',cursor:'pointer',color:'#374151',transition:'all .12s',display:'inline-flex' }}
                      onMouseEnter={e=>{e.currentTarget.style.color='#3b82f6';e.currentTarget.style.background='rgba(59,130,246,.08)';}}
                      onMouseLeave={e=>{e.currentTarget.style.color='#374151';e.currentTarget.style.background='transparent';}}>
                      <FiEdit2 size={13}/>
                    </button>
                    <button onClick={()=>handleDelete(al.id)}
                      style={{ padding:'5px 8px',borderRadius:6,background:'transparent',border:'1px solid transparent',cursor:'pointer',color:'#374151',transition:'all .12s',display:'inline-flex' }}
                      onMouseEnter={e=>{e.currentTarget.style.color='#ef4444';e.currentTarget.style.background='rgba(239,68,68,.08)';}}
                      onMouseLeave={e=>{e.currentTarget.style.color='#374151';e.currentTarget.style.background='transparent';}}>
                      <FiTrash2 size={13}/>
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        )}
        </TableWrap>
        <Pagination current={page} total={albums.length} limit={itemsPerPage} onPageChange={setPage} />
      </div>

      <Modal open={showModal} onClose={()=>{ setShowModal(false); setEditingAlbum(null); }} title={editingAlbum?`Edit Album — "${editingAlbum.title}"`:"Add Album"}>
        <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
          <Input label="Title *" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Album title"/>
          <Input label="Cover URL" value={form.cover_url} onChange={e=>setForm(p=>({...p,cover_url:e.target.value}))} placeholder="https://..."/>
          <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
            <label style={{ fontSize:10,color:'#4b5563',letterSpacing:'.12em',textTransform:'uppercase',fontWeight:600 }}>Artist</label>
            <select value={form.artist_id} onChange={e=>setForm(p=>({...p,artist_id:e.target.value}))}
              style={iStyle}
              onFocus={e=>e.target.style.borderColor='#ec4899'}
              onBlur={e=>e.target.style.borderColor='#1f1f1f'}>
              <option value="">— No Artist —</option>
              {artists.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>
        <ModalFooter onCancel={()=>{ setShowModal(false); setEditingAlbum(null); }} onSubmit={saveAlbum} loading={saving} submitLabel={editingAlbum?"Update Album":"Add Album"}/>
      </Modal>
    </div>
  );
};

export default AdminAlbums;
