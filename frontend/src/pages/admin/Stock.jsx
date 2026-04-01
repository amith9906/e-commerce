import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { getProductCover } from '../../utils/productImage';
import PaginationControls from '../../components/PaginationControls';

export default function Stock() {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, pages: 1, total: 0 });
  const PAGE_LIMIT = 10;

  const fetchStock = () => {
    setLoading(true);
    const params = { page, limit: PAGE_LIMIT };
    if (filters.search) params.q = filters.search;
    if (filters.status && filters.status !== 'all') params.status = filters.status;
    api.get('/stock', { params })
      .then(res => {
        if (res.success) {
          setStockItems(res.data);
          const meta = res.pagination || { currentPage: page, pages: 1, total: res.data?.length || 0 };
          setPagination(meta);
          if (meta.pages && page > meta.pages) {
            setPage(meta.pages);
          }
        }
      })
      .catch(() => toast.error('Failed to load stock inventory'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStock();
  }, [page, filters.search, filters.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', status: 'all' });
    setPage(1);
  };

  const handleUpdateStock = useCallback(async (productId, newQuantity) => {
    const qty = Number(newQuantity);
    if (isNaN(qty) || qty < 0) return;
    try {
      const res = await api.put(`/stock/${productId}`, { quantity: qty });
      if (res.success) {
        toast.success('Stock updated');
        fetchStock();
      }
    } catch (err) {
      toast.error('Failed to update stock');
    }
  }, [fetchStock]);

  const stockRows = useMemo(() => stockItems.map((item) => {
    const isLow = item.quantity <= item.lowStockThreshold;
    return (
      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
        <td style={{ padding: '1rem' }}>
          {isLow ? <AlertCircle color="#ef4444" size={20} title="Low Stock!" /> : <CheckCircle color="#10b981" size={20} />}
        </td>
        <td style={{ padding: '1rem', fontWeight: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
              <img src={getProductCover(item.product?.images)} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {item.product?.name || 'Unknown Product'}
          </div>
        </td>
        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{item.lowStockThreshold}</td>
        <td style={{ padding: '1rem' }}>
          <span style={{
            fontWeight: 600,
            color: isLow ? '#ef4444' : 'inherit'
          }}>
            {item.quantity}
          </span>
        </td>
        <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
          <button
            className="btn-primary"
            style={{ padding: '0.25rem 0.75rem', backgroundColor: '#e2e8f0', color: '#0f172a', border: 'none' }}
            onClick={() => handleUpdateStock(item.productId, item.quantity - 1)}
          >-</button>
          <input
            type="number"
            defaultValue={item.quantity}
            onBlur={(e) => handleUpdateStock(item.productId, e.target.value)}
            style={{ width: '70px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.25rem' }}
          />
          <button
            className="btn-primary"
            style={{ padding: '0.25rem 0.75rem', border: 'none' }}
            onClick={() => handleUpdateStock(item.productId, item.quantity + 1)}
          >+</button>
        </td>
      </tr>
    );
  }), [stockItems, handleUpdateStock]);

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>Inventory Management</h1>

      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1rem', padding: '1rem 1.25rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Search products
          <input
            type="search"
            className="input-field"
            placeholder="Product name or SKU"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Inventory Status
          <select
            className="input-field"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
            <option value="in_stock">Above threshold</option>
          </select>
        </label>
        <button type="button" className="btn-secondary" onClick={clearFilters} style={{ justifyContent: 'center' }}>
          Clear filters
        </button>
      </div>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Product</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Threshold</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Current Qty</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)', textAlign: 'center' }}>Quick Update</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : stockItems.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>No inventory found.</td></tr>
            ) : (
              stockRows
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
