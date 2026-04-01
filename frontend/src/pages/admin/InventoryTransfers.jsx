import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, ArrowRight, X, RefreshCw } from 'lucide-react';
import api from '../../api/client';
import { useBrand } from '../../context/BrandContext';

const STATUS_COLORS = {
  shipped: '#6366f1',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  pending: '#f59e0b'
};

const STATUSES = ['shipped', 'delivered', 'cancelled', 'pending'];

const emptyForm = {
  productId: '',
  fromStoreId: '',
  toStoreId: '',
  quantity: '',
  unitPrice: '',
  notes: '',
  paymentMethod: 'cash',
  dueDate: ''
};

export default function InventoryTransfers() {
  const { currency = 'USD' } = useBrand();
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
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
      const [tRes, pRes, sRes] = await Promise.all([
        api.get('/transfers'),
        api.get('/products?limit=200'),
        api.get('/stores')
      ]);
      setTransfers(tRes.data.data || []);
      setProducts(pRes.data.data || []);
      setStores(sRes.data.data || []);
    } catch {
      toast.error('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransfers = async () => {
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const res = await api.get(`/transfers${params}`);
      setTransfers(res.data.data || []);
    } catch {
      toast.error('Failed to refresh transfers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId || !form.toStoreId || !form.quantity) {
      toast.error('Product, destination store, and quantity are required');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/transfers', {
        productId: form.productId,
        fromStoreId: form.fromStoreId || undefined,
        toStoreId: form.toStoreId,
        quantity: parseInt(form.quantity),
        unitPrice: form.unitPrice ? parseFloat(form.unitPrice) : undefined,
        notes: form.notes || undefined,
        paymentMethod: form.paymentMethod,
        dueDate: form.dueDate || undefined
      });
      toast.success('Transfer created');
      setShowForm(false);
      setForm(emptyForm);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/transfers/${id}/status`, { status });
      toast.success('Status updated');
      fetchTransfers();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const fmt = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n || 0);

  const displayed = filterStatus
    ? transfers.filter(t => t.status === filterStatus)
    : transfers;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Inventory Transfers
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Move stock between stores
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> New Transfer
        </button>
      </div>

      {/* Filter */}
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
            onClick={() => { setFilterStatus(s); }}
            className={filterStatus === s ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.4rem 0.875rem', fontSize: '0.8125rem', textTransform: 'capitalize' }}
          >
            {s}
          </button>
        ))}
        <button onClick={fetchTransfers} className="btn-secondary" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.875rem', fontSize: '0.8125rem' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700 }}>New Inventory Transfer</h2>
              <button onClick={() => { setShowForm(false); setForm(emptyForm); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label className="form-label">Product *</label>
                  <select className="form-input" value={form.productId} onChange={e => setForm(p => ({ ...p, productId: e.target.value }))} required>
                    <option value="">Select product…</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'end' }}>
                  <div>
                    <label className="form-label">From Store (optional)</label>
                    <select className="form-input" value={form.fromStoreId} onChange={e => setForm(p => ({ ...p, fromStoreId: e.target.value }))}>
                      <option value="">Warehouse / External</option>
                      {stores.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 2 }}>
                    <ArrowRight size={18} color="var(--text-muted)" />
                  </div>
                  <div>
                    <label className="form-label">To Store *</label>
                    <select className="form-input" value={form.toStoreId} onChange={e => setForm(p => ({ ...p, toStoreId: e.target.value }))} required>
                      <option value="">Select store…</option>
                      {stores.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Quantity *</label>
                    <input type="number" className="form-input" min="1" placeholder="0" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label">Unit Price (optional)</label>
                    <input type="number" className="form-input" min="0" step="0.01" placeholder="Auto from product" value={form.unitPrice} onChange={e => setForm(p => ({ ...p, unitPrice: e.target.value }))} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Payment Method</label>
                    <select className="form-input" value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Due Date</label>
                    <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" rows={3} placeholder="Optional notes…" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setForm(emptyForm); }}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Creating…' : 'Create Transfer'}
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
        ) : displayed.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No transfers found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                  {['Invoice', 'Product', 'Route', 'Qty', 'Total', 'Status', 'Date', ''].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                      {t.referenceInvoice || t.id?.slice(0, 8)}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                      <div>{t.product?.name || '—'}</div>
                      {t.product?.sku && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.product.sku}</div>}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-body)', whiteSpace: 'nowrap' }}>
                      <span>{t.sourceStore?.name || 'Warehouse'}</span>
                      <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>→</span>
                      <span>{t.destinationStore?.name || '—'}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                      {t.quantity}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                      {fmt(t.totalAmount)}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 100,
                        background: `${STATUS_COLORS[t.status] || '#6b7280'}18`,
                        color: STATUS_COLORS[t.status] || '#6b7280',
                        textTransform: 'capitalize'
                      }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <select
                        value={t.status}
                        onChange={e => updateStatus(t.id, e.target.value)}
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
