import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import './storeOperations.css';

const formatCurrency = (value) => {
  const amount = Number(value);
  return Number.isNaN(amount)
    ? '-'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
};

const StoreOperations = () => {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [storeStock, setStoreStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [billingRecords, setBillingRecords] = useState([]);
  const [storeRevenue, setStoreRevenue] = useState([]);
  const [salespersonPerformance, setSalespersonPerformance] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [storeForm, setStoreForm] = useState({ name: '', contactName: '', contactPhone: '', address: '' });
  const [stockForm, setStockForm] = useState({ productId: '', quantity: 0, lowStockThreshold: 5 });
  const [transferForm, setTransferForm] = useState({ productId: '', fromStoreId: '', toStoreId: '', quantity: 1, unitPrice: '' });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  const selectedStore = useMemo(() => stores.find((store) => store.id === selectedStoreId) || null, [stores, selectedStoreId]);

  useEffect(() => {
    refreshEverything();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      fetchStoreStock(selectedStoreId);
    } else {
      setStoreStock([]);
    }
  }, [selectedStoreId]);

  useEffect(() => {
    if (products.length) {
      setStockForm((prev) => ({
        ...prev,
        productId: prev.productId || products[0]?.id || '',
      }));
      setTransferForm((prev) => ({
        ...prev,
        productId: prev.productId || products[0]?.id || '',
      }));
    }
  }, [products]);

  const refreshEverything = async () => {
    await Promise.all([fetchStores(), fetchBillingRecords(), fetchStoreRevenue(), fetchSalespersonPerformance(), fetchTransfers()]);
  };

  const fetchStores = async () => {
    try {
      const res = await api.get('/stores');
      if (res.success) {
        setStores(res.data || []);
        setSelectedStoreId((current) => current || res.data?.[0]?.id || '');
      }
    } catch (err) {
      console.error('Unable to load stores', err);
    }
  };

  const fetchStoreStock = async (storeId) => {
    try {
      const res = await api.get(`/store-stock/${storeId}/stock`);
      if (res.success) {
        setStoreStock(res.data || []);
      }
    } catch (err) {
      console.error('Unable to load store stock', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { limit: 100 } });
      if (res.success) {
        setProducts(res.data || []);
      }
    } catch (err) {
      console.error('Unable to load products', err);
    }
  };

  const fetchBillingRecords = async () => {
    try {
      const res = await api.get('/billing', { params: { limit: 6 } });
      if (res.success) {
        setBillingRecords(res.data || []);
      }
    } catch (err) {
      console.error('Unable to load billing history', err);
    }
  };

  const fetchStoreRevenue = async () => {
    try {
      const res = await api.get('/billing/store-revenue');
      if (res.success) {
        setStoreRevenue(res.data || []);
      }
    } catch (err) {
      console.error('Unable to load store revenue', err);
    }
  };

  const fetchSalespersonPerformance = async () => {
    try {
      const res = await api.get('/analytics/salespersons/performance');
      if (res.success) {
        setSalespersonPerformance(res.data || []);
      }
    } catch (err) {
      console.error('Unable to load salesperson stats', err);
    }
  };

  const fetchTransfers = async () => {
    try {
      const res = await api.get('/transfers', { params: { limit: 6 } });
      if (res.success) {
        setRecentTransfers(res.data || []);
      }
    } catch (err) {
      console.error('Unable to load transfers', err);
    }
  };

  const handleStoreFormChange = (field, value) => {
    setStoreForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateStore = async (event) => {
    event.preventDefault();
    setError('');
    if (!storeForm.name.trim()) {
      setError('Store name is required.');
      return;
    }
    try {
      await api.post('/stores', {
        name: storeForm.name.trim(),
        contactName: storeForm.contactName || undefined,
        contactPhone: storeForm.contactPhone || undefined,
        address: storeForm.address ? { raw: storeForm.address } : null,
        type: 'offline',
      });
      setStatus('Store registered successfully.');
      setStoreForm({ name: '', contactName: '', contactPhone: '', address: '' });
      await fetchStores();
    } catch (err) {
      setError(err?.message || 'Unable to register store.');
    }
  };

  const handleStoreStockSave = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');
    if (!selectedStoreId) {
      setError('Select a destination store before saving stock.');
      return;
    }
    if (!stockForm.productId) {
      setError('Select a product before saving stock.');
      return;
    }
    try {
      await api.post(`/store-stock/${selectedStoreId}/stock`, {
        productId: stockForm.productId,
        quantity: Number(stockForm.quantity) || 0,
        lowStockThreshold: Number(stockForm.lowStockThreshold) || 5,
      });
      setStatus('Store stock updated.');
      await fetchStoreStock(selectedStoreId);
    } catch (err) {
      setError(err?.message || 'Unable to update store stock.');
    }
  };

  const handleDeleteStock = async (productId) => {
    if (!selectedStoreId) return;
    setError('');
    setStatus('');
    try {
      await api.delete(`/store-stock/${selectedStoreId}/stock/${productId}`);
      setStatus('Stock entry removed.');
      await fetchStoreStock(selectedStoreId);
    } catch (err) {
      setError(err?.message || 'Unable to remove stock entry.');
    }
  };

  const handleTransferSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');
    if (!transferForm.productId || !transferForm.toStoreId || !transferForm.quantity) {
      setError('Product, destination store, and quantity are required for transfers.');
      return;
    }
    setIsSubmittingTransfer(true);
    try {
      await api.post('/transfers', {
        productId: transferForm.productId,
        fromStoreId: transferForm.fromStoreId || null,
        toStoreId: transferForm.toStoreId,
        quantity: Number(transferForm.quantity),
        unitPrice: transferForm.unitPrice ? Number(transferForm.unitPrice) : undefined,
      });
      setStatus('Inventory transfer recorded and invoice created.');
      setTransferForm((prev) => ({ ...prev, quantity: 1, unitPrice: '' }));
      await Promise.all([
        fetchStoreStock(selectedStoreId),
        fetchBillingRecords(),
        fetchStoreRevenue(),
        fetchSalespersonPerformance(),
        fetchTransfers(),
        fetchStores(),
      ]);
    } catch (err) {
      setError(err?.message || 'Unable to create transfer.');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  return (
    <div className="store-operations">
      <header className="store-operations__header">
        <div>
          <h1>Stores & Inventory Control</h1>
          <p>Manage offline stores, track stock, ship products via salespersons, and reconcile billing.</p>
        </div>
        {status && <p className="store-operations__notice success">{status}</p>}
        {error && <p className="store-operations__notice error">{error}</p>}
      </header>

      <section className="store-operations__section">
        <div className="section-heading">
          <h2>Registered Stores</h2>
          <p>Tap a store to make it the current context for stock adjustments and reports.</p>
        </div>
        <div className="store-operations__store-grid">
          {stores.map((store) => (
            <button
              key={store.id}
              type="button"
              className={`store-card ${selectedStoreId === store.id ? 'active' : ''}`}
              onClick={() => setSelectedStoreId(store.id)}
            >
              <div>
                <strong>{store.name}</strong>
                <p>{store.contactName || 'No manager specified'}</p>
              </div>
              <div className="store-card__meta">
                <span>{store.contactPhone || 'No phone'}</span>
                <small>
                  {store.type} · {store.status}
                </small>
              </div>
            </button>
          ))}
        </div>
        <form className="store-operations__form" onSubmit={handleCreateStore}>
          <div className="form-grid">
            <label>
              Store Name
              <input
                value={storeForm.name}
                onChange={(event) => handleStoreFormChange('name', event.target.value)}
                placeholder="Downtown Retail Shop"
              />
            </label>
            <label>
              Contact Name
              <input
                value={storeForm.contactName}
                onChange={(event) => handleStoreFormChange('contactName', event.target.value)}
                placeholder="Store Manager"
              />
            </label>
            <label>
              Contact Phone
              <input
                value={storeForm.contactPhone}
                onChange={(event) => handleStoreFormChange('contactPhone', event.target.value)}
                placeholder="+91 98765 43210"
              />
            </label>
            <label className="full-width">
              Address
              <textarea
                rows="2"
                value={storeForm.address}
                onChange={(event) => handleStoreFormChange('address', event.target.value)}
                placeholder="Street, City, State"
              />
            </label>
          </div>
          <button type="submit" className="primary">
            Register Store
          </button>
        </form>
      </section>

      <section className="store-operations__section">
        <div className="section-heading">
          <h2>Stock Management</h2>
          <p>Add, update, or remove per-store inventory entries.</p>
        </div>
        <div className="store-operations__section-grid">
          <article className="store-operations__summary">
            <h3>{selectedStore ? selectedStore.name : 'Select a store'}</h3>
            {selectedStore ? (
              <>
                <p>{selectedStore.contactPhone || 'Contact number not set'}</p>
                <small>
                  {selectedStore.type} · {selectedStore.status}
                </small>
              </>
            ) : (
              <p>Please choose a store card above before adjusting stock.</p>
            )}
          </article>
          <form className="store-operations__form" onSubmit={handleStoreStockSave}>
            <div className="form-grid">
              <label>
                Product
                <select value={stockForm.productId} onChange={(event) => setStockForm((prev) => ({ ...prev, productId: event.target.value }))}>
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  min="0"
                  value={stockForm.quantity}
                  onChange={(event) => setStockForm((prev) => ({ ...prev, quantity: event.target.value }))}
                />
              </label>
              <label>
                Low Stock Threshold
                <input
                  type="number"
                  min="1"
                  value={stockForm.lowStockThreshold}
                  onChange={(event) => setStockForm((prev) => ({ ...prev, lowStockThreshold: event.target.value }))}
                />
              </label>
            </div>
            <button type="submit" className="primary">
              Save Stock Entry
            </button>
          </form>
        </div>
        <div className="store-operations__table-wrapper">
          <table className="store-operations__stock-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Threshold</th>
                <th>Last Received</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {storeStock.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-state">
                    No stock records yet for this store.
                  </td>
                </tr>
              )}
              {storeStock.map((item) => (
                <tr key={`${item.productId}-${item.id}`}>
                  <td>{item.product?.name || 'Unnamed product'}</td>
                  <td>{item.quantity}</td>
                  <td>{item.lowStockThreshold}</td>
                  <td>{item.lastReceivedAt ? new Date(item.lastReceivedAt).toLocaleDateString() : 'Not recorded'}</td>
                  <td>
                    <button type="button" className="ghost" onClick={() => handleDeleteStock(item.productId)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="store-operations__section">
        <div className="section-heading">
          <h2>Transfer Workspace</h2>
          <p>Salespersons can move stock between stores and trigger billing entries automatically.</p>
        </div>
        <form className="store-operations__form" onSubmit={handleTransferSubmit}>
          <div className="form-grid">
            <label>
              Product
              <select value={transferForm.productId} onChange={(event) => setTransferForm((prev) => ({ ...prev, productId: event.target.value }))}>
                <option value="">Select Supply SKU</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Source Store (optional)
              <select value={transferForm.fromStoreId} onChange={(event) => setTransferForm((prev) => ({ ...prev, fromStoreId: event.target.value }))}>
                <option value="">Central Warehouse / HQ</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Destination Store
              <select
                value={transferForm.toStoreId}
                onChange={(event) => setTransferForm((prev) => ({ ...prev, toStoreId: event.target.value }))}
              >
                <option value="">Select a store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantity
              <input
                type="number"
                min="1"
                value={transferForm.quantity}
                onChange={(event) => setTransferForm((prev) => ({ ...prev, quantity: event.target.value }))}
              />
            </label>
            <label>
              Unit Price (optional)
              <input
                type="number"
                min="0"
                step="0.01"
                value={transferForm.unitPrice}
                onChange={(event) => setTransferForm((prev) => ({ ...prev, unitPrice: event.target.value }))}
              />
            </label>
          </div>
          <button type="submit" className="primary" disabled={isSubmittingTransfer}>
            {isSubmittingTransfer ? 'Recording transfer…' : 'Record Transfer & Invoice'}
          </button>
        </form>

        <div className="store-operations__transfers">
          <h3>Recent Transfers</h3>
          <div className="transfer-list">
            {recentTransfers.map((item) => (
              <article key={item.id} className="transfer-card">
                <p className="transfer-card__product">{item.product?.name || 'Product'}</p>
                <p>
                  {item.sourceStore?.name || 'Central'} → {item.destinationStore?.name || 'Store'}
                </p>
                <small>
                  {item.quantity} units · {item.status} · {formatCurrency(item.totalAmount)}
                </small>
              </article>
            ))}
            {!recentTransfers.length && <p className="empty-state">No transfers logged yet.</p>}
          </div>
        </div>
      </section>

      <section className="store-operations__section">
        <div className="section-heading">
          <h2>Billing & Revenue</h2>
          <p>Invoices generated when stock is moved, plus revenue per store.</p>
        </div>
        <div className="store-operations__billing">
          <div className="billing-grid">
            {billingRecords.map((record) => (
              <article key={record.id} className="billing-card">
                <div className="billing-card__header">
                  <strong>{record.invoiceNumber}</strong>
                  <span className={`status ${record.paymentStatus}`}>{record.paymentStatus}</span>
                </div>
                <p>Store: {record.store?.name || 'Unknown'}</p>
                <p>Amount: {formatCurrency(record.amount)}</p>
                <small>Due: {record.dueDate ? new Date(record.dueDate).toLocaleDateString() : 'Immediate'}</small>
              </article>
            ))}
            {!billingRecords.length && <p className="empty-state">No billing records yet.</p>}
          </div>
          <div className="billing-metrics">
            <h3>Revenue by Store</h3>
            <ul>
              {storeRevenue.map((row) => (
                <li key={row.store_id}>
                  <div>
                    <strong>{row.store?.name || 'Unknown store'}</strong>
                    <p>{row.invoiceCount} invoices</p>
                  </div>
                  <span>{formatCurrency(row.totalRevenue)}</span>
                </li>
              ))}
              {!storeRevenue.length && <li>No revenue data yet.</li>}
            </ul>
          </div>
        </div>
      </section>

      <section className="store-operations__section">
        <div className="section-heading">
          <h2>Salesperson Analytics</h2>
          <p>Track which sales team members are moving stock and generating revenue.</p>
        </div>
        <ul className="salesperson-list">
          {salespersonPerformance.map((entry) => (
            <li key={entry.sales_person_id}>
              <div>
                <strong>{entry.salesPerson?.name || 'Unassigned salesperson'}</strong>
                <p>{entry.salesPerson?.email || 'No email available'}</p>
              </div>
              <span>
                {entry.totalUnits} units · {formatCurrency(entry.totalAmount)}
              </span>
            </li>
          ))}
          {!salespersonPerformance.length && <li>No salesperson activity yet.</li>}
        </ul>
      </section>
    </div>
  );
};

export default StoreOperations;
