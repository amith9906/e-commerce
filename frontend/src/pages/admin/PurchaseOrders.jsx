'use strict';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useBrand } from '../../context/BrandContext';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { formatCurrency } from '../../utils/formatCurrency';
import PaginationControls from '../../components/PaginationControls';
import { Search } from 'lucide-react';

const createEmptyLine = () => ({ productId: '', quantity: 1, unitPrice: '', discountAmount: '', taxRate: '' });

const createInitialForm = (currency) => ({
  supplierId: '',
  storeId: '',
  currency: currency || 'INR',
  expectedDeliveryDate: '',
  notes: '',
  orderNumber: '',
  items: [createEmptyLine()],
});

export default function PurchaseOrders() {
  const { currency: brandCurrency = 'INR' } = useBrand();
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(() => createInitialForm(brandCurrency));
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receivingId, setReceivingId] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', status: '' });
  const PAGE_LIMIT = 10;

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      if (res.success) {
        setSuppliers(res.data || []);
      }
    } catch (err) {
      toast.error(err.message || 'Unable to load suppliers.');
    }
  };

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

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('/purchase-orders', {
        params: {
          page,
          limit: PAGE_LIMIT,
          q: filters.search || undefined,
          status: filters.status || undefined
        }
      });
      if (res.success) {
        const meta = res.pagination || { currentPage: page, pages: 1, total: (res.data || []).length };
        if (meta.pages && page > meta.pages) {
          setPage(meta.pages);
        }
        setOrders(res.data || []);
        setPagination(meta);
      }
    } catch (err) {
      toast.error(err.message || 'Unable to load purchase orders.');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchStores();
    fetchProducts();
  }, []);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const params = { page, limit: PAGE_LIMIT };
      if (filters.search) params.q = filters.search;
      if (filters.status) params.status = filters.status;
      const res = await api.get('/purchase-orders', { params });
      if (res.success) {
        setOrders(res.data);
        const meta = res.pagination || { currentPage: page, pages: 1, total: res.data?.length || 0 };
        setPagination(meta);
      }
    } catch (err) {
      toast.error('Failed to load purchase orders.');
    } finally {
      setLoadingOrders(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.supplierId) {
      toast.error('Please pick a supplier.');
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
      toast.error('Add at least one line item with a product and quantity.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/purchase-orders', {
        supplierId: form.supplierId,
        storeId: form.storeId || undefined,
        currency: form.currency || brandCurrency,
        expectedDeliveryDate: form.expectedDeliveryDate || undefined,
        notes: form.notes || undefined,
        orderNumber: form.orderNumber || undefined,
        items: normalizedItems,
      });
      toast.success('Purchase order created.');
      setForm(createInitialForm(brandCurrency));
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Unable to create purchase order.');
    } finally {
      setSaving(false);
    }
  };

  const handleReceive = async (orderId) => {
    setReceivingId(orderId);
    try {
      const detail = await api.get(`/purchase-orders/${orderId}`);
      if (!detail.success) {
        throw new Error(detail.message || 'Failed to load order details.');
      }
      const itemsToReceive = (detail.data.items || [])
        .map((item) => ({
          productId: item.productId,
          quantity: Math.max(0, (item.quantity || 0) - (item.receivedQuantity || 0))
        }))
        .filter((item) => item.quantity > 0);
      if (!itemsToReceive.length) {
        toast.info('This order is already fully received.');
        return;
      }
      await api.post(`/purchase-orders/${orderId}/receive`, { items: itemsToReceive });
      toast.success('Inventory received.');
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Unable to receive order.');
    } finally {
      setReceivingId('');
    }
  };

  const renderStatusBadge = (status) => {
    const colors = {
      draft: { bg: '#eef2ff', color: '#4338ca' },
      ordered: { bg: '#f0fdf4', color: '#047857' },
      partial: { bg: '#fdf2f8', color: '#be185d' },
      received: { bg: '#ecfdf5', color: '#047857' },
      cancelled: { bg: '#fef2f2', color: '#b91c1c' },
    };
    const meta = colors[status] || { bg: '#f3f4f6', color: '#4b5563' };
    return (
      <span style={{
        background: meta.bg,
        color: meta.color,
        padding: '0.2rem 0.8rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        textTransform: 'capitalize',
        fontWeight: 600
      }}>
        {status || 'draft'}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Purchase orders</h1>
        <p style={{ color: '#64748b' }}>Raise orders, assign stores, and receive inventory directly from here.</p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Create new purchase order</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <label>
              Supplier
              <select
                className="input-field"
                value={form.supplierId}
                onChange={(event) => handleFormChange('supplierId', event.target.value)}
              >
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </label>
            <label>
              Store (optional)
              <select
                className="input-field"
                value={form.storeId}
                onChange={(event) => handleFormChange('storeId', event.target.value)}
              >
                <option value="">Any store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </label>
            <label>
              Currency
              <input
                className="input-field"
                value={form.currency}
                onChange={(event) => handleFormChange('currency', event.target.value)}
                placeholder={brandCurrency}
              />
            </label>
            <label>
              Order number
              <input
                className="input-field"
                value={form.orderNumber}
                onChange={(event) => handleFormChange('orderNumber', event.target.value)}
                placeholder="PO-12345"
              />
            </label>
            <label>
              Delivery date
              <input
                className="input-field"
                type="date"
                value={form.expectedDeliveryDate}
                onChange={(event) => handleFormChange('expectedDeliveryDate', event.target.value)}
              />
            </label>
          </div>
          <label>
            Notes
            <textarea
              className="input-field"
              rows={2}
              value={form.notes}
              onChange={(event) => handleFormChange('notes', event.target.value)}
              placeholder="Communication for suppliers"
            />
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Line items</strong>
              <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} onClick={addLine}>
                Add item
              </button>
            </div>
            {form.items.map((item, index) => (
              <div key={`line-${index}`} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
                <label>
                  Product
                  <select className="input-field" value={item.productId} onChange={(event) => updateLine(index, 'productId', event.target.value)}>
                    <option value="">Select a product</option>
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
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={saving} style={{ width: 'auto' }}>
              {saving ? 'Creating order…' : 'Create purchase order'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>Recent purchase orders</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Track status, totals, and receive stock with a single click.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.75rem', borderRadius: '999px', border: '1px solid var(--border-color)', background: 'white' }}>
              <Search size={16} color="#94a3b8" />
              <input
                className="input-field"
                placeholder="Search order or supplier"
                style={{ border: 'none', padding: 0, width: '220px' }}
                value={filters.search}
                onChange={(event) => handleFilterChange('search', event.target.value)}
              />
            </div>
            <select
              className="input-field"
              value={filters.status}
              onChange={(event) => handleFilterChange('status', event.target.value)}
              style={{ width: '160px' }}
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="ordered">Ordered</option>
              <option value="partial">Partial</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button type="button" className="btn-secondary" onClick={fetchOrders} style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
              Refresh
            </button>
          </div>
        </div>
        <div className="table-responsive" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>
                {['Order', 'Supplier', 'Store', 'Status', 'Total', 'Expected', 'Actions'].map((title) => (
                  <th key={title} style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid #e5e7eb' }}>{title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingOrders && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '1rem' }}>Loading purchase orders…</td>
                </tr>
              )}
              {!loadingOrders && orders.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '1rem' }}>No purchase orders yet.</td>
                </tr>
              )}
              {!loadingOrders && orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <strong>{order.orderNumber || order.id.slice(0, 8)}</strong>
                    <br />
                    <small style={{ color: '#64748b' }}>{new Date(order.createdAt).toLocaleDateString()}</small>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{order.supplier?.name || '—'}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{order.store?.name || 'Any store'}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{renderStatusBadge(order.status)}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{formatCurrency(order.totalAmount || 0, order.currency || brandCurrency)}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : 'TBD'}</td>
                  <td style={{ padding: '0.75rem 0.5rem', display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleReceive(order.id)}
                      disabled={receivingId === order.id || order.status === 'received'}
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      {receivingId === order.id ? 'Receiving…' : order.status === 'received' ? 'Received' : 'Receive stock'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationControls
          currentPage={pagination.currentPage || page}
          totalPages={Math.max(1, pagination.pages || 1)}
          onChange={(targetPage) => setPage(targetPage)}
        />
      </div>
    </div>
  );
}
