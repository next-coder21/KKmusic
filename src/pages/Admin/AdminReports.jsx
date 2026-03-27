import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PageHeader, Tag, Empty, SkeletonRows, Th, Td, Tr, TableWrap, Card } from './AdminUI';

const STATUS_COLORS = { pending: '#f59e0b', dismissed: '#4b5563', actioned: '#4ade80', reviewed: '#3b82f6' };

const AdminReports = ({ api }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const fetchReports = async () => {
    setLoading(true);
    try { const { data } = await api.get(`/reports?status=${filter}`); setReports(data); }
    catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, [api, filter]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/reports/${id}`, { status });
      setReports(r => r.map(x => x.id === id ? { ...x, status } : x));
      toast.success(`Report ${status}`);
    } catch { toast.error('Update failed'); }
  };

  return (
    <div>
      <PageHeader title="Content Reports" subtitle="Review and action user-submitted reports" />

      <Card style={{ marginBottom: 16 }} p={12}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['pending', 'reviewed', 'actioned', 'dismissed'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${filter === s ? STATUS_COLORS[s] + '40' : '#1a1a1a'}`, background: filter === s ? STATUS_COLORS[s] + '12' : 'transparent', color: filter === s ? STATUS_COLORS[s] : '#4b5563', fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.12s', fontFamily: 'inherit', letterSpacing: '0.02em' }}>
              {s}
            </button>
          ))}
        </div>
      </Card>

      <TableWrap>
        <thead><tr><Th>Content</Th><Th>Reason</Th><Th>Reporter</Th><Th>Status</Th><Th>Date</Th><Th right>Action</Th></tr></thead>
        {loading ? <SkeletonRows cols={6} rows={10} /> : (
          <tbody>
            {reports.length === 0 ? <tr><td colSpan={6}><Empty message={`No ${filter} reports`} /></td></tr> :
              reports.map(r => (
                <Tr key={r.id}>
                  <Td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Tag color="#3b82f6">{r.content_type}</Tag>
                      <p style={{ margin: '3px 0 0', fontSize: 10, color: '#374151', fontFamily: 'monospace', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.content_id}>{r.content_id?.substring(0, 12)}...</p>
                    </div>
                  </Td>
                  <Td>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, color: '#f87171', fontWeight: 600, textTransform: 'capitalize' }}>{r.reason}</p>
                      {r.notes && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#4b5563', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes}</p>}
                    </div>
                  </Td>
                  <Td muted>{r.reporter_email}</Td>
                  <Td><Tag color={STATUS_COLORS[r.status] || '#4b5563'}>{r.status}</Tag></Td>
                  <Td muted>{new Date(r.created_at).toLocaleDateString()}</Td>
                  <Td right>
                    {r.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => updateStatus(r.id, 'actioned')} style={{ padding: '5px 8px', borderRadius: 6, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', cursor: 'pointer', color: '#4ade80', display: 'inline-flex', transition: 'all 0.12s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,222,128,0.15)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(74,222,128,0.08)'}>
                          <FiCheckCircle size={13} />
                        </button>
                        <button onClick={() => updateStatus(r.id, 'dismissed')} style={{ padding: '5px 8px', borderRadius: 6, background: 'rgba(75,85,99,0.1)', border: '1px solid #1f1f1f', cursor: 'pointer', color: '#4b5563', display: 'inline-flex', transition: 'all 0.12s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(75,85,99,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(75,85,99,0.1)'}>
                          <FiXCircle size={13} />
                        </button>
                      </div>
                    )}
                  </Td>
                </Tr>
              ))}
          </tbody>
        )}
      </TableWrap>
    </div>
  );
};

export default AdminReports;
