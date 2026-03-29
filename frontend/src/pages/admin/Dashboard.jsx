import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useBrand } from '../../context/BrandContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Package, Users, ShoppingBag, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, activeUsers: 0, totalProducts: 0 });
  const [salesData, setSalesData] = useState([]);
  const [stateSales, setStateSales] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { storeName } = useBrand();

  useEffect(() => {
    // In a real app we might have a dedicated dashboard endpoint.
    // For now we'll fetch from analytics/sales
    Promise.all([
      api.get('/analytics/sales'),
      api.get('/analytics/stats'),
      api.get('/analytics/views'),
      api.get('/analytics/sales/state'),
      api.get('/analytics/products/topselling')
    ]).then(([salesRes, statsRes, viewsRes, stateRes, topSellingRes]) => {
      
      let revenue = 0;
      let orders = 0;
      if (salesRes.success) {
        setSalesData(salesRes.data.reverse()); // older dates first for chart
        revenue = salesRes.data.reduce((acc, curr) => acc + Number(curr.totalRevenue), 0);
        orders = salesRes.data.reduce((acc, curr) => acc + Number(curr.totalOrders), 0);
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
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard title="Total Revenue (30d)" value={`$${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} color="#10b981" />
        <StatCard title="Orders (30d)" value={stats.totalOrders} icon={ShoppingBag} color="#3b82f6" />
        <StatCard title="Active Users" value={stats.activeUsers} icon={Users} color="#8b5cf6" />
        <StatCard title="Total Products" value={stats.totalProducts} icon={Package} color="#f59e0b" />
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div className="card" style={{ flex: '1 1 500px', height: '400px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Sales Over Time</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
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
              <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
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
                    {ts.product?.images && ts.product.images.length > 0 && <img src={ts.product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{ts.product?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ts.totalQuantity} units sold</div>
                  </div>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#10b981' }}>
                  ${Number(ts.totalRevenue).toFixed(2)}
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
                    {tp.product?.images && tp.product.images.length > 0 && <img src={tp.product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
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
