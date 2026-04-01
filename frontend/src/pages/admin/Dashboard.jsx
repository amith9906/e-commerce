import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { useBrand } from '../../context/BrandContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, Users, ShoppingBag, DollarSign, Gift, Sparkles, Mail, AlertTriangle, Clock } from 'lucide-react';
import { getProductCover } from '../../utils/productImage';
import { formatCurrency } from '../../utils/formatCurrency';
import { scheduleIdleCallback } from '../../utils/idle';

export default function Dashboard() {
  const { storeName, currency: brandCurrency = 'INR' } = useBrand();
  const [tenantCurrency, setTenantCurrency] = useState(brandCurrency);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const formatTenantCurrency = (value) => formatCurrency(Number(value), tenantCurrency);
  const formatTooltipRevenue = (value, payload) =>
    payload?.payload?.formattedRevenue || formatTenantCurrency(value);
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, activeUsers: 0, totalProducts: 0 });
  const [salesData, setSalesData] = useState([]);
  const [stateSales, setStateSales] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loyaltySummary, setLoyaltySummary] = useState(null);
  const [giftCardSummary, setGiftCardSummary] = useState(null);
  const [recoverySummary, setRecoverySummary] = useState(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [inventoryAlerts, setInventoryAlerts] = useState(null);

  const formatNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toLocaleString() : '—';
  };
  

  const fetchDashboard = useCallback(() => {
    setLoading(true);
    const params = {};
    if (dateFilter.startDate) params.startDate = dateFilter.startDate;
    if (dateFilter.endDate) params.endDate = dateFilter.endDate;
    Promise.all([
      api.get('/analytics/sales', { params }),
      api.get('/analytics/stats', { params }),
      api.get('/analytics/views', { params }),
      api.get('/analytics/sales/state', { params }),
      api.get('/analytics/products/topselling', { params })
    ]).then(([salesRes, statsRes, viewsRes, stateRes, topSellingRes]) => {
      let revenue = 0;
      let orders = 0;
      if (salesRes.success) {
        const orderedData = (salesRes.data || []).slice().reverse();
        setSalesData(orderedData);
        revenue = salesRes.data.reduce((acc, curr) => acc + Number(curr.totalRevenue), 0);
        orders = salesRes.data.reduce((acc, curr) => acc + Number(curr.totalOrders), 0);
        const currencyFromServer = salesRes.data?.[0]?.currency;
        if (currencyFromServer) {
          setTenantCurrency(currencyFromServer);
        }
      }

      let activeUsers = 0, totalProducts = 0;
      if (statsRes.success) {
        activeUsers = statsRes.data.activeUsers;
        totalProducts = statsRes.data.totalProducts;
      }

      setStats({ totalOrders: orders, totalRevenue: revenue, activeUsers, totalProducts });

      if (viewsRes.success) {
        setTopProducts(viewsRes.data);
      }

      if (stateRes.success) {
        setStateSales(stateRes.data);
      }

      if (topSellingRes.success) {
        setTopSelling(topSellingRes.data);
      }
    }).catch(err => {
      console.error(err);
      toast.error('Unable to load dashboard metrics right now.');
    })
      .finally(() => setLoading(false));
  }, [dateFilter]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const loadLoyaltySummary = useCallback(async () => {
    try {
      const res = await api.get('/loyalty/admin/summary');
      if (res.success) setLoyaltySummary(res.data);
    } catch (err) {
      console.error('Failed to load loyalty summary', err);
    }
  }, []);

  const loadGiftCardSummary = useCallback(async () => {
    try {
      const res = await api.get('/gift-cards/summary');
      if (res.success) setGiftCardSummary(res.data);
    } catch (err) {
      console.error('Failed to load gift card summary', err);
    }
  }, []);

  const loadInventoryAlerts = useCallback(async () => {
    try {
      const res = await api.get('/analytics/inventory/alerts');
      if (res.success) setInventoryAlerts(res.data);
    } catch (err) {
      console.error('Failed to load inventory alerts', err);
    }
  }, []);

  const fetchRecoverySummary = useCallback(async () => {
    try {
      const res = await api.get('/cart/recoveries/summary');
      if (res.success) setRecoverySummary(res.data);
    } catch (err) {
      console.error('Failed to load cart recovery summary', err);
      setRecoverySummary(null);
      toast.error('Unable to fetch cart recovery summary at the moment.');
    }
  }, []);

  const triggerCartRecovery = useCallback(async () => {
    setRecoveryLoading(true);
    try {
      const res = await api.post('/cart/recoveries/trigger');
      if (res.success) {
        toast.success('Cart recovery job triggered');
        setRecoverySummary(res.data?.overview || null);
        await fetchRecoverySummary();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to trigger cart recovery');
    } finally {
      setRecoveryLoading(false);
    }
  }, [fetchRecoverySummary]);

  useEffect(() => {
    const cancelIdle = scheduleIdleCallback(() => {
      loadLoyaltySummary();
      loadGiftCardSummary();
      fetchRecoverySummary();
      loadInventoryAlerts();
    }, { timeout: 1000 });
    return cancelIdle;
  }, [loadLoyaltySummary, loadGiftCardSummary, fetchRecoverySummary, loadInventoryAlerts]);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: `${color}20`, color }}>
        <Icon size={24} />
      </div>
      <div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{title}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{value}</div>
      </div>
    </div>
  );

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>
        {storeName} Overview
      </h1>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ flex: '1 1 220px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Start Date</label>
          <input
            type="date"
            value={dateFilter.startDate}
            onChange={(event) => setDateFilter((prev) => ({ ...prev, startDate: event.target.value }))}
            className="input-field"
          />
        </div>
        <div style={{ flex: '1 1 220px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>End Date</label>
          <input
            type="date"
            value={dateFilter.endDate}
            onChange={(event) => setDateFilter((prev) => ({ ...prev, endDate: event.target.value }))}
            className="input-field"
          />
        </div>
        <button
          type="button"
          onClick={() => setDateFilter({ startDate: '', endDate: '' })}
          className="btn-secondary"
          style={{ height: '40px', alignSelf: 'flex-end' }}
        >
          Clear
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard title="Total Revenue (30d)" value={formatTenantCurrency(stats.totalRevenue)} icon={DollarSign} color="#10b981" />
        <StatCard title="Orders (30d)" value={stats.totalOrders} icon={ShoppingBag} color="#3b82f6" />
        <StatCard title="Active Users" value={stats.activeUsers} icon={Users} color="#8b5cf6" />
        <StatCard title="Total Products" value={stats.totalProducts} icon={Package} color="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem', minHeight: '170px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Sparkles size={22} color="#f97316" />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Loyalty points</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 600 }}>{loyaltySummary ? formatNumber(loyaltySummary.outstanding) : '—'}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Earned: {loyaltySummary ? formatNumber(loyaltySummary.earned) : '—'}</span>
            <span>Redeemed: {loyaltySummary ? formatNumber(loyaltySummary.redeemed) : '—'}</span>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', minHeight: '170px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Gift size={22} color="#6366f1" />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Gift cards</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 600 }}>{giftCardSummary ? formatNumber(giftCardSummary.activeCount) : '—'} active</div>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div>Remaining balance: {giftCardSummary ? formatTenantCurrency(Number(giftCardSummary.totalBalance || 0)) : '—'}</div>
            <div>Total redeemed: {giftCardSummary ? formatTenantCurrency(Number(giftCardSummary.totalRedeemed || 0)) : '—'}</div>
            <div>Total issued: {giftCardSummary ? formatNumber(giftCardSummary.totalCount) : '—'}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', minHeight: '170px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Mail size={22} color="#10b981" />
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Cart recovery</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{recoverySummary ? formatNumber(recoverySummary.counts.sent) : '—'} pending</div>
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Claimed: {recoverySummary ? formatNumber(recoverySummary.counts.claimed) : '—'}</span>
              <span>Expired: {recoverySummary ? formatNumber(recoverySummary.counts.expired) : '—'}</span>
            </div>
            {recoverySummary?.pending?.length > 0 && (
              <div style={{ marginTop: '0.75rem', maxHeight: '70px', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Recent pending users</div>
                <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1rem', fontSize: '0.8rem', color: '#374151' }}>
                  {recoverySummary.pending.slice(0, 3).map((entry) => (
                    <li key={entry.id}>
                      {entry.userName || entry.userEmail} • {new Date(entry.expiresAt).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={triggerCartRecovery}
            className="btn-primary"
            style={{ marginTop: '0.75rem', alignSelf: 'flex-start' }}
            disabled={recoveryLoading}
          >
            {recoveryLoading ? 'Triggering...' : 'Rerun recovery job'}
          </button>
        </div>
      </div>

      {/* Inventory Alerts */}
      {inventoryAlerts && (inventoryAlerts.lowStock?.length > 0 || inventoryAlerts.delayedTransfers?.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {inventoryAlerts.lowStock?.length > 0 && (
            <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                <AlertTriangle size={17} color="#ef4444" />
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#ef4444' }}>
                  Low Stock ({inventoryAlerts.lowStock.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: 200, overflowY: 'auto' }}>
                {inventoryAlerts.lowStock.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                    <div>
                      <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{item.productName}</span>
                      {item.sku && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>#{item.sku}</span>}
                    </div>
                    <span style={{ fontWeight: 700, color: item.quantity === 0 ? '#ef4444' : '#f59e0b', whiteSpace: 'nowrap', marginLeft: 12 }}>
                      {item.quantity} / {item.threshold}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inventoryAlerts.delayedTransfers?.length > 0 && (
            <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                <Clock size={17} color="#f59e0b" />
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#f59e0b' }}>
                  Delayed Transfers ({inventoryAlerts.delayedTransfers.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: 200, overflowY: 'auto' }}>
                {inventoryAlerts.delayedTransfers.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                    <div>
                      <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{t.productName}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>→ {t.toStore}</span>
                    </div>
                    <span style={{ color: '#f59e0b', whiteSpace: 'nowrap', marginLeft: 12, fontWeight: 600 }}>
                      {t.daysPending}d
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div className="card" style={{ flex: '1 1 500px', height: '400px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Sales Over Time</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => formatTenantCurrency(val)} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                formatter={(value, name, props) => [formatTooltipRevenue(value, props), 'Revenue']}
              />
              <Line type="monotone" dataKey="totalRevenue" stroke="var(--primary-color)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ flex: '1 1 500px', height: '400px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Sales by State</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stateSales}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="state" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => formatTenantCurrency(val)} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                formatter={(value, name, props) => [formatTooltipRevenue(value, props), 'Revenue']}
              />
              <Bar dataKey="totalRevenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 300px', overflowY: 'auto', height: '400px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Top Selling Products</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {topSelling.map((ts, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <img src={getProductCover(ts.product?.images)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{ts.product?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ts.totalQuantity} units sold</div>
                  </div>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#10b981' }}>
                  {formatTenantCurrency(ts.totalRevenue)}
                </div>
              </div>
            ))}
            {topSelling.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No sales data available.</p>}
          </div>
        </div>

        <div className="card" style={{ flex: '1 1 300px', overflowY: 'auto', height: '400px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Most Viewed Products</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {topProducts.map((tp, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <img src={getProductCover(tp.product?.images)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{tp.product?.name || 'Unknown'}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary-color)' }}>
                  {tp.viewCount} Views
                </div>
              </div>
            ))}
            {topProducts.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No viewing data available yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
