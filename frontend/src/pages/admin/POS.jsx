'use strict';
import { useEffect, useState } from 'react';
import { useBrand } from '../../context/BrandContext';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { formatCurrency } from '../../utils/formatCurrency';

const STATUS_OPTIONS = ['pending', 'paid', 'cancelled'];
const PAYMENT_METHODS = ['cash', 'card', 'upi', 'wallet', 'bank_transfer'];

const createEmptyLine = () => ({ productId: '', quantity: 1, unitPrice: '', discountAmount: '', taxRate: '' });
const createInitialForm = (currency) => ({
  storeId: '',
  salespersonId: '',
  currency: currency || 'INR',
  paymentMethod: 'cash',
  paidAmount: '',
  status: 'pending',
  notes: '',
  items: [createEmptyLine()],
});

export default function POS() {
  const { currency: brandCurrency = 'INR' } = useBrand();
  const [receipts, setReceipts] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [form, setForm] = useState(() => createInitialForm(brandCurrency));
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState('');

  const fetchStores = async () => {
    try {
      const res = await api.get('/stores');
      if (res.success) {
        setStores(res.data || []);
      }
    } catch (err) {
      toast.error(err.message || 'Unable to load stores.');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { limit: 200 } });
      if (res.success) {
        setProducts(res.data || []);
      }
    } catch (err) {
      toast.error(err.message || 'Unable to load products.');
    }
  };

  const fetchSalespeople = async () => {
    try {
      const res = await api.get('/users');
      if (res.success) {
        const people = res.data || [];
        setSalespeople(people.filter((user) => user.role === 'salesperson'));
      }
    } catch (err) {
      toast.error(err.message || 'Unable to load salespersons.');
    }
  };

  const fetchReceipts = async () => {
    setLoadingReceipts(true);
    try {
      const res = await api.get('/pos/receipts', { params: { limit: 25 } });
      if (res.success) {
        setReceipts(res.data || []);
      }
    } catch (err) {
      toast.error(err.message || 'Unable to load POS receipts.');
    } finally {
      setLoadingReceipts(false);
    }
  };

  useEffect(() => {
    fetchStores();
    fetchProducts();
    fetchSalespeople();
    fetchReceipts();
  }, []);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateLine = (index, field, value) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addLine = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, createEmptyLine()] }));
  };

  const removeLine = (index) => {
    setForm((prev) => {
      const items = prev.items.filter((_, idx) => idx !== index);
      return { ...prev, items: items.length ? items : [createEmptyLine()] };
    });
  };

  const resetForm = () => {
    setForm(createInitialForm(brandCurrency));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.storeId) {
      toast.error('Select a store for the receipt.');
      return;
    }

    const normalizedItems = form.items
      .map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        discountAmount: Number(item.discountAmount) || 0,
        taxRate: Number(item.taxRate) || 0,
      }))
      .filter((item) => item.productId && item.quantity > 0);

    if (!normalizedItems.length) {
      toast.error('Add at least one product with a quantity.');
      return;
    }

    setCreating(true);
    try {
      await api.post('/pos/receipts', {
        storeId: form.storeId,
        salespersonId: form.salespersonId || undefined,
        currency: form.currency || brandCurrency,
        paymentMethod: form.paymentMethod || undefined,
        paidAmount: form.paidAmount ? Number(form.paidAmount) : undefined,
        status: form.status,
        notes: form.notes || undefined,
        items: normalizedItems,
      });
      toast.success('Receipt created.');
      resetForm();
      fetchReceipts();
    } catch (err) {
      toast.error(err.message || 'Unable to save receipt.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (receiptId, payload, message) => {
    setUpdatingId(receiptId);
    try {
      await api.patch(`/pos/receipts/${receiptId}`, payload);
      toast.success(message);
      fetchReceipts();
    } catch (err) {
      toast.error(err.message || 'Unable to update receipt.');
    } finally {
      setUpdatingId('');
    }
  };

  const markAsPaid = (receipt) => {
    handleUpdateStatus(receipt.id, { status: 'paid', paidAmount: receipt.totalAmount || 0 }, 'Receipt marked as paid.');
  };

  const cancelReceipt = (receipt) => {
    handleUpdateStatus(receipt.id, { status: 'cancelled' }, 'Receipt cancelled.');
  };

  const renderStatusBadge = (status) => {
    const palette = {
      pending: { bg: '#f0f9ff', color: '#1d4ed8' },
      paid: { bg: '#ecfdf5', color: '#047857' },
      cancelled: { bg: '#fef2f2', color: '#b91c1c' },
    };
    const meta = palette[status] || { bg: '#f3f4f6', color: '#475569' };
    return (
      <span style={{
        background: meta.bg,
        color: meta.color,
        padding: '0.2rem 0.75rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'capitalize'
      }}>
        {status || 'pending'}
      </span>
    );
  };

  const summarizeItems = (receipt) => {
    if (!receipt.items?.length) return 'No items';
    const names = receipt.items.map((item) => item.product?.name || 'Product').filter(Boolean);
    if (!names.length) return `${receipt.items.length} items`;
    const preview = names.slice(0, 2).join(', ');
    return names.length > 2 ? `${preview} + more` : preview;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>POS Mode</h1>
        <p style={{ color: '#64748b' }}>Record walk-in sales, collect payment data, and keep offline stock in sync.</p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>New POS receipt</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <label>
              Store
              <select className="input-field" value={form.storeId} onChange={(event) => handleFormChange('storeId', event.target.value)}>
                <option value="">Select store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </label>
            <label>
              Salesperson
              <select className="input-field" value={form.salespersonId} onChange={(event) => handleFormChange('salespersonId', event.target.value)}>
                <option value="">Choose salesperson</option>
                {salespeople.map((person) => (
                  <option key={person.id} value={person.id}>{person.name}</option>
                ))}
              </select>
            </label>
            <label>
              Currency
              <input className="input-field" value={form.currency} onChange={(event) => handleFormChange('currency', event.target.value)} placeholder={brandCurrency} />
            </label>
            <label>
              Payment method
              <select className="input-field" value={form.paymentMethod} onChange={(event) => handleFormChange('paymentMethod', event.target.value)}>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>{method.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </label>
            <label>
              Paid amount
              <input
                className="input-field"
                type="number"
                min="0"
                step="0.01"
                value={form.paidAmount}
                onChange={(event) => handleFormChange('paidAmount', event.target.value)}
                placeholder="Leave blank until payment completes"
              />
            </label>
            <label>
              Status
              <select className="input-field" value={form.status} onChange={(event) => handleFormChange('status', event.target.value)}>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Notes
            <textarea
              className="input-field"
              rows={2}
              value={form.notes}
              onChange={(event) => handleFormChange('notes', event.target.value)}
              placeholder="Customer name, receipt number or reference"
            />
          </label>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <strong style={{ margin: 0 }}>Line items</strong>
            <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} onClick={addLine}>
              Add line
            </button>
          </div>
          {form.items.map((item, index) => (
            <div key={`line-${index}`} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
              <label>
                Product
                <select className="input-field" value={item.productId} onChange={(event) => updateLine(index, 'productId', event.target.value)}>
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Quantity
                <input
                  className="input-field"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) => updateLine(index, 'quantity', event.target.value)}
                />
              </label>
              <label>
                Unit price
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(event) => updateLine(index, 'unitPrice', event.target.value)}
                />
              </label>
              <label>
                Discount
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.discountAmount}
                  onChange={(event) => updateLine(index, 'discountAmount', event.target.value)}
                />
              </label>
              <label>
                Tax rate
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={item.taxRate}
                  onChange={(event) => updateLine(index, 'taxRate', event.target.value)}
                />
              </label>
              <div>
                <button type="button" className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }} onClick={() => removeLine(index)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={creating} style={{ width: 'auto' }}>
              {creating ? 'Creating receipt…' : 'Create receipt'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>Recent POS receipts</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Review offline sales, payment status, and store transfer impact.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={fetchReceipts} style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
            Refresh
          </button>
        </div>
        <div className="table-responsive" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>
                {['Receipt', 'Store', 'Salesperson', 'Status', 'Total', 'Paid', 'Method', 'Items', 'Actions'].map((title) => (
                  <th key={title} style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid #e5e7eb' }}>{title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingReceipts && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '1rem' }}>Loading receipts…</td>
                </tr>
              )}
              {!loadingReceipts && receipts.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '1rem' }}>No POS receipts recorded yet.</td>
                </tr>
              )}
              {!loadingReceipts && receipts.map((receipt) => (
                <tr key={receipt.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <strong>{receipt.id.slice(0, 8)}</strong>
                    <br />
                    <small style={{ color: '#64748b' }}>{new Date(receipt.createdAt).toLocaleString()}</small>
                    {receipt.notes && (
                      <p style={{ color: '#475569', marginTop: '0.35rem', fontSize: '0.8rem' }}>{receipt.notes}</p>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{receipt.store?.name || '—'}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{receipt.salesperson?.name || '—'}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{renderStatusBadge(receipt.status)}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{formatCurrency(receipt.totalAmount || 0, receipt.currency || brandCurrency)}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{formatCurrency(receipt.paidAmount || 0, receipt.currency || brandCurrency)}</td>
                  <td style={{ padding: '0.75rem 0.5rem', textTransform: 'capitalize' }}>{receipt.paymentMethod || '—'}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{summarizeItems(receipt)}</td>
                  <td style={{ padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => markAsPaid(receipt)}
                      disabled={updatingId === receipt.id || receipt.status === 'paid'}
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      {updatingId === receipt.id && receipt.status !== 'paid' ? 'Updating…' : receipt.status === 'paid' ? 'Paid' : 'Mark paid'}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => cancelReceipt(receipt)}
                      disabled={updatingId === receipt.id || receipt.status === 'cancelled'}
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      {receipt.status === 'cancelled' ? 'Cancelled' : 'Cancel'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}