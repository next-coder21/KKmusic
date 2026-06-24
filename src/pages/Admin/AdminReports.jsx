import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PageHeader, Tag, Empty, SkeletonRows, Th, Td, Tr, TableWrap, Card } from './AdminUI';

const REPORT_STATUS_COLORS = {
  pending:   '#f59e0b',
  dismissed: 'var(--a-muted)',
  actioned:  '#4ade80',
  reviewed:  '#60a5fa',
};

const FEEDBACK_STATUS_COLORS = {
  pending:   '#f59e0b',
  reviewed:  '#60a5fa',
  resolved:  '#4ade80',
  dismissed: 'var(--a-muted)',
};

const FEEDBACK_TYPE_COLORS = {
  suggestion:  '#a78bfa',
  bug_report:  '#f87171',
  general:     '#60a5fa',
};

// ─── Content Reports tab ─────────────────────────────────────────────────────
function ContentReports({ api }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('pending');

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
    <>
      <Card style={{ marginBottom: 16 }} p={12}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['pending', 'reviewed', 'actioned', 'dismissed'].map(s => {
            const isActive = filter === s;
            const col = REPORT_STATUS_COLORS[s] || 'var(--a-muted)';
            return (
              <button key={s} onClick={() => setFilter(s)}
                className="filter-pill"
                style={{
                  border: `1px solid ${isActive ? col + '40' : 'var(--a-border)'}`,
                  background: isActive ? col + '12' : 'transparent',
                  color: isActive ? col : 'var(--a-muted)',
                }}>
                {s}
              </button>
            );
          })}
        </div>
      </Card>

      <TableWrap>
        <thead><tr>
          <Th>Content</Th><Th>Reason</Th><Th>Reporter</Th><Th>Status</Th><Th>Date</Th><Th right>Action</Th>
        </tr></thead>
        {loading ? <SkeletonRows cols={6} rows={10} /> : (
          <tbody>
            {reports.length === 0
              ? <tr><td colSpan={6}><Empty message={`No ${filter} reports`} /></td></tr>
              : reports.map(r => (
                <Tr key={r.id}>
                  <Td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Tag color="#60a5fa">{r.content_type}</Tag>
                      <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--a-faint)', fontFamily: 'monospace', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.content_id}>
                        {r.content_id?.substring(0, 12)}...
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, color: '#f87171', fontWeight: 600, textTransform: 'capitalize' }}>{r.reason}</p>
                      {r.notes && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--a-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes}</p>}
                    </div>
                  </Td>
                  <Td muted>{r.reporter_email}</Td>
                  <Td><Tag color={REPORT_STATUS_COLORS[r.status] || 'var(--a-muted)'}>{r.status}</Tag></Td>
                  <Td muted>{new Date(r.created_at).toLocaleDateString()}</Td>
                  <Td right>
                    {r.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => updateStatus(r.id, 'actioned')} title="Action report" className="action-btn approve">
                          <FiCheckCircle size={13} />
                        </button>
                        <button onClick={() => updateStatus(r.id, 'dismissed')} title="Dismiss report" className="action-btn dismiss">
                          <FiXCircle size={13} />
                        </button>
                      </div>
                    )}
                  </Td>
                </Tr>
              ))
            }
          </tbody>
        )}
      </TableWrap>
    </>
  );
}

// ─── Feedback & Suggestions tab ───────────────────────────────────────────────
function FeedbackList({ api }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [expanded,   setExpanded]   = useState(null);
  const [noteText,   setNoteText]   = useState('');
  const [saving,     setSaving]     = useState(false);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filter });
      if (typeFilter) params.set('type', typeFilter);
      const { data } = await api.get(`/feedback?${params}`);
      setItems(data);
    } catch { toast.error('Failed to load feedback'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFeedback(); }, [api, filter, typeFilter]);

  const openItem = (item) => {
    setExpanded(item.id === expanded ? null : item.id);
    setNoteText(item.admin_note || '');
  };

  const saveUpdate = async (id, status) => {
    setSaving(true);
    try {
      await api.patch(`/feedback/${id}`, { status, admin_note: noteText });
      setItems(prev => prev.map(x => x.id === id ? { ...x, status, admin_note: noteText } : x));
      setExpanded(null);
      toast.success(`Feedback marked as ${status}`);
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const typeLabel = { suggestion: 'Suggestion', bug_report: 'Bug Report', general: 'General' };

  return (
    <>
      {/* Filters */}
      <Card style={{ marginBottom: 16 }} p={12}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--a-muted)', fontWeight: 600, marginRight: 4 }}>STATUS</span>
          {['pending', 'reviewed', 'resolved', 'dismissed'].map(s => {
            const isActive = filter === s;
            const col = FEEDBACK_STATUS_COLORS[s] || 'var(--a-muted)';
            return (
              <button key={s} onClick={() => setFilter(s)}
                className="filter-pill"
                style={{
                  border: `1px solid ${isActive ? col + '40' : 'var(--a-border)'}`,
                  background: isActive ? col + '12' : 'transparent',
                  color: isActive ? col : 'var(--a-muted)',
                }}>
                {s}
              </button>
            );
          })}
          <span style={{ width: 1, height: 20, background: 'var(--a-border)', margin: '0 4px' }} />
          <span style={{ fontSize: 11, color: 'var(--a-muted)', fontWeight: 600, marginRight: 4 }}>TYPE</span>
          {['', 'suggestion', 'bug_report', 'general'].map(t => {
            const isActive = typeFilter === t;
            const col = t ? (FEEDBACK_TYPE_COLORS[t] || 'var(--a-muted)') : 'var(--a-muted)';
            return (
              <button key={t || 'all'} onClick={() => setTypeFilter(t)}
                className="filter-pill"
                style={{
                  border: `1px solid ${isActive ? col + '40' : 'var(--a-border)'}`,
                  background: isActive ? col + '12' : 'transparent',
                  color: isActive ? col : 'var(--a-muted)',
                }}>
                {t ? typeLabel[t] : 'All'}
              </button>
            );
          })}
        </div>
      </Card>

      <TableWrap>
        <thead><tr>
          <Th>Type</Th><Th>Subject</Th><Th>User</Th><Th>Status</Th><Th>Date</Th><Th right>Action</Th>
        </tr></thead>
        {loading ? <SkeletonRows cols={6} rows={8} /> : (
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={6}><Empty message={`No ${filter} feedback`} /></td></tr>
              : items.map(item => (
                <React.Fragment key={item.id}>
                  <Tr>
                    <Td>
                      <Tag color={FEEDBACK_TYPE_COLORS[item.type] || 'var(--a-muted)'}>
                        {typeLabel[item.type] || item.type}
                      </Tag>
                    </Td>
                    <Td>
                      <button
                        onClick={() => openItem(item)}
                        style={{
                          background: 'none', border: 'none', padding: 0,
                          color: 'var(--a-text)', cursor: 'pointer', textAlign: 'left',
                          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                        }}
                        title="Click to expand"
                      >
                        {item.subject}
                      </button>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <span style={{ fontSize: 13, color: 'var(--a-text2)' }}>{item.user_name || '—'}</span>
                        <span style={{ fontSize: 11, color: 'var(--a-muted)' }}>{item.user_email}</span>
                      </div>
                    </Td>
                    <Td><Tag color={FEEDBACK_STATUS_COLORS[item.status] || 'var(--a-muted)'}>{item.status}</Tag></Td>
                    <Td muted>{new Date(item.created_at).toLocaleDateString()}</Td>
                    <Td right>
                      <button onClick={() => openItem(item)} title="Review" className="action-btn dismiss" style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600 }}>
                        {expanded === item.id ? 'Close' : 'Review'}
                      </button>
                    </Td>
                  </Tr>

                  {/* Expanded detail row */}
                  {expanded === item.id && (
                    <tr>
                      <td colSpan={6} style={{ padding: 0 }}>
                        <div style={{
                          background: 'var(--a-bg3)',
                          borderTop: '1px solid var(--a-border)',
                          borderBottom: '1px solid var(--a-border)',
                          padding: '16px 20px',
                        }}>
                          {/* Message */}
                          <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: 'var(--a-muted)', textTransform: 'uppercase' }}>Message</p>
                          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--a-text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{item.message}</p>

                          {/* Admin note */}
                          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: 'var(--a-muted)', textTransform: 'uppercase' }}>Admin Note (optional)</p>
                          <textarea
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            rows={3}
                            placeholder="Add an internal note…"
                            style={{
                              width: '100%', boxSizing: 'border-box',
                              background: 'var(--a-bg)', border: '1px solid var(--a-border)',
                              borderRadius: 8, padding: '8px 12px',
                              color: 'var(--a-text)', fontSize: 13, fontFamily: 'inherit',
                              resize: 'vertical', marginBottom: 14,
                            }}
                          />

                          {/* Action buttons */}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => saveUpdate(item.id, 'reviewed')} disabled={saving}
                              className="action-btn approve"
                              style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, gap: 5, display: 'flex', alignItems: 'center' }}>
                              <FiCheckCircle size={13} /> Mark Reviewed
                            </button>
                            <button onClick={() => saveUpdate(item.id, 'resolved')} disabled={saving}
                              className="action-btn approve"
                              style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, gap: 5, display: 'flex', alignItems: 'center', background: 'rgba(74,222,128,.15)', borderColor: 'rgba(74,222,128,.3)' }}>
                              <FiCheckCircle size={13} /> Resolved
                            </button>
                            <button onClick={() => saveUpdate(item.id, 'dismissed')} disabled={saving}
                              className="action-btn dismiss"
                              style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, gap: 5, display: 'flex', alignItems: 'center' }}>
                              <FiXCircle size={13} /> Dismiss
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            }
          </tbody>
        )}
      </TableWrap>
    </>
  );
}

// ─── Main page (tabbed) ───────────────────────────────────────────────────────
const AdminReports = ({ api }) => {
  const [tab, setTab] = useState('content');

  return (
    <div className="a-reports">
      <style>{`
        .a-reports .filter-pill {
          padding:5px 12px;border-radius:6px;font-family:inherit;font-size:11px;
          font-weight:600;cursor:pointer;text-transform:capitalize;
          transition:all .12s;letter-spacing:.02em;border:none;
        }
        .a-reports .action-btn {
          padding:5px 8px;border-radius:6px;cursor:pointer;display:inline-flex;
          align-items:center;gap:4px;transition:all .12s;font-family:inherit;
        }
        .a-reports .action-btn.approve {
          background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.2);color:#4ade80;
        }
        .a-reports .action-btn.approve:hover { background:rgba(74,222,128,.16); }
        .a-reports .action-btn.dismiss {
          background:var(--a-bg3);border:1px solid var(--a-border);color:var(--a-muted);
        }
        .a-reports .action-btn.dismiss:hover { background:var(--a-hover);color:var(--a-text2); }
        .a-reports .action-btn:disabled { opacity:.5;cursor:not-allowed; }
        [data-admin-theme="dark"] .a-reports { --acc:#f87171; }
        [data-admin-theme="light"] .a-reports { --acc:#dc2626; }
        .a-tab-bar { display:flex;gap:0;border-bottom:1px solid var(--a-border);margin-bottom:20px; }
        .a-tab { padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;
          border:none;background:none;font-family:inherit;
          color:var(--a-muted);border-bottom:2px solid transparent;margin-bottom:-1px;
          display:flex;align-items:center;gap:7px;transition:all .15s;
        }
        .a-tab:hover { color:var(--a-text2); }
        .a-tab.active { color:var(--a-text);border-bottom-color:var(--acc); }
        .a-tab .tab-badge {
          background:rgba(248,113,113,.15);color:#f87171;border-radius:99px;
          font-size:10px;padding:1px 6px;font-weight:700;
        }
        .a-tab.active .tab-badge { background:var(--acc);color:#fff; }
      `}</style>

      <PageHeader
        title="Reports & Feedback"
        subtitle="Content reports from users and in-app feedback submissions"
      />

      {/* Tab bar */}
      <div className="a-tab-bar">
        <button className={`a-tab${tab === 'content' ? ' active' : ''}`} onClick={() => setTab('content')}>
          <FiAlertTriangle size={14} /> Content Reports
        </button>
        <button className={`a-tab${tab === 'feedback' ? ' active' : ''}`} onClick={() => setTab('feedback')}>
          <FiMessageSquare size={14} /> Feedback &amp; Suggestions
        </button>
      </div>

      {tab === 'content'
        ? <ContentReports api={api} />
        : <FeedbackList   api={api} />
      }
    </div>
  );
};

export default AdminReports;
