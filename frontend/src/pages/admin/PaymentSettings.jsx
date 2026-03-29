import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { CreditCard, Landmark, DollarSign, Shield, Settings, Save } from 'lucide-react';

export default function PaymentSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    paymentGateway: 'mock',
    currency: 'INR',
    taxRate: 0,
    stripeSecretKey: '',
    stripePublishableKey: '',
    vpa: '',
    merchantName: ''
  });

  useEffect(() => {
    // Fetch current tenant settings
    api.get('/super/tenants/me') // Assuming an endpoint to fetch current tenant info
      .then(res => {
        if (res.success && res.data.settings) {
          setSettings({ ...settings, ...res.data.settings });
        }
      })
      .catch(err => console.error('Failed to load settings', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.put('/super/tenants/settings', { settings });
      if (res.success) {
        toast.success('Payment settings updated successfully!');
      }
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading configurations...</div>;

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Payment Configuration</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage how your store accepts payments and handles taxes.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '10px' }}
        >
          {saving ? 'Saving...' : <><Save size={18} /> Save Settings</>}
        </button>
      </div>

      <div style={{ display: 'grid', gap: '2rem' }}>
        
        {/* Gateway Selection */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={20} color="var(--primary-color)" /> Active Payment Gateway
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {['mock', 'stripe', 'qr'].map(method => (
              <button
                key={method}
                onClick={() => setSettings({ ...settings, paymentGateway: method })}
                style={{
                  padding: '1.5rem', borderRadius: '12px', border: settings.paymentGateway === method ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  backgroundColor: settings.paymentGateway === method ? '#eff6ff' : 'white', cursor: 'pointer', textAlign: 'left', transition: '0.2s'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', marginBottom: '0.5rem', color: settings.paymentGateway === method ? 'var(--primary-color)' : 'var(--text-main)' }}>
                  {method === 'qr' ? 'Dynamic QR (UPI)' : method}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  {method === 'mock' && 'For testing and demo purposes.'}
                  {method === 'stripe' && 'Accept Credit Cards and digital wallets.'}
                  {method === 'qr' && 'Accept UPI payments via unique QR codes.'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Fields based on Selection */}
        {settings.paymentGateway === 'stripe' && (
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={20} color="#3b82f6" /> Stripe Credentials
            </h2>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Secret Key</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={settings.stripeSecretKey} 
                  onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })} 
                  placeholder="sk_live_..." 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Publishable Key</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={settings.stripePublishableKey} 
                  onChange={(e) => setSettings({ ...settings, stripePublishableKey: e.target.value })} 
                  placeholder="pk_live_..." 
                />
              </div>
            </div>
          </div>
        )}

        {settings.paymentGateway === 'qr' && (
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Landmark size={20} color="#10b981" /> UPI / QR Details
            </h2>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Merchant UPI ID (VPA)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={settings.vpa} 
                  onChange={(e) => setSettings({ ...settings, vpa: e.target.value })} 
                  placeholder="merchant@upi" 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Merchant Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={settings.merchantName} 
                  onChange={(e) => setSettings({ ...settings, merchantName: e.target.value })} 
                  placeholder="Your Store Name" 
                />
              </div>
            </div>
          </div>
        )}

        {/* Global Finance Settings */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} color="#64748b" /> Global Finance Settings
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Default Currency</label>
              <select 
                className="input-field" 
                value={settings.currency} 
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Default Tax Rate (%)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  className="input-field" 
                  value={settings.taxRate} 
                  onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })} 
                />
                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
