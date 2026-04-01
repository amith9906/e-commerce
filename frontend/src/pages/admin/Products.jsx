import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api, { cachedGet } from '../../api/client';
import { Plus, Trash2, Edit, X, Eye } from 'lucide-react';
import { getProductCover } from '../../utils/productImage';
import PaginationControls from '../../components/PaginationControls';
import { formatCurrency } from '../../utils/formatCurrency';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { useBrand } from '../../context/BrandContext';

const formatOfferExpiryLabel = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatHistoryDate = (value) => {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: '', brand: '', status: 'all' });
  const [metaFilters, setMetaFilters] = useState({ categories: [], brands: [] });
  const [isModalOpen, setModalOpen] = useState(false);
  const { currency: brandCurrency = 'INR' } = useBrand();
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, pages: 1, total: 0 });
  const limit = 10;
  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 360);
  const [editingProduct, setEditingProduct] = useState(null);
  const [historyState, setHistoryState] = useState({ open: false, loading: false, entries: [], product: null, lowest: null });

  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const defaultFormValues = {
    name: '',
    price: '',
    category: '',
    brand: '',
    sku: '',
    description: '',
    salePrice: '',
    offerLabel: '',
    offerExpiresAt: ''
    , isBestSeller: false
  };

  const TEMPLATE_COLUMNS = [
    'SKU', 'Name', 'Description', 'Category', 'Brand', 'Color', 'Size',
    'Price', 'SalePrice', 'OfferLabel', 'OfferExpiresAt',
    'StockQuantity', 'LowStockThreshold', 'Images', 'AvailableSizes',
    'AvailableColors', 'Highlights', 'Specifications', 'IsActive'
  ];
  
  // New states for dynamic fields
  const [highlights, setHighlights] = useState([]);
  const [currentHighlight, setCurrentHighlight] = useState('');
  const [specifications, setSpecifications] = useState({});
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  // Variant states
  const [hasSizes, setHasSizes] = useState(false);
  const [hasColors, setHasColors] = useState(false);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [currentSize, setCurrentSize] = useState('');
  const [availableColors, setAvailableColors] = useState([]);
  const [currentColor, setCurrentColor] = useState('');

  const addSize = () => {
    const val = currentSize.trim();
    if (!val || availableSizes.includes(val)) return;
    setAvailableSizes([...availableSizes, val]);
    setCurrentSize('');
  };
  const removeSize = (s) => setAvailableSizes(availableSizes.filter(x => x !== s));

  const addColor = () => {
    const val = currentColor.trim();
    if (!val || availableColors.includes(val)) return;
    setAvailableColors([...availableColors, val]);
    setCurrentColor('');
  };
  const removeColor = (c) => setAvailableColors(availableColors.filter(x => x !== c));

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const formatDateForInput = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 16);
  };

  const resetModalState = () => {
    reset({ ...defaultFormValues });
    setHighlights([]);
    setSpecifications({});
    setHasSizes(false);
    setHasColors(false);
    setAvailableSizes([]);
    setAvailableColors([]);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetModalState();
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetModalState();
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    reset({
      name: product.name || '',
      price: product.price || '',
      category: product.category || '',
      brand: product.brand || '',
      sku: product.sku || '',
      description: product.description || '',
      salePrice: product.salePrice ?? '',
      offerLabel: product.offerLabel ?? '',
      offerExpiresAt: formatDateForInput(product.offerExpiresAt)
      , isBestSeller: Boolean(product.isBestSeller)
    });
    setHighlights(product.highlights || []);
    setSpecifications(product.specifications || {});
    const sizes = product.availableSizes || [];
    const colors = product.availableColors || [];
    setHasSizes(sizes.length > 0);
    setHasColors(colors.length > 0);
    setAvailableSizes(sizes);
    setAvailableColors(colors);
    setEditingProduct(product);
    setModalOpen(true);
  };

  const modalTitle = editingProduct ? 'Edit Product' : 'Add New Product';
  const modalSubmitLabel = editingProduct ? 'Save changes' : 'Create Product';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = {
      page,
      limit,
    };
    if (filters.search) params.q = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.brand) params.brand = filters.brand;
    if (filters.status && filters.status !== 'all') params.status = filters.status;
    try {
      const res = await api.get('/products', { params });
      if (res.success) {
        const meta = res.pagination || {
          currentPage: page,
          pages: 1,
          total: res.data?.length || 0
        };
        if (meta.pages && page > meta.pages) {
          setPage(Math.max(1, meta.pages));
          return;
        }
        setProducts(res.data);
        setPagination(meta);
      }
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, filters.search, filters.category, filters.brand, filters.status]);

  useEffect(() => {
    setFilters((prev) => {
      if (prev.search === debouncedSearchTerm) return prev;
      setPage(1);
      return { ...prev, search: debouncedSearchTerm };
    });
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await cachedGet('/products/meta/filters', { cacheTTL: 300_000 });
        if (res.success) {
          setMetaFilters({
            categories: res.data?.categories || [],
            brands: res.data?.brands || [],
          });
        }
      } catch (err) {
        console.error('Unable to load product metadata', err);
      }
    };
    fetchMeta();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '', brand: '', status: 'all' });
    setSearchTerm('');
    setPage(1);
  };

  const addHighlight = () => {
    if (!currentHighlight.trim()) return;
    setHighlights([...highlights, currentHighlight.trim()]);
    setCurrentHighlight('');
  };

  const removeHighlight = (index) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const addSpec = () => {
    if (!specKey.trim() || !specValue.trim()) return;
    setSpecifications({ ...specifications, [specKey.trim()]: specValue.trim() });
    setSpecKey('');
    setSpecValue('');
  };

  const removeSpec = (key) => {
    const newSpecs = { ...specifications };
    delete newSpecs[key];
    setSpecifications(newSpecs);
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('price', data.price);
      if (data.salePrice) {
        formData.append('salePrice', data.salePrice);
      }
      if (data.offerLabel) {
        formData.append('offerLabel', data.offerLabel.trim());
      }
      if (data.offerExpiresAt) {
        const iso = new Date(data.offerExpiresAt).toISOString();
        formData.append('offerExpiresAt', iso);
      }
      formData.append('isBestSeller', data.isBestSeller ? 'true' : 'false');
      formData.append('category', data.category);
      formData.append('description', data.description || '');
      formData.append('brand', data.brand || '');
      formData.append('sku', data.sku || '');
      
      // Send complex fields as JSON strings
      formData.append('highlights', JSON.stringify(highlights));
      formData.append('specifications', JSON.stringify(specifications));
      formData.append('availableSizes', JSON.stringify(hasSizes ? availableSizes : []));
      formData.append('availableColors', JSON.stringify(hasColors ? availableColors : []));

      if (data.stockQuantity) formData.append('stockQuantity', data.stockQuantity);
      if (data.images && data.images.length > 0) {
        Array.from(data.images).forEach(file => {
          formData.append('images', file);
        });
      }

      const endpoint = editingProduct ? `/products/${editingProduct.id}` : '/products';
      const method = editingProduct ? api.put : api.post;
      const res = await method(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.success) {
        toast.success(editingProduct ? 'Product updated' : 'Product created');
        setModalOpen(false);
        resetModalState();
        setEditingProduct(null);
        fetchProducts();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    }
  };

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.success) {
        toast.success('Product deleted');
        fetchProducts();
      }
    } catch (err) {
      toast.error('Failed to delete product');
    }
  }, [fetchProducts]);

  const openHistory = async (product) => {
    setHistoryState({ open: true, loading: true, entries: [], product, lowest: null });
    try {
      const res = await api.get(`/products/${product.id}/price-history`);
      if (res.success) {
        const entries = res.data || [];
        const lowest = entries.reduce((acc, entry) => {
          const sale = entry.salePrice ?? entry.sale_price ?? null;
          if (sale === null || sale === undefined) return acc;
          const value = Number(sale);
          if (Number.isNaN(value)) return acc;
          if (acc === null || value < acc) return value;
          return acc;
        }, null);
        setHistoryState({ open: true, loading: false, entries, product, lowest });
        return;
      }
      toast.error(res.message || 'Unable to load price history.');
      setHistoryState((prev) => ({ ...prev, loading: false }));
    } catch (err) {
      toast.error('Failed to fetch price history.');
      setHistoryState((prev) => ({ ...prev, loading: false }));
    }
  };

  const closeHistory = () => {
    setHistoryState({ open: false, loading: false, entries: [], product: null, lowest: null });
  };

  const productRows = useMemo(() => products.map((p) => {
    const salePriceValue = p.salePrice !== null && p.salePrice !== undefined ? Number(p.salePrice) : null;
    const hasOffer = salePriceValue !== null && Number(p.price) > salePriceValue;
    const percentOff = hasOffer && p.price ? Math.round(((Number(p.price) - salePriceValue) / Number(p.price)) * 100) : null;
    const expiryLabel = formatOfferExpiryLabel(p.offerExpiresAt);
    const cover = getProductCover(p.images);
    return (
      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
        <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
            <img src={cover} alt={p.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {p.name}
              {p.isBestSeller && (
                <span style={{ backgroundColor: '#fde68a', color: '#92400e', fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>
                  Best seller
                </span>
              )}
            </span>
          </div>
        </td>
        <td style={{ padding: '1rem' }}>{p.category}</td>
        <td style={{ padding: '1rem' }}>
          {hasOffer ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ textDecoration: 'line-through', color: '#64748b' }}>{formatCurrency(p.price, brandCurrency)}</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatCurrency(salePriceValue, brandCurrency)}</span>
                {percentOff ? (
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, marginLeft: '0.35rem' }}>
                    {percentOff}% off
                  </span>
                ) : null}
              </div>
              {p.offerLabel && <div style={{ fontSize: '0.75rem', color: '#475569' }}>{p.offerLabel}</div>}
              {expiryLabel && <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Ends {expiryLabel}</div>}
            </div>
          ) : (
            <span style={{ fontWeight: 600 }}>{formatCurrency(p.price, brandCurrency)}</span>
          )}
          {p.lowestSalePriceEver && (
            <div style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: 600, marginTop: '0.35rem' }}>
              All-time low {formatCurrency(p.lowestSalePriceEver, brandCurrency)}
            </div>
          )}
        </td>
        <td style={{ padding: '1rem' }}>
          <span style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '999px',
            fontSize: '0.875rem',
            backgroundColor: p.stock?.quantity <= (p.stock?.lowStockThreshold || 5) ? '#fee2e2' : '#d1fae5',
            color: p.stock?.quantity <= (p.stock?.lowStockThreshold || 5) ? '#ef4444' : '#10b981'
          }}>
            {p.stock?.quantity || 0}
          </span>
        </td>
        <td style={{ padding: '1rem', textAlign: 'right' }}>
          <a
            href={`/products/${p.id}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{
              marginRight: '0.5rem',
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              display: 'inline-flex',
              gap: '0.25rem',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Eye size={14} /> View
          </a>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => openHistory(p)}
            disabled={historyState.loading && historyState.product?.id === p.id}
            style={{
              marginRight: '0.5rem',
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {historyState.loading && historyState.product?.id === p.id ? 'Loading...' : 'History'}
          </button>
        <button
          style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}
          onClick={() => openEditModal(p)}
        >
          <Edit size={18} />
        </button>
          <button style={{ color: '#ef4444' }} onClick={() => handleDelete(p.id)}><Trash2 size={18} /></button>
        </td>
      </tr>
    );
  }), [products, handleDelete, brandCurrency, historyState.loading, historyState.product?.id]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await api.get('/products/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('CSV export ready');
    } catch (err) {
      toast.error(err.message || 'Failed to export products');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportSummary(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.success) {
        setImportSummary(res.data);
        toast.success('CSV import finished');
        fetchProducts();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to import CSV');
    } finally {
      setImporting(false);
      if (event.target) event.target.value = '';
    }
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Products</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={handleExport} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {exporting ? 'Preparing CSV...' : 'Export CSV'}
          </button>
          <button className="btn-secondary" onClick={triggerImport} disabled={importing} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {importing ? 'Importing...' : 'Import CSV'}
          </button>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => openAddModal()}>
          <Plus size={18} /> Add Product
        </button>
        </div>
      </div>
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Search
      <input
        className="input-field"
        placeholder="Find by name, SKU, brand..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Category
          <select
            className="input-field"
            value={filters.category}
            onChange={(event) => handleFilterChange('category', event.target.value)}
          >
            <option value="">All Categories</option>
            {metaFilters.categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Brand
          <select
            className="input-field"
            value={filters.brand}
            onChange={(event) => handleFilterChange('brand', event.target.value)}
          >
            <option value="">All Brands</option>
            {metaFilters.brands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Status
          <select
            className="input-field"
            value={filters.status}
            onChange={(event) => handleFilterChange('status', event.target.value)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <button type="button" className="btn-secondary" onClick={clearFilters} style={{ justifyContent: 'center' }}>
          Clear filters
        </button>
      </div>
      <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
      <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: '#fdfdfd', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontWeight: 600 }}>CSV template</span>
        <span style={{ color: 'var(--text-muted)' }}>{TEMPLATE_COLUMNS.join(', ')}</span>
      </div>
      {importSummary && (
        <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <strong>Rows processed:</strong> {importSummary.total}
            </div>
            <div>
              <strong>Created:</strong> {importSummary.created} | <strong>Updated:</strong> {importSummary.updated}
            </div>
            <div>
              <strong>Skipped:</strong> {importSummary.skipped}
            </div>
          </div>
          {importSummary.failures && importSummary.failures.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <strong>Failures (first 5 rows shown):</strong>
              <ul style={{ marginTop: '0.25rem', paddingLeft: '1.25rem' }}>
                {importSummary.failures.slice(0, 5).map((failure) => (
                  <li key={`failure-${failure.row}`}>
                    Row {failure.row}: {failure.errors.join(' | ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Product</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Category</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Price / Offer</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Stock</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>No products found.</td></tr>
            ) : (
              productRows
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <PaginationControls
          currentPage={pagination.currentPage || page}
          totalPages={Math.max(1, pagination.pages || 1)}
          onChange={(targetPage) => setPage(targetPage)}
        />
      </div>

      {historyState.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110
        }}>
          <div className="card" style={{ width: 'min(95vw, 620px)', maxHeight: '80vh', overflowY: 'auto', padding: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Price history</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>{historyState.product?.name}</p>
              </div>
              <button onClick={closeHistory} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            {historyState.loading ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>Loading history...</div>
            ) : (
              <>
                {historyState.lowest !== null && (
                  <div style={{ marginBottom: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                    Lowest sale price ever {formatCurrency(historyState.lowest, brandCurrency)}
                  </div>
                )}
                {historyState.entries.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No price history available yet.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                          {['Date', 'Price', 'Sale price', 'Offer label'].map((header) => (
                            <th key={header} style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.75rem', color: '#475569' }}>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {historyState.entries.map((entry) => {
                          const saleValue = entry.salePrice ?? entry.sale_price ?? null;
                          const offerLabel = entry.offerLabel ?? entry.offer_label ?? '';
                          const effectiveAt = entry.effectiveAt ?? entry.effective_at;
                          return (
                            <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.65rem 0.5rem', fontSize: '0.8rem' }}>{formatHistoryDate(effectiveAt)}</td>
                              <td style={{ padding: '0.65rem 0.5rem', fontSize: '0.8rem' }}>{formatCurrency(entry.price, brandCurrency)}</td>
                              <td style={{ padding: '0.65rem 0.5rem', fontSize: '0.8rem' }}>
                                {saleValue !== null ? formatCurrency(saleValue, brandCurrency) : '-'}
                              </td>
                              <td style={{ padding: '0.65rem 0.5rem', fontSize: '0.8rem' }}>{offerLabel || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1, padding: '0.5rem 0' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{modalTitle}</h2>
              <button onClick={closeModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Name</label>
                    <input {...register('name', { required: 'Required' })} className="input-field" placeholder="Quantum X-15 Pro" />
                    {errors.name && <p className="error-text">{errors.name.message}</p>}
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Price</label>
                  <input {...register('price', { required: 'Required' })} type="number" step="0.01" className="input-field" placeholder="0.00" />
                  {errors.price && <p className="error-text">{errors.price.message}</p>}
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Sale price (optional)</label>
                  <input {...register('salePrice')} type="number" step="0.01" className="input-field" placeholder="0.00" />
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Only show an offer price when this is lower than the base price.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input {...register('isBestSeller')} type="checkbox" id="bestSellerCheckbox" />
                  <label htmlFor="bestSellerCheckbox" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Mark as best seller</label>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Category</label>
                  <input {...register('category', { required: 'Required' })} className="input-field" placeholder="Electronics" />
                  {errors.category && <p className="error-text">{errors.category.message}</p>}
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Brand</label>
                  <input {...register('brand')} className="input-field" placeholder="Quantum" />
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>SKU</label>
                  <input {...register('sku')} className="input-field" placeholder="QX-15-PRO" />
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Offer label</label>
                  <input {...register('offerLabel')} className="input-field" placeholder="Limited time promo" />
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Offer ends on</label>
                  <input {...register('offerExpiresAt')} type="datetime-local" className="input-field" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Description</label>
                <textarea {...register('description')} className="input-field" rows="3" placeholder="Detailed product description..."></textarea>
              </div>

              {/* Highlights Section */}
              <div className="card" style={{ padding: '1rem', backgroundColor: '#f8fafc' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Product Highlights</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input 
                    value={currentHighlight} 
                    onChange={e => setCurrentHighlight(e.target.value)}
                    className="input-field" 
                    placeholder="e.g. 5000mAh Battery" 
                  />
                  <button type="button" onClick={addHighlight} className="btn-primary" style={{ padding: '0 1rem' }}>Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {highlights.map((h, i) => (
                    <span key={i} style={{ 
                      backgroundColor: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', 
                      fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border-color)' 
                    }}>
                      {h} <X size={14} style={{ cursor: 'pointer' }} onClick={() => removeHighlight(i)} />
                    </span>
                  ))}
                </div>
              </div>

              {/* Specifications Section */}
              <div className="card" style={{ padding: '1rem', backgroundColor: '#f8fafc' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Technical Specifications</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <input 
                    value={specKey} 
                    onChange={e => setSpecKey(e.target.value)}
                    className="input-field" 
                    placeholder="Key (e.g. RAM)" 
                  />
                  <input 
                    value={specValue} 
                    onChange={e => setSpecValue(e.target.value)}
                    className="input-field" 
                    placeholder="Value (e.g. 12GB)" 
                  />
                  <button type="button" onClick={addSpec} className="btn-primary" style={{ padding: '0 1rem' }}>Add</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {Object.entries(specifications).map(([k, v]) => (
                    <div key={k} style={{ 
                      backgroundColor: 'white', padding: '0.5rem', borderRadius: '4px', 
                      fontSize: '0.875rem', border: '1px solid var(--border-color)', position: 'relative'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{k}</div>
                      <div>{v}</div>
                      <X 
                        size={14} 
                        style={{ position: 'absolute', top: '5px', right: '5px', cursor: 'pointer', color: '#ef4444' }} 
                        onClick={() => removeSpec(k)} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Variants Section */}
              <div className="card" style={{ padding: '1rem', backgroundColor: '#f8fafc' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>Product Variants</label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Enable only the variant types that apply to this product. Leave both off for products without variants (e.g. books, electronics).
                </p>

                {/* Size toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => { setHasSizes(v => !v); setAvailableSizes([]); }}
                    style={{
                      width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
                      background: hasSizes ? 'var(--primary)' : '#d1d5db', transition: 'background 0.2s',
                    }}
                  >
                    <span style={{ position: 'absolute', top: 3, left: hasSizes ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </button>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>This product has size options</span>
                </div>

                {hasSizes && (
                  <div style={{ marginBottom: '1rem', paddingLeft: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        value={currentSize}
                        onChange={e => setCurrentSize(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSize())}
                        className="input-field"
                        placeholder="e.g. S, M, L, XL, 42, 10..."
                        style={{ marginBottom: 0 }}
                      />
                      <button type="button" onClick={addSize} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>Add Size</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {availableSizes.map(s => (
                        <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'white', border: '1px solid var(--border)', borderRadius: 6, padding: '0.2rem 0.6rem', fontSize: '0.8rem', fontWeight: 600 }}>
                          {s}
                          <X size={12} style={{ cursor: 'pointer', color: '#ef4444' }} onClick={() => removeSize(s)} />
                        </span>
                      ))}
                      {availableSizes.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No sizes added yet</span>}
                    </div>
                  </div>
                )}

                {/* Color toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => { setHasColors(v => !v); setAvailableColors([]); }}
                    style={{
                      width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
                      background: hasColors ? 'var(--primary)' : '#d1d5db', transition: 'background 0.2s',
                    }}
                  >
                    <span style={{ position: 'absolute', top: 3, left: hasColors ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </button>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>This product has color options</span>
                </div>

                {hasColors && (
                  <div style={{ paddingLeft: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                      <input
                        value={currentColor}
                        onChange={e => setCurrentColor(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addColor())}
                        className="input-field"
                        placeholder="e.g. Red, #FF0000, Navy Blue..."
                        style={{ marginBottom: 0 }}
                      />
                      <input
                        type="color"
                        title="Pick a color"
                        onChange={e => setCurrentColor(e.target.value)}
                        style={{ width: 40, height: 40, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', padding: 2 }}
                      />
                      <button type="button" onClick={addColor} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>Add Color</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {availableColors.map(c => {
                        const isHex = /^#[0-9a-f]{3,8}$/i.test(c);
                        return (
                          <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'white', border: '1px solid var(--border)', borderRadius: 6, padding: '0.2rem 0.6rem', fontSize: '0.8rem', fontWeight: 600 }}>
                            {isHex && <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: c, border: '1px solid #e5e7eb', flexShrink: 0 }} />}
                            {c}
                            <X size={12} style={{ cursor: 'pointer', color: '#ef4444' }} onClick={() => removeColor(c)} />
                          </span>
                        );
                      })}
                      {availableColors.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No colors added yet</span>}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Initial Stock Quantity</label>
                  <input {...register('stockQuantity')} type="number" className="input-field" placeholder="0" />
                </div>
                <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Images</label>
                    <input {...register('images')} type="file" accept="image/*" multiple className="input-field" style={{ padding: '0.25rem' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', position: 'sticky', bottom: 0, backgroundColor: 'white', padding: '1rem 0' }}>
                <button type="button" onClick={closeModal} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'none' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 2 }}>{modalSubmitLabel}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
