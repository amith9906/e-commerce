import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, X, MapPin, RefreshCw } from 'lucide-react';
import api from '../../api/client';

const STATUS_COLORS = {
  pending: '#f59e0b',
  ready: '#6366f1',
  completed: '#22c55e',
  cancelled: '#ef4444'
};

const STATUSES = ['pending', 'ready', 'completed', 'cancelled'];

const emptyForm = {
  storeId: '',
  productId: '',
  quantity: '',
  scheduledFor: '',
  notes: ''
};

export default function Pickups() {
  const [pickups, setPickups] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const [pRes, sRes, prRes] = await Promise.all([
        api.get(`/pickups${params}`),
        api.get('/stores'),
        api.get('/products?limit=200')
      ]);
      setPickups(pRes.data.data || []);
      setStores(sRes.data.data || []);
      setProducts(prRes.data.data || []);
    } catch {
      toast.error('Failed to load pickup requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchPickups = async () => {
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const res = await api.get(`/pickups${params}`);
      setPickups(res.data.data || []);
    } catch {
      toast.error('Failed to refresh pickups');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/pickups', {
        storeId: form.storeId,
        productId: form.productId,
        quantity: parseInt(form.quantity),
        scheduledFor: form.scheduledFor,
        notes: form.notes || undefined
      });
      toast.success('Pickup request created');
      setShowForm(false);
      setForm(emptyForm);
      fetchPickups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create pickup request');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/pickups/${id}`, { status });
      toast.success('Status updated');
      fetchPickups();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Pickup Requests
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Manage click-and-collect pickup orders
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> New Pickup
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => { setFilterStatus(''); fetchAll(); }}
          className={filterStatus === '' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.4rem 0.875rem', fontSize: '0.8125rem' }}
        >
          All
        </button>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setFilterStatus(s); fetchPickups(); }}
            className={filterStatus === s ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.4rem 0.875rem', fontSize: '0.8125rem', textTransform: 'capitalize' }}
          >
            {s}
          </button>
        ))}
        <button onClick={fetchPickups} className="btn-secondary" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.875rem', fontSize: '0.8125rem' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700 }}>New Pickup Request</h2>
              <button onClick={() => { setShowForm(false); setForm(emptyForm); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label className="form-label">Store *</label>
                  <select className="form-input" value={form.storeId} onChange={e => setForm(p => ({ ...p, storeId: e.target.value }))} required>
                    <option value="">Select store…</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Product *</label>
                  <select className="form-input" value={form.productId} onChange={e => setForm(p => ({ ...p, productId: e.target.value }))} required>
                    <option value="">Select product…</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Quantity *</label>
                    <input type="number" className="form-input" min="1" placeholder="1" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label">Scheduled For *</label>
                    <input type="datetime-local" className="form-input" value={form.scheduledFor} onChange={e => setForm(p => ({ ...p, scheduledFor: e.target.value }))} required />
                  </div>
                </div>

                <div>
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" rows={2} placeholder="Optional notes…" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setForm(emptyForm); }}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Creating…' : 'Create Pickup'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : pickups.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <MapPin size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <div>No pickup requests found.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                  {['Product', 'Store', 'Qty', 'Scheduled', 'Status', 'Notes', ''].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pickups.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                      <div>{p.product?.name || '—'}</div>
                      {p.product?.sku && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.product.sku}</div>}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-body)' }}>
                      {p.store?.name || '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                      {p.quantity}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {p.scheduledFor ? new Date(p.scheduledFor).toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 100,
                        background: `${STATUS_COLORS[p.status] || '#6b7280'}18`,
                        color: STATUS_COLORS[p.status] || '#6b7280',
                        textTransform: 'capitalize'
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.notes || '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <select
                        value={p.status}
                        onChange={e => updateStatus(p.id, e.target.value)}
                        style={{ fontSize: '0.8125rem', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-main)', cursor: 'pointer' }}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
