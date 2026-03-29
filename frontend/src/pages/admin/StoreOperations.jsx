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
  const [alerts, setAlerts] = useState({ lowStock: [], invoices: [], deliveryProof: [] });
  const [invoiceTemplate, setInvoiceTemplate] = useState({ name: '', body: '' });
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [commissionRange, setCommissionRange] = useState({ startDate: '', endDate: '' });
  const [pricingRules, setPricingRules] = useState([]);
  const [pricingForm, setPricingForm] = useState({
    productId: '',
    minQuantity: 1,
    price: '',
    label: ''
  });
  const [pickupRequests, setPickupRequests] = useState([]);
  const [manualBillingForm, setManualBillingForm] = useState({
    storeId: '',
    amount: '',
    paymentStatus: 'pending',
    paymentMethod: 'cash',
    dueDate: '',
    notes: ''
  });
  const baseApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const selectedStore = useMemo(() => stores.find((store) => store.id === selectedStoreId) || null, [stores, selectedStoreId]);

  useEffect(() => {
    refreshEverything();
    fetchProducts();
    fetchAlerts();
    fetchInvoiceTemplate();
    fetchPricingRules();
    fetchPickupRequests();
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
    await Promise.all([
      fetchStores(),
      fetchBillingRecords(),
      fetchStoreRevenue(),
      fetchSalespersonPerformance(),
      fetchTransfers(),
      fetchAlerts(),
      fetchPickupRequests()
    ]);
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

  const fetchPricingRules = async () => {
    try {
      const res = await api.get('/pricing');
      if (res.success) {
        setPricingRules(res.data || []);
      }
    } catch (err) {
      console.error('Unable to load pricing rules', err);
    }
  };

  const fetchPickupRequests = async () => {
    try {
      const res = await api.get('/pickups');
      if (res.success) {
        setPickupRequests(res.data || []);
      }
    } catch (err) {
      console.error('Unable to load pickup requests', err);
    }
  };

  const handlePickupStatus = async (id, status) => {
    try {
      await api.patch(`/pickups/${id}/status`, { status });
      fetchPickupRequests();
    } catch (err) {
      console.error('Unable to update pickup status', err);
    }
  };

  const handlePricingChange = (field, value) => {
    setPricingForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePricingSubmit = async (event) => {
    event.preventDefault();
    if (!pricingForm.productId || !pricingForm.price) {
      setError('Select a product and provide a price.');
      return;
    }
    try {
      await api.post('/pricing', {
        productId: pricingForm.productId,
        minQuantity: Number(pricingForm.minQuantity),
        price: Number(pricingForm.price),
        label: pricingForm.label
      });
      setPricingForm({ productId: '', minQuantity: 1, price: '', label: '' });
      setStatus('Pricing rule saved.');
      fetchPricingRules();
    } catch (err) {
      setError('Unable to save pricing rule.');
    }
  };

  const handleCommissionExport = () => {
    const params = [
      commissionRange.startDate ? `startDate=${commissionRange.startDate}` : '',
      commissionRange.endDate ? `endDate=${commissionRange.endDate}` : ''
    ].filter(Boolean).join('&');
    window.open(`${baseApiUrl}/commissions/export${params ? `?${params}` : ''}`, '_blank');
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

  const fetchAlerts = async () => {
    try {
      const [lowStockRes, invoicesRes, deliveryRes] = await Promise.all([
        api.get('/alerts/low-stock'),
        api.get('/alerts/invoices'),
        api.get('/alerts/delivery-proof')
      ]);
      setAlerts({
        lowStock: lowStockRes.success ? lowStockRes.data || [] : [],
        invoices: invoicesRes.success ? invoicesRes.data || [] : [],
        deliveryProof: deliveryRes.success ? deliveryRes.data || [] : []
      });
    } catch (err) {
      console.error('Unable to load alerts', err);
    }
  };

  const fetchInvoiceTemplate = async () => {
    try {
      const res = await api.get('/invoice-template/template');
      if (res.success) {
        setInvoiceTemplate(res.data || { name: '', body: '' });
      }
    } catch (err) {
      console.error('Unable to load invoice template', err);
    }
  };

  const handleTemplateChange = (field, value) => {
    setInvoiceTemplate((prev) => ({ ...prev, [field]: value }));
  };

  const handleTemplateSave = async () => {
    setIsSavingTemplate(true);
    try {
      await api.put('/invoice-template/template', {
        name: invoiceTemplate.name,
        body: invoiceTemplate.body
      });
      setStatus('Invoice template saved.');
    } catch (err) {
      setError(err?.message || 'Unable to save template.');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleManualBillingChange = (field, value) => {
    setManualBillingForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleManualBillingSubmit = async (event) => {
    event.preventDefault();
    if (!manualBillingForm.storeId) {
      setError('Please pick a store for this billing.');
      return;
    }
    if (!manualBillingForm.amount || Number(manualBillingForm.amount) <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    setError('');
    setStatus('');
    try {
      await api.post('/billing/manual', {
        storeId: manualBillingForm.storeId,
        amount: Number(manualBillingForm.amount),
        paymentStatus: manualBillingForm.paymentStatus,
        paymentMethod: manualBillingForm.paymentMethod,
        dueDate: manualBillingForm.dueDate || undefined,
        notes: manualBillingForm.notes || undefined
      });
      setStatus('Manual billing entry recorded.');
      setManualBillingForm({
        storeId: '',
        amount: '',
        paymentStatus: 'pending',
        paymentMethod: 'cash',
        dueDate: '',
        notes: ''
      });
      await Promise.all([fetchBillingRecords(), fetchStoreRevenue(), fetchAlerts(), fetchPickupRequests()]);
    } catch (err) {
      setError(err?.message || 'Unable to record billing.');
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

  const downloadInvoice = (record) => {
    window.open(`${baseApiUrl}/billing/invoice/${record.id}`, '_blank');
  };

  const downloadBillingCsv = () => {
    window.open(`${baseApiUrl}/billing/export?status=pending`, '_blank');
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
            fetchPickupRequests(),
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

      <section className="store-operations__section store-operations__alerts">
        <div className="section-heading">
          <h2>Alerts & Exports</h2>
          <p>Quick view of low-stock products and overdue invoices.</p>
        </div>
        <div className="alerts-grid">
          <div className="alert-card">
            <div className="alert-card__header">
              <h3>Low Stock</h3>
              <span>{alerts.lowStock.length} items</span>
            </div>
            <ul>
              {alerts.lowStock.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <strong>{item.product?.name || 'Product'}</strong>
                  <span>{item.quantity} units · {item.store?.name || 'Store'}</span>
                </li>
              ))}
              {!alerts.lowStock.length && <li>Nothing to worry about right now.</li>}
            </ul>
          </div>
          <div className="alert-card">
            <div className="alert-card__header">
              <h3>Overdue Invoices</h3>
              <span>{alerts.invoices.length} pending</span>
            </div>
            <ul>
              {alerts.invoices.slice(0, 4).map((record) => (
                <li key={record.id}>
                  <strong>{record.invoiceNumber || record.id}</strong>
                  <span>{record.store?.name || 'Store'} · Due {record.dueDate ? new Date(record.dueDate).toLocaleDateString() : 'Immediate'}</span>
                </li>
              ))}
              {!alerts.invoices.length && <li>All invoices are settled.</li>}
            </ul>
          </div>
          <div className="alert-card">
            <div className="alert-card__header">
              <h3>Delivery Proof Missing</h3>
              <span>{alerts.deliveryProof.length} transfers</span>
            </div>
            <ul>
              {alerts.deliveryProof.slice(0, 4).map((log) => (
                <li key={log.id}>
                  <strong>{log.transfer?.product?.name || 'Product'}</strong>
                  <span>{log.transfer?.destinationStore?.name || 'Store'}</span>
                  <small style={{ color: '#f97316' }}>Created {new Date(log.createdAt).toLocaleString()}</small>
                </li>
              ))}
              {!alerts.deliveryProof.length && <li>All deliveries have proof.</li>}
            </ul>
          </div>
          <div className="alert-card alert-card--export">
            <h3>Billing Export</h3>
            <p>Download the latest billing statements (pending invoices by default).</p>
            <button onClick={downloadBillingCsv} className="primary">Export CSV</button>
          </div>
        </div>
      </section>

      <section className="store-operations__section store-operations__commissions">
        <div className="section-heading">
          <h2>Commission Reports</h2>
          <p>Export commission summaries for finance.</p>
        </div>
        <div className="commissions">
          <label>
            Start Date
            <input type="date" value={commissionRange.startDate} onChange={(event) => setCommissionRange((prev) => ({ ...prev, startDate: event.target.value }))} />
          </label>
          <label>
            End Date
            <input type="date" value={commissionRange.endDate} onChange={(event) => setCommissionRange((prev) => ({ ...prev, endDate: event.target.value }))} />
          </label>
          <button className="primary" onClick={handleCommissionExport}>Download CSV</button>
        </div>
      </section>

      <section className="store-operations__section">
        <div className="section-heading">
          <h2>Manual Billing Entry</h2>
          <p>Create ad-hoc invoices (cash, UPI, bank transfers) for offline stores.</p>
        </div>
        <form className="store-operations__form" onSubmit={handleManualBillingSubmit}>
          <div className="form-grid">
            <label>
              Store
              <select value={manualBillingForm.storeId} onChange={(e) => handleManualBillingChange('storeId', e.target.value)}>
                <option value="">Select a store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={manualBillingForm.amount}
                onChange={(e) => handleManualBillingChange('amount', e.target.value)}
              />
            </label>
            <label>
              Payment Status
              <select
                value={manualBillingForm.paymentStatus}
                onChange={(e) => handleManualBillingChange('paymentStatus', e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </label>
            <label>
              Payment Method
              <select
                value={manualBillingForm.paymentMethod}
                onChange={(e) => handleManualBillingChange('paymentMethod', e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank</option>
                <option value="credit">Credit</option>
              </select>
            </label>
            <label>
              Due Date
              <input
                type="date"
                value={manualBillingForm.dueDate}
                onChange={(e) => handleManualBillingChange('dueDate', e.target.value)}
              />
            </label>
            <label className="full-width">
              Notes
              <textarea
                rows="2"
                value={manualBillingForm.notes}
                onChange={(e) => handleManualBillingChange('notes', e.target.value)}
                placeholder="Optional context for the offline sale"
              />
            </label>
          </div>
          <button type="submit" className="primary">Create Billing Record</button>
        </form>
      </section>

      <section className="store-operations__section">
        <div className="section-heading">
          <h2>Invoice Template</h2>
          <p>Configure the invoice content your customers receive.</p>
        </div>
        <div className="store-operations__template">
          <label>
            Template Name
            <input
              value={invoiceTemplate.name}
              onChange={(event) => handleTemplateChange('name', event.target.value)}
            />
          </label>
          <label className="full-width">
            Template Body
            <textarea
              rows="6"
              value={invoiceTemplate.body}
              onChange={(event) => handleTemplateChange('body', event.target.value)}
              placeholder="Use placeholders like {{invoiceNumber}}, {{orderId}}, {{customerName}}, {{totalAmount}}, {{itemsList}}"
            />
          </label>
          <button type="button" className="primary" onClick={handleTemplateSave} disabled={isSavingTemplate}>
            {isSavingTemplate ? 'Saving template…' : 'Save Template'}
          </button>
        </div>
      </section>

      <section className="store-operations__section store-operations__pricing">
        <div className="section-heading">
          <h2>Tiered Pricing</h2>
          <p>Define price breaks per product for offline customers.</p>
        </div>
        <form className="store-operations__form" onSubmit={handlePricingSubmit}>
          <div className="form-grid">
            <label>
              Product
              <select value={pricingForm.productId} onChange={(event) => handlePricingChange('productId', event.target.value)}>
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </label>
            <label>
              Min Quantity
              <input type="number" min="1" value={pricingForm.minQuantity} onChange={(event) => handlePricingChange('minQuantity', event.target.value)} />
            </label>
            <label>
              Price
              <input type="number" min="0" step="0.01" value={pricingForm.price} onChange={(event) => handlePricingChange('price', event.target.value)} />
            </label>
            <label className="full-width">
              Label
              <input placeholder="e.g. Bulk 10+" value={pricingForm.label} onChange={(event) => handlePricingChange('label', event.target.value)} />
            </label>
          </div>
          <button type="submit" className="primary">Save Pricing Rule</button>
        </form>
        <div className="pricing-list">
          {pricingRules.map((rule) => (
            <div key={rule.id} className="pricing-item">
              <strong>{rule.label || 'Tiered Pricing'}:</strong> {rule.minQuantity}+ units @ ₹{rule.price}
            </div>
          ))}
          {!pricingRules.length && <p>No pricing tiers defined yet.</p>}
        </div>
      </section>

      <section className="store-operations__section store-operations__pickups">
        <div className="section-heading">
          <h2>Pickup Requests</h2>
          <p>Monitor customer pickup reservations per store.</p>
        </div>
        <div className="pickup-table">
          <div className="pickup-row pickup-row--header">
            <span>Store</span>
            <span>Product</span>
            <span>Qty</span>
            <span>Scheduled</span>
            <span>Status</span>
            <span />
          </div>
          {pickupRequests.map((request) => (
            <div key={request.id} className="pickup-row">
              <span>{request.store?.name || 'Store'}</span>
              <span>{request.product?.name || 'Product'}</span>
              <span>{request.quantity}</span>
              <span>{new Date(request.scheduledFor).toLocaleDateString()}</span>
              <span>{request.status}</span>
              <div>
                {request.status !== 'picked' && (
                  <button onClick={() => handlePickupStatus(request.id, 'picked')} className="ghost">Mark Picked</button>
                )}
              </div>
            </div>
          ))}
          {!pickupRequests.length && (
            <p style={{ padding: '1rem', color: '#475569' }}>No pickup requests yet.</p>
          )}
        </div>
      </section>

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
                <button className="billing-card__download" type="button" onClick={() => downloadInvoice(record)}>
                  Download Invoice
                </button>
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
