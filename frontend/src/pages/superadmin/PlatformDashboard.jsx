import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Building2, Users, ShoppingCart, DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import api from '../../api/client';

const PLAN_COLORS_MAP = { free: '#9ca3af', starter: '#3b82f6', growth: '#8b5cf6', enterprise: '#f59e0b' };

export default function PlatformDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/super/tenants/analytics')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load platform analytics.'))
      .finally(() => setLoading(false));
  }, []);

  const s = {
    page: { padding: '2rem' },
    heading: { fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 },
    grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 },
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, marginBottom: 24 },
    metricCard: (color) => ({ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, borderLeft: `4px solid ${color}` }),
    chartCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 },
    label: { fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    value: { fontSize: '2rem', fontWeight: 800 },
    badge: (positive) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: positive ? '#15803d' : '#b91c1c', background: positive ? '#f0fdf4' : '#fef2f2', padding: '2px 8px', borderRadius: 20 }),
  };

  if (loading) return <div style={s.page}><p>Loading platform analytics...</p></div>;
  if (!data) return <div style={s.page}><p>Failed to load data.</p></div>;

  const { overview, planDistribution, tenantGrowth, revenueGrowth, topTenants } = data;

  const metrics = [
    { label: 'Total Tenants', value: overview.activeTenants.toLocaleString(), sub: `+${overview.newTenantsThisMonth} this month`, growth: overview.tenantGrowthRate, icon: Building2, color: '#4f46e5' },
    { label: 'Total Customers', value: overview.totalCustomers.toLocaleString(), sub: 'Registered customers', growth: null, icon: Users, color: '#0891b2' },
    { label: 'Orders This Month', value: overview.ordersThisMonth.toLocaleString(), sub: `${overview.ordersGrowthRate > 0 ? '+' : ''}${overview.ordersGrowthRate}% vs last month`, growth: overview.ordersGrowthRate, icon: ShoppingCart, color: '#059669' },
    { label: 'MRR', value: `$${Math.round(overview.mrr).toLocaleString()}`, sub: `$${Math.round(overview.revenueThisMonth).toLocaleString()} GMV this month`, growth: overview.revenueGrowthRate, icon: DollarSign, color: '#d97706' },
  ];

  return (
    <div style={s.page}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={s.heading}>Platform Dashboard</h1>
        <p style={{ color: '#666' }}>Cross-tenant overview for superadmin</p>
      </div>

      {/* Key metrics */}
      <div style={s.grid4}>
        {metrics.map(m => (
          <div key={m.label} style={s.metricCard(m.color)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={s.label}>{m.label}</span>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <m.icon size={18} color={m.color} />
              </div>
            </div>
            <div style={s.value}>{m.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 12, color: '#888' }}>{m.sub}</span>
              {m.growth !== null && m.growth !== undefined && (
                <span style={s.badge(m.growth >= 0)}>
                  {m.growth >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {Math.abs(m.growth)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={s.grid2}>
        {/* Tenant growth */}
        <div style={s.chartCard}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>New Tenants (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tenantGrowth}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="New Tenants" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue trend */}
        <div style={s.chartCard}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>GMV Trend (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueGrowth}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => [`$${v}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} dot={{ fill: '#059669', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={s.grid2}>
        {/* Plan distribution */}
        <div style={s.chartCard}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>Plan Distribution</h3>
          {planDistribution.length === 0 ? (
            <p style={{ color: '#888', fontSize: 13 }}>No active tenants.</p>
          ) : (
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <PieChart width={160} height={160}>
                <Pie data={planDistribution} cx={75} cy={75} innerRadius={45} outerRadius={75} dataKey="count" nameKey="planName">
                  {planDistribution.map(entry => (
                    <Cell key={entry.plan} fill={PLAN_COLORS_MAP[entry.plan] || '#9ca3af'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [v, name]} />
              </PieChart>
              <div>
                {planDistribution.map(p => (
                  <div key={p.plan} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: PLAN_COLORS_MAP[p.plan] || '#9ca3af' }} />
                    <span style={{ fontSize: 13 }}>{p.planName}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{p.count}</span>
                    {p.price > 0 && <span style={{ fontSize: 11, color: '#888' }}>× ${p.price}/mo</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top tenants */}
        <div style={s.chartCard}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>Top Tenants by Revenue</h3>
          {topTenants.length === 0 ? (
            <p style={{ color: '#888', fontSize: 13 }}>No revenue data yet.</p>
          ) : (
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#888', fontWeight: 600, fontSize: 11 }}>
                  <th style={{ textAlign: 'left', paddingBottom: 8 }}>Store</th>
                  <th style={{ textAlign: 'right', paddingBottom: 8 }}>Orders</th>
                  <th style={{ textAlign: 'right', paddingBottom: 8 }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topTenants.map((t, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 0' }}>
                      <div style={{ fontWeight: 600 }}>{t.tenant?.name || 'Unknown'}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{t.tenant?.plan || ''} · {t.tenant?.slug}</div>
                    </td>
                    <td style={{ textAlign: 'right', color: '#374151' }}>{t.orderCount}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>${t.totalRevenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Activity summary */}
      <div style={s.chartCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Activity size={16} color="#4f46e5" />
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Platform Summary</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { label: 'Total Tenants', value: overview.totalTenants },
            { label: 'Active Tenants', value: overview.activeTenants },
            { label: 'Suspended', value: overview.suspendedTenants },
            { label: 'Total Orders', value: overview.totalOrders },
            { label: 'All-Time GMV', value: `$${Math.round(overview.totalRevenue).toLocaleString()}` },
            { label: 'Monthly MRR', value: `$${Math.round(overview.mrr).toLocaleString()}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center', padding: 12, background: '#f8f9fa', borderRadius: 8 }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111' }}>{value}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
