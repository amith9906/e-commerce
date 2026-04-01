import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Gift, Star, TrendingUp, RotateCcw, Settings, Save } from 'lucide-react';
import api from '../../api/client';
import { useBrand } from '../../context/BrandContext';

export default function Loyalty() {
  const { currency = 'USD', settings: tenantSettings, refreshSettings } = useBrand();
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    redemptionEnabled: false,
    valuePerPoint: 0.01,
    pointsPerOrder: 10,
    minRedemptionPoints: 100
  });

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (tenantSettings?.loyalty) {
      setConfig(prev => ({ ...prev, ...tenantSettings.loyalty }));
    }
  }, [tenantSettings]);

  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);
      const res = await api.get('/loyalty/admin/summary');
      setSummary(res.data.data);
    } catch {
      toast.error('Failed to load loyalty summary');
    } finally {
      setLoadingSummary(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      await api.put('/tenants/settings', { settings: { loyalty: config } });
      if (refreshSettings) await refreshSettings();
      toast.success('Loyalty settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n || 0);

  const statCards = [
    {
      label: 'Total Earned',
      value: summary?.earned?.toLocaleString() ?? '—',
      sub: `≈ ${fmt((summary?.earned || 0) * (config.valuePerPoint || 0))}`,
      icon: TrendingUp,
      color: '#22c55e'
    },
    {
      label: 'Total Redeemed',
      value: summary?.redeemed?.toLocaleString() ?? '—',
      sub: `≈ ${fmt((summary?.redeemed || 0) * (config.valuePerPoint || 0))}`,
      icon: RotateCcw,
      color: '#f59e0b'
    },
    {
      label: 'Outstanding Points',
      value: summary?.outstanding?.toLocaleString() ?? '—',
      sub: `≈ ${fmt((summary?.outstanding || 0) * (config.valuePerPoint || 0))}`,
      icon: Star,
      color: '#6366f1'
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          Loyalty Program
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
          Configure point rewards and view program statistics
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {statCards.map(card => (
          <div key={card.label} className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <card.icon size={20} color={card.color} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{card.label}</div>
              {loadingSummary ? (
                <div style={{ height: 24, width: 80, background: 'var(--border)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
              ) : (
                <>
                  <div style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>{card.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{card.sub}</div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
          <Settings size={18} color="var(--primary)" />
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Program Settings</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {/* Redemption toggle */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9375rem' }}>Enable Point Redemption</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Allow customers to redeem points at checkout
              </div>
            </div>
            <button
              onClick={() => setConfig(prev => ({ ...prev, redemptionEnabled: !prev.redemptionEnabled }))}
              style={{
                width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', flexShrink: 0,
                background: config.redemptionEnabled ? 'var(--primary)' : 'var(--border)',
                position: 'relative', transition: 'background 0.2s'
              }}
            >
              <span style={{
                position: 'absolute', top: 3, left: config.redemptionEnabled ? 25 : 3,
                width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s'
              }} />
            </button>
          </div>

          <div>
            <label className="form-label">Value Per Point ({currency})</label>
            <input
              type="number"
              className="form-input"
              min="0"
              step="0.001"
              value={config.valuePerPoint}
              onChange={e => setConfig(prev => ({ ...prev, valuePerPoint: parseFloat(e.target.value) || 0 }))}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Monetary value of 1 loyalty point
            </div>
          </div>

          <div>
            <label className="form-label">Points Per Order</label>
            <input
              type="number"
              className="form-input"
              min="0"
              step="1"
              value={config.pointsPerOrder}
              onChange={e => setConfig(prev => ({ ...prev, pointsPerOrder: parseInt(e.target.value) || 0 }))}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Points awarded per completed order
            </div>
          </div>

          <div>
            <label className="form-label">Minimum Redemption Points</label>
            <input
              type="number"
              className="form-input"
              min="0"
              step="1"
              value={config.minRedemptionPoints}
              onChange={e => setConfig(prev => ({ ...prev, minRedemptionPoints: parseInt(e.target.value) || 0 }))}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Minimum points required before redemption
            </div>
          </div>
        </div>

        {/* Preview */}
        <div style={{ marginTop: '1.25rem', padding: '0.875rem 1rem', background: 'var(--primary-soft, rgba(99,102,241,0.08))', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: 600, marginBottom: 6 }}>
            <Gift size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Preview
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
            Customers earn <strong>{config.pointsPerOrder} points</strong> per order.
            Each point is worth <strong>{fmt(config.valuePerPoint)}</strong>.
            {config.minRedemptionPoints > 0 && (
              <> Minimum <strong>{config.minRedemptionPoints} points</strong> ({fmt(config.minRedemptionPoints * config.valuePerPoint)}) required to redeem.</>
            )}
            {' '}Redemption is currently <strong>{config.redemptionEnabled ? 'enabled' : 'disabled'}</strong>.
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={saveConfig} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Save size={15} />
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
