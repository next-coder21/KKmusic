import React, { useEffect, useState } from 'react';
import { FiUserX, FiCheckCircle, FiSearch, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PageHeader, Card, Tag, Empty, SkeletonRows, Th, Td, Tr, TableWrap } from './AdminUI';

const AdminUsers = ({ api }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try { const { data } = await api.get('/users'); setUsers(data); }
    catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [api]);

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this user and all their data?')) return;
    try { await api.delete(`/users/${id}`); setUsers(u => u.filter(x => x.id !== id)); toast.success('User deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Users" subtitle={`${users.length} registered listeners`} />

      <Card style={{ marginBottom: 16 }} p={14}>
        <div style={{ position: 'relative', maxWidth: 340 }}>
          <FiSearch size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#374151' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8, padding: '8px 12px 8px 32px', color: '#f9fafb', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = '#ec4899'}
            onBlur={e => e.target.style.borderColor = '#1a1a1a'}
          />
        </div>
      </Card>

      <TableWrap>
        <thead><tr><Th>User</Th><Th>Email</Th><Th>Status</Th><Th>Songs Played</Th><Th>Joined</Th><Th right>Actions</Th></tr></thead>
        {loading ? <SkeletonRows cols={6} rows={12} /> : (
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={6}><Empty message="No users found" /></td></tr> :
              filtered.map(u => (
                <Tr key={u.id}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#ec4899,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {(u.name || 'U')[0].toUpperCase()}
                      </div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>{u.name || '—'}</p>
                    </div>
                  </Td>
                  <Td muted>{u.email}</Td>
                  <Td>
                    {u.is_verified
                      ? <Tag color="#4ade80">Verified</Tag>
                      : <Tag color="#f59e0b">Pending</Tag>}
                  </Td>
                  <Td muted>{parseInt(u.songs_played || 0).toLocaleString()}</Td>
                  <Td muted>{new Date(u.created_at).toLocaleDateString()}</Td>
                  <Td right>
                    <button onClick={() => handleDelete(u.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, background: 'transparent', border: '1px solid transparent', cursor: 'pointer', color: '#374151', fontSize: 12, fontFamily: 'inherit', transition: 'all 0.12s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}>
                      <FiUserX size={12} /> Remove
                    </button>
                  </Td>
                </Tr>
              ))}
          </tbody>
        )}
      </TableWrap>
    </div>
  );
};

export default AdminUsers;
