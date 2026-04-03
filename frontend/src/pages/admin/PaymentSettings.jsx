import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { CreditCard, Landmark, DollarSign, Shield, Settings, Save, Mail, FileText, Building2, Hash, Globe } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { currencyCatalog } from '../../utils/currencyCatalog';

const DEFAULT_INVOICE_TEMPLATE = `
{{companyName}}
{{companyAddress}}
Email: {{supportEmail}}
Phone: {{supportPhone}}

Invoice #{{invoiceNumber}} | Order ID: {{orderId}}
Date: {{orderDate}}

Customer: {{customerName}} ({{customerEmail}})
Shipping: {{shippingAddress}}

Items:\n{{itemsList}}

Subtotal: {{subTotal}}
Discount: {{discountAmount}}
Tax ({{taxLabel}}): {{taxAmount}}
Shipping: {{shippingFee}}
Total Amount: {{totalAmount}}
Gift Card Credit: {{giftCardDeduction}}
Points Credit: {{pointsDeduction}}
Amount Due: {{amountDue}}

Payment Method: {{paymentMethodLabel}}

Notes:\n{{notes}}
`;

const defaultSettings = {
  paymentGateway: 'mock',
  currency: 'INR',
  taxRate: 0,
  taxLabel: 'Tax',
  stripeSecretKey: '',
  stripePublishableKey: '',
  vpa: '',
  merchantName: '',
  invoiceTemplate: DEFAULT_INVOICE_TEMPLATE,
  supportContacts: { email: '', phone: '' },
  companyName: '',
  companyAddress: '',
  gstin: '',
  companyWebsite: '',
  invoiceNotes: '',
  codEnabled: false,
  shipping: {
    freeShippingThreshold: 2000,
    flatShippingFee: 50,
    pinValidationMode: 'postal',
    origin: { country: 'India', state: '', city: '' },
    rates: {
      sameCity: 20,
      sameState: 40,
      outOfState: 60,
      international: 120
    }
  }
};


export default function PaymentSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [supportedCurrencies, setSupportedCurrencies] = useState(currencyCatalog);
  const updateSetting = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));
  const updateShippingSetting = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      shipping: {
        ...(prev.shipping || {}),
        [field]: value
      }
    }));
  };
  const updateSupportContact = (field, value) => setSettings((prev) => ({
    ...prev,
    supportContacts: {
      ...prev.supportContacts,
      [field]: value
    }
  }));
  const updateShippingOrigin = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      shipping: {
        ...(prev.shipping || {}),
        origin: {
          ...(prev.shipping?.origin || {}),
          [field]: value
        }
      }
    }));
  };
  const updateShippingRates = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      shipping: {
        ...(prev.shipping || {}),
        rates: {
          ...(prev.shipping?.rates || {}),
          [field]: value
        }
      }
    }));
  };
  const activeCurrencyMetadata = supportedCurrencies.find((currency) => currency.code === settings.currency) || supportedCurrencies[0];
  const previewCurrencyValue = formatCurrency(1234.56, settings.currency, {
    locale: activeCurrencyMetadata?.locale
  });
  const shippingSettings = settings.shipping || {};
  const freeShippingThreshold = Number(shippingSettings.freeShippingThreshold ?? 0);
  const flatShippingFee = Number(shippingSettings.flatShippingFee ?? 0);
  const pinValidationMode = shippingSettings.pinValidationMode || 'postal';
  const pinValidationOptions = [
    { value: 'country', label: 'All India (no pin validation)' },
    { value: 'state', label: 'State-level coverage (pins ignored when state matches)' },
    { value: 'city', label: 'City-level coverage (pins ignored when city matches)' },
    { value: 'postal', label: 'Per PIN validation (default strict behavior)' },
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/tenants/me');
        if (res.success) {
          const fetched = res.data.settings || {};
          setSettings({
            ...defaultSettings,
            ...fetched,
            supportContacts: {
              ...defaultSettings.supportContacts,
              ...(fetched.supportContacts || {})
            },
            companyName: fetched.companyName || '',
            companyAddress: fetched.companyAddress || '',
            gstin: fetched.gstin || '',
            companyWebsite: fetched.companyWebsite || '',
            invoiceNotes: fetched.invoiceNotes || '',
          });
        }
      } catch (err) {
        console.error('Failed to load tenant settings', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await api.get('/currencies');
        if (res.success && Array.isArray(res.data?.supportedCurrencies) && res.data.supportedCurrencies.length) {
          setSupportedCurrencies(res.data.supportedCurrencies);
        }
      } catch (err) {
        console.error('Failed to load currency catalog', err);
      }
    };

    fetchCurrencies();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.put('/tenants/settings', { settings });
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
                onClick={() => updateSetting('paymentGateway', method)}
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
                onChange={(e) => updateSetting('stripeSecretKey', e.target.value)} 
                  placeholder="sk_live_..." 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Publishable Key</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={settings.stripePublishableKey} 
                onChange={(e) => updateSetting('stripePublishableKey', e.target.value)} 
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
                onChange={(e) => updateSetting('vpa', e.target.value)} 
                  placeholder="merchant@upi" 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Merchant Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={settings.merchantName} 
                onChange={(e) => updateSetting('merchantName', e.target.value)} 
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Default Currency</label>
              <select
                className="input-field"
                value={settings.currency}
                onChange={(e) => updateSetting('currency', e.target.value)}
              >
                {supportedCurrencies.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.code} — {option.name}
                  </option>
                ))}
              </select>
              <p style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Symbol: {activeCurrencyMetadata?.symbol || '₹'} · Locale: {activeCurrencyMetadata?.locale || 'en-IN'}
              </p>
              <p style={{ marginTop: '0.2rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Preview: {previewCurrencyValue}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Tax Label</label>
              <input
                type="text"
                className="input-field"
                value={settings.taxLabel}
                onChange={(e) => updateSetting('taxLabel', e.target.value)}
                placeholder="GST / VAT / Tax"
              />
              <p style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Displayed next to the tax rate on invoices and order emails.</p>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Default Tax Rate (%)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  className="input-field" 
                  value={settings.taxRate} 
                  onChange={(e) => updateSetting('taxRate', parseFloat(e.target.value))} 
                />
                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={20} color="#0f172a" /> Shipping Configuration
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Cart total for free shipping</label>
              <input
                type="number"
                className="input-field"
                value={freeShippingThreshold}
                min={0}
                onChange={(e) => updateShippingSetting('freeShippingThreshold', Number(e.target.value || 0))}
                placeholder="e.g. 2000"
              />
              <p style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Orders above this amount qualify for free shipping ({formatCurrency(freeShippingThreshold || 0, settings.currency)}).
              </p>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Shipping fee below threshold</label>
              <input
                type="number"
                className="input-field"
                value={flatShippingFee}
                min={0}
                onChange={(e) => updateShippingSetting('flatShippingFee', Number(e.target.value || 0))}
                placeholder="e.g. 50"
              />
              <p style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Flat fee applied when cart total remains below your free-shipping amount.
              </p>
            </div>
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Origin address</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Country</label>
                <input
                  className="input-field"
                  value={shippingSettings.origin?.country || ''}
                  onChange={(e) => updateShippingOrigin('country', e.target.value)}
                  placeholder="India"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>State</label>
                <input
                  className="input-field"
                  value={shippingSettings.origin?.state || ''}
                  onChange={(e) => updateShippingOrigin('state', e.target.value)}
                  placeholder="Karnataka"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>City</label>
                <input
                  className="input-field"
                  value={shippingSettings.origin?.city || ''}
                  onChange={(e) => updateShippingOrigin('city', e.target.value)}
                  placeholder="Bengaluru"
                />
              </div>
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Shipping rates by zone</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
              {[
                { label: 'Same city', field: 'sameCity', description: 'Within origin city' },
                { label: 'Same state', field: 'sameState', description: 'Different city, same state' },
                { label: 'Other states', field: 'outOfState', description: 'Different state in origin country' },
                { label: 'International', field: 'international', description: 'Outside origin country' }
              ].map((opt) => (
                <div key={opt.field}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>{opt.label}</label>
                  <input
                    type="number"
                    className="input-field"
                    min={0}
                    value={shippingSettings.rates?.[opt.field] ?? ''}
                    onChange={(e) => updateShippingRates(opt.field, Number(e.target.value || 0))}
                    placeholder="0"
                  />
                  <p style={{ marginTop: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{opt.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Postal-code validation</label>
            <select
              className="input-field"
              value={pinValidationMode}
              onChange={(e) => updateShippingSetting('pinValidationMode', e.target.value)}
            >
              {pinValidationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Choose how strictly we validate postal codes for shipping coverage.
            </p>
          </div>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={20} color="#4338ca" /> Cash-on-Delivery (COD)
          </h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <input
              type="checkbox"
              checked={settings.codEnabled}
              onChange={(e) => updateSetting('codEnabled', e.target.checked)}
            />
            Enable COD for this tenant
          </label>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 0 }}>
            Customers will see the Cash-on-Delivery option on checkout. When COD is used, collect the cash at delivery and mark the payment as collected from the Orders dashboard.
          </p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={20} color="#10b981" /> Support & Billing Contacts
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Support Email</label>
              <input 
                type="email" 
                className="input-field" 
                value={settings.supportContacts.email}
                onChange={(e) => updateSupportContact('email', e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Support Phone</label>
              <input 
                type="tel" 
                className="input-field" 
                value={settings.supportContacts.phone}
                onChange={(e) => updateSupportContact('phone', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Invoice Template */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="#4338ca" /> Invoice Configuration
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
            These details appear on all generated invoices and PDF receipts.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}>
                <Building2 size={14} /> Company Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Acme Pvt Ltd"
                value={settings.companyName}
                onChange={(e) => updateSetting('companyName', e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}>
                <Hash size={14} /> GSTIN / Tax ID
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 27AAPFU0939F1ZV"
                value={settings.gstin}
                onChange={(e) => updateSetting('gstin', e.target.value.toUpperCase())}
                style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}>
                <Globe size={14} /> Website
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="https://yourstore.com"
                value={settings.companyWebsite}
                onChange={(e) => updateSetting('companyWebsite', e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Company / Registered Address</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="123 MG Road, Bengaluru, Karnataka 560001, India"
              value={settings.companyAddress}
              onChange={(e) => updateSetting('companyAddress', e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Invoice Footer Notes</label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="e.g. Thank you for your business! Goods once sold are not returnable."
              value={settings.invoiceNotes}
              onChange={(e) => updateSetting('invoiceNotes', e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Live Preview */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ padding: '0.625rem 1rem', background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={13} color="var(--text-muted)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice Preview</span>
            </div>
            <div style={{ padding: '1.5rem', background: '#fff', fontFamily: 'monospace', fontSize: '0.8125rem', lineHeight: 1.7, color: '#1e293b' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', fontFamily: 'sans-serif', color: '#0f172a', marginBottom: 2 }}>
                    {settings.companyName || 'Your Company Name'}
                  </div>
                  <div style={{ color: '#475569', whiteSpace: 'pre-line', fontSize: '0.75rem', fontFamily: 'sans-serif' }}>
                    {settings.companyAddress || '123 Business Street, City, State'}
                  </div>
                  {settings.gstin && (
                    <div style={{ color: '#475569', fontSize: '0.75rem', fontFamily: 'sans-serif', marginTop: 2 }}>
                      GSTIN: <strong>{settings.gstin}</strong>
                    </div>
                  )}
                  {settings.supportContacts.email && (
                    <div style={{ color: '#475569', fontSize: '0.75rem', fontFamily: 'sans-serif' }}>
                      Email: {settings.supportContacts.email}
                    </div>
                  )}
                  {settings.supportContacts.phone && (
                    <div style={{ color: '#475569', fontSize: '0.75rem', fontFamily: 'sans-serif' }}>
                      Phone: {settings.supportContacts.phone}
                    </div>
                  )}
                  {settings.companyWebsite && (
                    <div style={{ color: '#475569', fontSize: '0.75rem', fontFamily: 'sans-serif' }}>
                      {settings.companyWebsite}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'sans-serif', color: '#4338ca' }}>INVOICE</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'sans-serif' }}>
                    <div>Invoice #: <strong>INV-00001</strong></div>
                    <div>Date: <strong>{new Date().toLocaleDateString('en-IN')}</strong></div>
                    <div>Order ID: <strong>#A1B2C3D4</strong></div>
                  </div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '2px solid #4338ca', marginBottom: '1rem' }} />

              {/* Billing & Shipping */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontFamily: 'sans-serif', marginBottom: 4 }}>
                    Bill To
                  </div>
                  <div style={{ fontFamily: 'sans-serif', fontSize: '0.8125rem', color: '#1e293b', lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 600 }}>Customer Name</div>
                    <div>customer@email.com</div>
                    <div>+91 98765 43210</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontFamily: 'sans-serif', marginBottom: 4 }}>
                    Ship To
                  </div>
                  <div style={{ fontFamily: 'sans-serif', fontSize: '0.8125rem', color: '#1e293b', lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 600 }}>Customer Name</div>
                    <div>42 Sample Street, Koramangala</div>
                    <div>Bengaluru, Karnataka 560034</div>
                    <div>India</div>
                  </div>
                </div>
              </div>

              {/* Items table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontFamily: 'sans-serif', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 700, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>#</th>
                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 700, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Item Description</th>
                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Qty</th>
                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Unit Price</th>
                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Sample Product A', qty: 2, price: 499 },
                    { name: 'Sample Product B', qty: 1, price: 1299 },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{i + 1}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#1e293b' }}>{row.name}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: '#1e293b' }}>{row.qty}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#1e293b' }}>
                        {formatCurrency(row.price, settings.currency)}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>
                        {formatCurrency(row.price * row.qty, settings.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
                <div style={{ minWidth: 220, fontFamily: 'sans-serif', fontSize: '0.8125rem' }}>
                  {[
                    { label: 'Subtotal', value: formatCurrency(2297, settings.currency) },
                    { label: 'Shipping', value: formatCurrency(50, settings.currency) },
                    { label: `${settings.taxLabel || 'Tax'} (${settings.taxRate || 0}%)`, value: formatCurrency(2297 * (settings.taxRate || 0) / 100, settings.currency) },
                    { label: 'Discount', value: `-${formatCurrency(100, settings.currency)}` },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>
                      <span>{row.label}</span><span>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 800, fontSize: '0.9375rem', color: '#0f172a', borderTop: '2px solid #334155', marginTop: 4 }}>
                    <span>Total Due</span>
                    <span>{formatCurrency(2247 + 50 + 2297 * (settings.taxRate || 0) / 100, settings.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Footer notes */}
              {settings.invoiceNotes && (
                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b', fontFamily: 'sans-serif' }}>
                  {settings.invoiceNotes}
                </div>
              )}
              <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'sans-serif', textAlign: 'center' }}>
                {settings.companyName || 'Your Company'} · This is a computer-generated invoice and does not require a signature.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
