import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Package, Store, Users, ShoppingCart, AlertTriangle, ArrowUpCircle, Download } from 'lucide-react';
import api from '../../api/client';

const BASE_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const METRIC_ICONS = { productCount: Package, storeCount: Store, userCount: Users, ordersThisMonth: ShoppingCart };
const METRIC_COLORS = { productCount: '#4f46e5', storeCount: '#0891b2', userCount: '#059669', ordersThisMonth: '#d97706' };

export default function UsageDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [savingDomain, setSavingDomain] = useState(false);
  const [inventoryAlerts, setInventoryAlerts] = useState({ lowStock: [], delayedTransfers: [] });
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [delayHours, setDelayHours] = useState(36);
  const [commissionDownloading, setCommissionDownloading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/saas/usage')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load usage data.'))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const slug = localStorage.getItem('tenantSlug') || 'demo';
      const res = await fetch(`${BASE_API_URL}/saas/export`, {
        headers: { Authorization: `Bearer ${token}`, 'X-Tenant-Slug': slug },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully.');
    } catch (err) {
      if (err.message?.includes('PLAN_UPGRADE_REQUIRED')) {
        toast.error('Data export requires a Starter plan or higher.');
        navigate('/admin/billing');
      } else {
        toast.error(err.message || 'Export failed.');
      }
    } finally {
      setExporting(false);
    }
  };

  const fetchInventoryAlerts = async () => {
    setInventoryLoading(true);
    try {
      const res = await api.get('/analytics/inventory/alerts', { params: { delayHours } });
      if (res.success) {
        setInventoryAlerts(res.data || { lowStock: [], delayedTransfers: [] });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load inventory alerts.');
    } finally {
      setInventoryLoading(false);
    }
  };

  const downloadCommissionCsv = async () => {
    setCommissionDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const slug = localStorage.getItem('tenantSlug') || 'demo';
      const response = await fetch(`${BASE_API_URL}/analytics/commissions/export`, {
        headers: { Authorization: `Bearer ${token}`, 'X-Tenant-Slug': slug }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to download commission report.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `commissions-${Date.now()}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success('Commission report downloaded.');
    } catch (err) {
      toast.error(err.message || 'Failed to download commission report.');
    } finally {
      setCommissionDownloading(false);
    }
  };

  useEffect(() => {
    fetchInventoryAlerts();
  }, [delayHours]);

  const handleSaveDomain = async () => {
    setSavingDomain(true);
    try {
      await api.put('/saas/custom-domain', { customDomain });
      toast.success(customDomain ? `Custom domain set to ${customDomain}` : 'Custom domain removed.');
    } catch (err) {
      if (err.code === 'PLAN_UPGRADE_REQUIRED') {
        toast.error('Custom domains require the Growth plan or higher.');
        navigate('/admin/billing');
      } else {
        toast.error(err.message || 'Failed to save domain.');
      }
    } finally {
      setSavingDomain(false);
    }
  };

  const s = {
    page: { padding: '2rem' },
    heading: { fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 },
    card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 },
    sectionTitle: { fontSize: '1rem', fontWeight: 700, marginBottom: 16 },
    progressBar: (pct, color) => ({
      height: 8, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden',
      position: 'relative', marginTop: 8,
    }),
    progressFill: (pct, color) => ({
      height: '100%', width: `${Math.min(pct, 100)}%`,
      background: pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : color,
      borderRadius: 4, transition: 'width 0.5s',
    }),
    input: { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' },
    btn: { padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
    btnPrimary: { background: '#4f46e5', color: '#fff' },
  };

  if (loading) return <div style={s.page}>Loading usage data...</div>;
  if (!data) return <div style={s.page}>Failed to load usage data.</div>;

  const { plan, usage } = data;

  return (
    <div style={s.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={s.heading}>Usage & Settings</h1>
          <p style={{ color: '#666' }}>Current plan: <strong style={{ color: '#4f46e5' }}>{plan.name}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{ ...s.btn, background: '#f3f4f6', color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} /> {exporting ? 'Exporting...' : 'Export Data'}
          </button>
          <button onClick={() => navigate('/admin/billing')} style={{ ...s.btn, ...s.btnPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowUpCircle size={14} /> Upgrade Plan
          </button>
        </div>
      </div>

      {/* Usage metrics */}
      <h2 style={s.sectionTitle}>Resource Usage</h2>
      <div style={s.grid}>
        {usage.map(metric => {
          const Icon = METRIC_ICONS[metric.key] || Package;
          const color = METRIC_COLORS[metric.key] || '#4f46e5';
          const isNearLimit = metric.percent >= 80;
          const isAtLimit = metric.percent >= 100;

          return (
            <div key={metric.key} style={{ ...s.card, borderColor: isAtLimit ? '#fca5a5' : isNearLimit ? '#fcd34d' : '#e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={color} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{metric.label}</span>
                </div>
                {(isAtLimit || isNearLimit) && (
                  <AlertTriangle size={16} color={isAtLimit ? '#ef4444' : '#f59e0b'} />
                )}
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111', marginBottom: 4 }}>
                {metric.value.toLocaleString()}
                {metric.limit && <span style={{ fontSize: 13, fontWeight: 400, color: '#888' }}>/{metric.limit.toLocaleString()}</span>}
                {!metric.limit && <span style={{ fontSize: 13, fontWeight: 400, color: '#22c55e' }}> / Unlimited</span>}
              </div>
              {metric.limit && (
                <>
                  <div style={s.progressBar(metric.percent, color)}>
                    <div style={s.progressFill(metric.percent, color)} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: '#888' }}>{metric.percent}% used</span>
                    {isAtLimit && (
                      <button onClick={() => navigate('/admin/billing')} style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        Upgrade to add more
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom Domain */}
      <div style={{ ...s.card, marginBottom: 20 }}>
        <h2 style={s.sectionTitle}>Custom Domain</h2>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
          Connect your own domain (e.g., <code>shop.mybrand.com</code>). Requires Growth plan or higher.
          After setting, point a CNAME DNS record to <strong>yoursaas.com</strong>.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={customDomain}
            onChange={e => setCustomDomain(e.target.value)}
            placeholder="shop.yourbrand.com"
            style={{ ...s.input, flex: 1 }}
          />
          <button onClick={handleSaveDomain} disabled={savingDomain} style={{ ...s.btn, ...s.btnPrimary, whiteSpace: 'nowrap' }}>
            {savingDomain ? 'Saving...' : 'Save Domain'}
          </button>
        </div>
      </div>

      {/* Data export info */}
      <div style={s.card}>
        <h2 style={s.sectionTitle}>Data Portability (GDPR)</h2>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
          Export all your store data — products, orders, users, and stores — as a JSON file. Available on Starter plan and above.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{ ...s.btn, background: '#f3f4f6', color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Download size={14} /> {exporting ? 'Preparing export...' : 'Download All Data'}
        </button>
      </div>

      {/* Inventory & Commission insights */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={s.sectionTitle}>Inventory & Commission insights</h2>
            <p style={{ fontSize: 13, color: '#666' }}>Spot low-stock SKUs, delayed transfers, and download payout-ready commission exports.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, color: '#555' }}>Delay window (hrs)</label>
            <input
              type="number"
              min={1}
              value={delayHours}
              onChange={(e) => setDelayHours(Number(e.target.value) || 1)}
              className="input-field"
              style={{ width: '80px', padding: '0.35rem 0.5rem' }}
            />
            <button onClick={fetchInventoryAlerts} className="btn-secondary">
              Refresh alerts
            </button>
          </div>
        </div>

        {inventoryLoading ? (
          <p>Loading inventory alerts...</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Low stock</h3>
              {inventoryAlerts?.lowStock?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {inventoryAlerts.lowStock.slice(0, 5).map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                      <div>
                        <strong>{item.productName}</strong>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>SKU: {item.sku || '-'}</div>
                      </div>
                      <span style={{ fontWeight: 600, color: item.delta < 0 ? '#dc2626' : '#15803d' }}>
                        {item.quantity}/{item.threshold}
                      </span>
                    </div>
                  ))}
                  {inventoryAlerts.lowStock.length > 5 && <small style={{ color: '#6b7280' }}>Showing top 5 low-stock SKUs</small>}
                </div>
              ) : (
                <p style={{ margin: 0, color: '#15803d' }}>No critical low stock alerts.</p>
              )}
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Delayed transfers</h3>
              {inventoryAlerts?.delayedTransfers?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {inventoryAlerts.delayedTransfers.slice(0, 5).map((transfer) => (
                    <div key={transfer.id} style={{ border: '1px dashed #e5e7eb', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569' }}>
                        <span>{transfer.toStore}</span>
                        <span>{transfer.daysPending} days pending</span>
                      </div>
                      <div style={{ marginTop: '0.35rem', fontWeight: 600 }}>{transfer.productName}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Qty: {transfer.quantity} - {transfer.status.replace('_', ' ')}</div>
                      <div style={{ fontSize: 13, color: '#10b981' }}>{transfer.formattedAmount}</div>
                    </div>
                  ))}
                  {inventoryAlerts.delayedTransfers.length > 5 && <small style={{ color: '#6b7280' }}>Showing the first 5 delayed transfers.</small>}
                </div>
              ) : (
                <p style={{ margin: 0, color: '#15803d' }}>All transfers are moving on schedule.</p>
              )}
            </div>
            <button
              onClick={downloadCommissionCsv}
              disabled={commissionDownloading}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}
            >
              <Download size={16} /> {commissionDownloading ? 'Generating commission report...' : 'Download commission CSV'}
            </button>
          </div>
        )}
      </div>


    </div>
  );
}
