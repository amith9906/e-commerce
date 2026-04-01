import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Shield, Search, Filter, ChevronLeft, ChevronRight, User, Clock } from 'lucide-react';
import api from '../../api/client';

const METHOD_COLORS = { GET: '#3b82f6', POST: '#22c55e', PUT: '#f59e0b', PATCH: '#f59e0b', DELETE: '#ef4444' };

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [planError, setPlanError] = useState(false);
  const navigate = useNavigate();
  const limit = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (actionFilter) params.set('action', actionFilter);
      const res = await api.get(`/saas/audit-logs?${params}`);
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      if (err.code === 'PLAN_UPGRADE_REQUIRED') {
        setPlanError(true);
      } else {
        toast.error('Failed to load audit logs.');
      }
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  const s = {
    page: { padding: '2rem' },
    heading: { fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 },
    card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' },
    input: { padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none' },
    methodBadge: (method) => ({
      display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
      background: `${METHOD_COLORS[method] || '#9ca3af'}15`, color: METHOD_COLORS[method] || '#9ca3af',
    }),
    statusBadge: (status) => {
      const color = status < 300 ? '#22c55e' : status < 400 ? '#3b82f6' : status < 500 ? '#f59e0b' : '#ef4444';
      return { display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: `${color}15`, color };
    },
  };

  if (planError) {
    return (
      <div style={s.page}>
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <Shield size={40} color="#d97706" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Audit Logs — Growth Plan Required</h2>
          <p style={{ color: '#666', marginBottom: 20 }}>Upgrade to the Growth plan or higher to access complete audit logs for your organization.</p>
          <button onClick={() => navigate('/admin/billing')} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>
            Upgrade Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Shield size={22} color="#4f46e5" />
        <h1 style={s.heading}>Audit Logs</h1>
      </div>
      <p style={{ color: '#666', marginBottom: 20 }}>Complete activity history for your organization. Every admin action is recorded.</p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
            placeholder="Filter by action..."
            style={{ ...s.input, paddingLeft: 32 }}
          />
        </div>
        <span style={{ fontSize: 13, color: '#888', alignSelf: 'center' }}>{total.toLocaleString()} entries</span>
      </div>

      <div style={s.card}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>No audit log entries found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#888', fontSize: 11, textTransform: 'uppercase' }}>Time</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#888', fontSize: 11, textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#888', fontSize: 11, textTransform: 'uppercase' }}>Action</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#888', fontSize: 11, textTransform: 'uppercase' }}>Method</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#888', fontSize: 11, textTransform: 'uppercase' }}>Path</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#888', fontSize: 11, textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#666' }}>
                      <Clock size={12} />
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={12} color="#9ca3af" />
                      <div>
                        <div style={{ fontWeight: 600, color: '#111' }}>{log.userEmail || 'System'}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{log.userRole}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px', maxWidth: 200 }}>
                    <span style={{ color: '#374151', fontFamily: 'monospace', fontSize: 12 }}>{log.action}</span>
                    {log.entityId && <div style={{ fontSize: 11, color: '#9ca3af' }}>ID: {log.entityId.substring(0, 8)}...</div>}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    {log.method && <span style={s.methodBadge(log.method)}>{log.method}</span>}
                  </td>
                  <td style={{ padding: '10px 16px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: 12 }}>{log.path}</span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    {log.responseStatus && <span style={s.statusBadge(log.responseStatus)}>{log.responseStatus}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 13, color: '#888' }}>Page {page} of {totalPages} ({total} total)</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, display: 'flex', alignItems: 'center' }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1, display: 'flex', alignItems: 'center' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
