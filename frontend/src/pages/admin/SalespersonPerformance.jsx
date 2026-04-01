import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Download, TrendingUp, User, RefreshCw } from 'lucide-react';
import api from '../../api/client';
import { useBrand } from '../../context/BrandContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SalespersonPerformance() {
  const { currency = 'USD' } = useBrand();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/salespersons/performance');
      setData(res.data || []);
    } catch {
      toast.error('Failed to load salesperson performance');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const response = await api.get('/analytics/commissions/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salesperson-commissions-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch {
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const totalRevenue = data.reduce((sum, d) => sum + (d.totalAmount || 0), 0);
  const totalUnits = data.reduce((sum, d) => sum + (d.totalUnits || 0), 0);

  const chartData = data.map(d => ({
    name: d.name?.split(' ')[0] || 'Unknown',
    revenue: d.totalAmount || 0,
    units: d.totalUnits || 0
  }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Salesperson Performance
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Revenue and units sold per salesperson
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={fetchPerformance} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn-primary" onClick={handleExportCsv} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} color="#6366f1" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Total Revenue</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{formatCurrency(totalRevenue, currency)}</div>
          </div>
        </div>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={20} color="#22c55e" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Total Units Sold</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{totalUnits.toLocaleString()}</div>
          </div>
        </div>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={20} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Active Salespersons</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{data.length}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {/* Revenue chart */}
        {chartData.length > 0 && (
          <div className="card" style={{ padding: '1.25rem', gridColumn: chartData.length <= 3 ? '1 / -1' : undefined }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Revenue by Salesperson</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => formatCurrency(v, currency)} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  formatter={v => [formatCurrency(v, currency), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No salesperson performance data yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Rank</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Salesperson</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Units Sold</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Revenue</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {data.map((sp, idx) => {
                  const pct = totalRevenue > 0 ? ((sp.totalAmount / totalRevenue) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={sp.salesPersonId || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 26, height: 26, borderRadius: '50%', fontSize: '0.75rem', fontWeight: 700,
                          background: idx === 0 ? '#fef3c7' : idx === 1 ? '#f1f5f9' : idx === 2 ? '#fdf4ff' : 'transparent',
                          color: idx === 0 ? '#d97706' : idx === 1 ? '#64748b' : idx === 2 ? '#9333ea' : 'var(--text-muted)'
                        }}>
                          {idx + 1}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>{sp.name}</div>
                        {sp.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sp.email}</div>}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 500 }}>
                        {(sp.totalUnits || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 700, color: '#6366f1' }}>
                        {formatCurrency(sp.totalAmount || 0, currency)}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          <div style={{ width: 60, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#6366f1', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
