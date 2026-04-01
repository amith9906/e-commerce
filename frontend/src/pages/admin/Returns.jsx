import { useState, useEffect, useMemo } from 'react';
import api from '../../api/client';
import { toast } from 'react-toastify';
import { RotateCcw, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import dayjs from 'dayjs';
import PaginationControls from '../../components/PaginationControls';
import useDebouncedValue from '../../hooks/useDebouncedValue';

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, pages: 1, total: 0 });
  const PAGE_LIMIT = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);
  const [codCollectingReturnId, setCodCollectingReturnId] = useState(null);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_LIMIT };
      if (filters.search) params.q = filters.search;
      if (filters.status) params.status = filters.status;
      const res = await api.get('/orders/admin/returns', { params });
      if (res.success) {
        setReturns(res.data);
        const meta = res.pagination || { currentPage: page, pages: 1, total: res.data?.length || 0 };
        setPagination(meta);
        if (meta.pages && page > meta.pages) {
          setPage(meta.pages);
        }
      }
    } catch (err) {
      toast.error('Failed to load return requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [filters, page]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearchTerm }));
    setPage(1);
  }, [debouncedSearchTerm]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', status: '' });
    setPage(1);
    setSearchTerm('');
  };

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

  const handleCollectReturnCod = async (returnRequest) => {
    const orderId = returnRequest?.order?.id;
    if (!orderId) return;
    if (!window.confirm('Collect COD for this return order and mark payment delivered?')) return;
    try {
      setCodCollectingReturnId(returnRequest.id);
      const res = await api.post(`/orders/${orderId}/cod/collect`, { status: 'delivered' });
      if (res.success) {
        toast.success('COD captured for this order.');
        fetchReturns();
      }
    } catch (err) {
      toast.error(err.message || 'Unable to collect COD payment.');
    } finally {
      setCodCollectingReturnId(null);
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

  const returnRows = useMemo(() => returns.map((req) => (
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
        {req.order?.payment?.paymentMethod === 'cod' && req.order?.payment?.status === 'pending' && (
          <button
            type="button"
            onClick={() => handleCollectReturnCod(req)}
            disabled={codCollectingReturnId === req.id}
            className="btn-primary"
            style={{ marginTop: '0.5rem', padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
          >
            {codCollectingReturnId === req.id ? 'Collecting...' : 'Collect COD'}
          </button>
        )}
      </td>
    </tr>
  )), [returns, codCollectingReturnId, handleUpdateStatus]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Return & Replacement Requests</h1>
        </div>
        <div className="card" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '999px', border: '1px solid var(--border-color)', backgroundColor: 'white', minWidth: '280px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search by Order ID or Name..." 
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input-field"
            style={{ width: '200px', marginBottom: 0 }}
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <button type="button" className="btn-secondary" onClick={() => clearFilters()} style={{ padding: '0.35rem 0.65rem' }}>
            Clear filters
          </button>
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
            ) : returns.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No return requests found.</td></tr>
            ) : (
              returns.map(req => (
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
                    {req.order?.payment?.paymentMethod === 'cod' && req.order?.payment?.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleCollectReturnCod(req)}
                        disabled={codCollectingReturnId === req.id}
                        className="btn-primary"
                        style={{ marginTop: '0.5rem', padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        {codCollectingReturnId === req.id ? 'Collecting...' : 'Collect COD'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <PaginationControls
          currentPage={pagination.currentPage || page}
          totalPages={pagination.pages || 1}
          onChange={(targetPage) => setPage(targetPage)}
        />
      </div>
    </div>
  );
}
