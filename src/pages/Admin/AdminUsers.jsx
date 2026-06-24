import React, { useEffect, useState } from 'react';
import { FiUserX, FiSearch, FiUser } from 'react-icons/fi';
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
    <div className="a-users">
      <style>{`
        .a-users .remove-btn {
          display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:6px;
          background:transparent;border:1px solid transparent;cursor:pointer;
          color:var(--a-faint);font-size:12px;font-family:inherit;transition:all .12s;
        }
        .a-users .remove-btn:hover {
          color:#f87171!important;background:rgba(248,113,113,.08)!important;border-color:rgba(248,113,113,.2)!important;
        }
        [data-admin-theme="dark"] .a-users { --acc:#f472b6; }
        [data-admin-theme="light"] .a-users { --acc:#db2777; }
      `}</style>

      <PageHeader title="Users" subtitle={`${users.length} registered listeners`} />

      <Card style={{ marginBottom: 16 }} p={14}>
        <div style={{ position: 'relative', maxWidth: 340 }}>
          <FiSearch size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--a-faint)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{
              width: '100%',
              background: 'var(--a-bg3)',
              border: '1px solid var(--a-border)',
              borderRadius: 8,
              padding: '8px 12px 8px 32px',
              color: 'var(--a-text)',
              fontSize: 12,
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color .12s',
            }}
            onFocus={e => e.target.style.borderColor = '#f472b6'}
            onBlur={e => e.target.style.borderColor = 'var(--a-border)'}
          />
        </div>
      </Card>

      <TableWrap>
        <thead><tr>
          <Th>User</Th><Th>Email</Th><Th>Status</Th><Th>Songs Played</Th><Th>Joined</Th><Th right>Actions</Th>
        </tr></thead>
        {loading ? <SkeletonRows cols={6} rows={12} /> : (
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={6}><Empty message="No users found" /></td></tr>
              : filtered.map(u => (
                <Tr key={u.id}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#f472b6,#818cf8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {(u.name || 'U')[0].toUpperCase()}
                      </div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--a-text)' }}>{u.name || '—'}</p>
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
                    <button onClick={() => handleDelete(u.id)} className="remove-btn">
                      <FiUserX size={12} /> Remove
                    </button>
                  </Td>
                </Tr>
              ))
            }
          </tbody>
        )}
      </TableWrap>
    </div>
  );
};

export default AdminUsers;
