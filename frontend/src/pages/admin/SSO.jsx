'use strict';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/client';

const emptyForm = {
  provider: 'google',
  enabled: false,
  clientId: '',
  clientSecret: '',
  redirectUri: '',
  scopes: '',
  metadata: '',
};

const ensureJson = (value) => {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch (err) {
    throw new Error('Metadata must be valid JSON.');
  }
};

export default function SSO() {
  const [settings, setSettings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sso');
      if (res.success) setSettings(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Unable to load SSO settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.provider || !form.clientId || !form.clientSecret) {
      toast.error('Provider, client ID, and secret are required.');
      return;
    }

    let metadataObj = {};
    try {
      metadataObj = ensureJson(form.metadata);
    } catch (err) {
      toast.error(err.message);
      return;
    }

    setSaving(true);
    try {
      await api.post('/sso', {
        provider: form.provider,
        enabled: Boolean(form.enabled),
        clientId: form.clientId,
        clientSecret: form.clientSecret,
        redirectUri: form.redirectUri || undefined,
        scopes: form.scopes
          .split(',')
          .map((scope) => scope.trim())
          .filter(Boolean),
        metadata: metadataObj,
      });

      toast.success('SSO setting saved.');
      setForm(emptyForm);
      fetchSettings();
    } catch (err) {
      toast.error(err.message || 'Unable to save SSO setting.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (provider) => {
    const confirmDelete = window.confirm(
      `Remove ${provider} configuration?`
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/sso/${provider}`);
      toast.success('Setting removed.');
      fetchSettings();
    } catch (err) {
      toast.error(err.message || 'Unable to delete SSO setting.');
    }
  };

  const applySetting = (setting) => {
    setForm({
      provider: setting.provider,
      enabled: setting.enabled,
      clientId: setting.clientId,
      clientSecret: setting.clientSecret,
      redirectUri: setting.redirectUri || '',
      scopes: (setting.scopes || []).join(', '),
      metadata: JSON.stringify(setting.metadata || {}, null, 2),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>SSO Configuration</h1>
        <p style={{ color: '#64748b' }}>
          Enable Google or other providers for tenant login.
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Configure a provider</h2>

        <form
          onSubmit={handleSave}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <label>
            Provider
            <select
              className="input-field"
              value={form.provider}
              onChange={(e) => handleChange('provider', e.target.value)}
            >
              <option value="google">Google</option>
              <option value="okta">Okta</option>
              <option value="azure">Azure AD</option>
            </select>
          </label>

          <label>
            Client ID
            <input
              className="input-field"
              value={form.clientId}
              onChange={(e) => handleChange('clientId', e.target.value)}
            />
          </label>

          <label>
            Client Secret
            <input
              className="input-field"
              type="password"
              value={form.clientSecret}
              onChange={(e) => handleChange('clientSecret', e.target.value)}
            />
          </label>

          <label>
            Redirect URI
            <input
              className="input-field"
              value={form.redirectUri}
              onChange={(e) => handleChange('redirectUri', e.target.value)}
              placeholder="https://store.example.com/auth/sso/callback"
            />
          </label>

          <label>
            Scopes (comma separated)
            <input
              className="input-field"
              value={form.scopes}
              onChange={(e) => handleChange('scopes', e.target.value)}
              placeholder="openid,email,profile"
            />
          </label>

          <label>
            Metadata (JSON)
            <textarea
              className="input-field"
              rows={3}
              value={form.metadata}
              onChange={(e) => handleChange('metadata', e.target.value)}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
            />
            Enable provider
          </label>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ width: 'auto' }}
            >
              {saving ? 'Saving...' : 'Save setting'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ marginBottom: 0 }}>Active providers</h2>

          <button
            type="button"
            className="btn-secondary"
            onClick={fetchSettings}
            style={{
              width: 'auto',
              padding: '6px 12px',
              fontSize: '0.85rem',
            }}
          >
            Refresh
          </button>
        </div>

        <div className="table-responsive" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr style={{ textTransform: 'uppercase', fontSize: '12px', color: '#64748b' }}>
                {['Provider', 'Enabled', 'Client ID', 'Redirect URI', 'Actions'].map((title) => (
                  <th key={title} style={{ padding: '12px 8px', borderBottom: '1px solid #e5e7eb' }}>
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '16px' }}>
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && !settings.length && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '16px' }}>
                    No providers configured.
                  </td>
                </tr>
              )}

              {!loading &&
                settings.map((setting) => (
                  <tr key={setting.provider} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                      {setting.provider}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {setting.enabled ? 'Yes' : 'No'}
                    </td>
                    <td style={{ padding: '12px 8px' }}>{setting.clientId}</td>
                    <td style={{ padding: '12px 8px' }}>
                      {setting.redirectUri || '-'}
                    </td>

                    <td style={{ padding: '12px 8px', display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => applySetting(setting)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ color: '#dc2626' }}
                        onClick={() => handleDelete(setting.provider)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}