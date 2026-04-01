'use strict';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/client';
import PaginationControls from '../../components/PaginationControls';

const emptyForm = () => ({ label: '', expiresAt: '' });
const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().split('T')[0];
};

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, pages: 1, total: 0 });
  const PAGE_LIMIT = 10;

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_LIMIT };
      const res = await api.get('/api-keys', { params });
      if (res.success) {
        setKeys(res.data || []);
        const meta = res.pagination || { currentPage: page, pages: 1, total: (res.data || []).length };
        setPagination(meta);
        if (meta.pages && page > meta.pages) {
          setPage(meta.pages);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Unable to load API keys.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, [page]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.label.trim()) {
      toast.error('Label is required.');
      return;
    }
    setCreating(true);
    try {
      const res = await api.post('/api-keys', {
        label: form.label.trim(),
        expiresAt: form.expiresAt || undefined,
      });
      toast.success('Key created successfully!');
      setForm(emptyForm());
      fetchKeys();
    } catch (err) {
      toast.error(err.message || 'Unable to create API key.');
    } finally {
      setCreating(false);
    }
  };

  const handleAction = async (keyId, action) => {
    try {
      const res = await api.post(`/api-keys/${keyId}/${action}`);
      if (action === 'regenerate') {
        toast.success(`New secret: ${res.data?.secret || 'rotated'}`);
      } else {
        toast.success('Key revoked.');
      }
      fetchKeys();
    } catch (err) {
      toast.error(err.message || 'Unable to update API key.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>API Key Management</h1>
        <p style={{ color: '#64748b' }}>Generate API keys for third-party systems and rotate secrets safely.</p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Generate new key</h2>
        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
          <label>
            Label
            <input className="input-field" value={form.label} onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))} placeholder="Integration name" />
          </label>
          <label>
            Expiry date (optional)
            <input type="date" className="input-field" value={form.expiresAt} onChange={(event) => setForm((prev) => ({ ...prev, expiresAt: event.target.value }))} />
          </label>
          <button type="submit" className="btn-primary" disabled={creating} style={{ width: 'auto' }}>
            {creating ? 'Generating…' : 'Create API key'}
          </button>
        </form>
      </div>

    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ marginBottom: 0 }}>Existing keys</h2>
        <button type="button" className="btn-secondary" onClick={fetchKeys} style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
          Refresh
        </button>
      </div>
        <div className="table-responsive" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>
                {['Label', 'Released', 'Expires', 'Status', 'Last used', 'Actions'].map((col) => (
                  <th key={col} style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid #e5e7eb' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>Loading�</td>
                </tr>
              )}
              {!loading && !keys.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>No keys yet.</td>
                </tr>
              )}
              {!loading && keys.map((key) => (
                <tr key={key.keyId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{key.label}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{formatDate(key.createdAt)}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{formatDate(key.expiresAt)}</td>
                  <td style={{ padding: '0.75rem 0.5rem', textTransform: 'capitalize' }}>{key.status}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never'}</td>
                  <td style={{ padding: '0.75rem 0.5rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleAction(key.keyId, 'regenerate')}>
                    Regenerate
                  </button>
                  {key.status !== 'revoked' && (
                      <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#dc2626' }} onClick={() => handleAction(key.keyId, 'revoke')}>
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationControls
          currentPage={pagination.currentPage || page}
          totalPages={Math.max(1, pagination.pages || 1)}
          onChange={(target) => setPage(target)}
        />
      </div>
    </div>
  );
}
