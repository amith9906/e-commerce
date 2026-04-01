import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, X, Tag, Trash2 } from 'lucide-react';
import api from '../../api/client';
import { useBrand } from '../../context/BrandContext';

const emptyForm = {
  productId: '',
  minQuantity: '',
  price: '',
  label: '',
  storeId: '',
  startDate: '',
  endDate: ''
};

export default function PricingRules() {
  const { currency = 'USD' } = useBrand();
  const [rules, setRules] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [rRes, pRes, sRes] = await Promise.all([
        api.get('/pricing'),
        api.get('/products?limit=200'),
        api.get('/stores')
      ]);
      setRules(rRes.data.data || []);
      setProducts(pRes.data.data || []);
      setStores(sRes.data.data || []);
    } catch {
      toast.error('Failed to load pricing rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId || !form.minQuantity || !form.price) {
      toast.error('Product, minimum quantity, and price are required');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/pricing', {
        productId: form.productId,
        minQuantity: parseInt(form.minQuantity),
        price: parseFloat(form.price),
        label: form.label || undefined,
        storeId: form.storeId || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined
      });
      toast.success('Pricing rule created');
      setShowForm(false);
      setForm(emptyForm);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create pricing rule');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n || 0);

  const getProductName = (id) => products.find(p => p.id === id)?.name || id?.slice(0, 8);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Volume Pricing Rules
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Set quantity-based discounted prices for products
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> New Rule
        </button>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700 }}>New Pricing Rule</h2>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Minimum Quantity *</label>
                    <input type="number" className="form-input" min="1" placeholder="e.g. 10" value={form.minQuantity} onChange={e => setForm(p => ({ ...p, minQuantity: e.target.value }))} required />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Rule applies when qty ≥ this value
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Discounted Price *</label>
                    <input type="number" className="form-input" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Price per unit in {currency}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="form-label">Label (optional)</label>
                  <input type="text" className="form-input" placeholder="e.g. Bulk Discount, Wholesale Price" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} />
                </div>

                <div>
                  <label className="form-label">Store Scope (optional)</label>
                  <select className="form-input" value={form.storeId} onChange={e => setForm(p => ({ ...p, storeId: e.target.value }))}>
                    <option value="">All stores</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Start Date</label>
                    <input type="date" className="form-input" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">End Date</label>
                    <input type="date" className="form-input" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setForm(emptyForm); }}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Creating…' : 'Create Rule'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rules Table */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : rules.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Tag size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <div>No pricing rules yet. Create one to offer volume discounts.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                  {['Product', 'Min Qty', 'Discount Price', 'Label', 'Store', 'Valid', ''].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => (
                  <tr key={rule.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)' }}>
                      {getProductName(rule.productId)}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                      ≥ {rule.minQuantity} units
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', fontWeight: 600, color: '#22c55e', whiteSpace: 'nowrap' }}>
                      {fmt(rule.price)}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {rule.label || '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {rule.storeId ? stores.find(s => s.id === rule.storeId)?.name || 'Unknown' : 'All stores'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {rule.startDate ? new Date(rule.startDate).toLocaleDateString() : '—'}
                      {' → '}
                      {rule.endDate ? new Date(rule.endDate).toLocaleDateString() : '∞'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                        title="Delete rule"
                        onClick={() => toast.info('Delete not yet implemented')}
                      >
                        <Trash2 size={14} />
                      </button>
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
