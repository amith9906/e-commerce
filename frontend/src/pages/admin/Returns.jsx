import { useState, useEffect } from 'react';
import api from '../../api/client';
import { toast } from 'react-toastify';
import { RotateCcw, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import dayjs from 'dayjs';

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/admin/returns');
      if (res.success) setReturns(res.data);
    } catch (err) {
      toast.error('Failed to load return requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    const adminNotes = window.prompt(`Optional notes for this ${status} status:`);
    try {
      const res = await api.patch(`/orders/admin/returns/${id}`, { status, adminNotes });
      if (res.success) {
        toast.success(`Return request ${status}`);
        fetchReturns();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={18} color="#d97706" />;
      case 'approved': return <CheckCircle size={18} color="#2563eb" />;
      case 'completed': return <CheckCircle size={18} color="#10b981" />;
      case 'rejected': return <XCircle size={18} color="#ef4444" />;
      default: return null;
    }
  };

  const filteredReturns = returns.filter(r => 
    r.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.order?.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Return & Replacement Requests</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '300px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search by Order ID or Name..." 
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Order ID</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Customer</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Type</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Reason</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Date</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : filteredReturns.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No return requests found.</td></tr>
            ) : (
              filteredReturns.map(req => (
                <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem text-align: center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getStatusIcon(req.status)}
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'capitalize' }}>{req.status}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>#{req.orderId.substring(0, 8)}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 500 }}>{req.order?.user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.order?.user?.email}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                      backgroundColor: req.type === 'return' ? '#eff6ff' : '#f5f3ff',
                      color: req.type === 'return' ? '#2563eb' : '#7c3aed'
                    }}>
                      {req.type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.reason}>
                    {req.reason}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{dayjs(req.createdAt).format('MMM D, YYYY')}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {req.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                         <button onClick={() => handleUpdateStatus(req.id, 'approved')} className="btn-primary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>Approve</button>
                         <button onClick={() => handleUpdateStatus(req.id, 'rejected')} className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#ef4444' }}>Reject</button>
                      </div>
                    ) : req.status === 'approved' ? (
                      <button onClick={() => handleUpdateStatus(req.id, 'completed')} className="btn-primary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', backgroundColor: '#10b981' }}>Mark Completed</button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No actions</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
