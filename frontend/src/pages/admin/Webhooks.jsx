 'use strict';
 import { useEffect, useState } from 'react';
 import { toast } from 'react-toastify';
 import api from '../../api/client';
 import PaginationControls from '../../components/PaginationControls';
 import { Search } from 'lucide-react';

const emptyForm = () => ({
  name: '',
  url: '',
  events: 'order.created,inventory.updated',
  status: 'enabled',
  secret: '',
  editingId: null,
});

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', status: '' });
  const PAGE_LIMIT = 10;

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/webhooks', {
        params: {
          page,
          limit: PAGE_LIMIT,
          q: filters.search || undefined,
          status: filters.status || undefined
        }
      });
      if (res.success) {
        const meta = res.pagination || { currentPage: page, pages: 1, total: res.data?.length || 0 };
        if (meta.pages && page > meta.pages) {
          setPage(meta.pages);
        }
        setPagination(meta);
        setWebhooks(res.data || []);
      }
    } catch (err) {
      toast.error(err.message || 'Unable to load webhooks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWebhooks(); }, [page, filters.search, filters.status]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const startEdit = (webhook) => {
    setForm({
      name: webhook.name,
      url: webhook.url,
      events: (webhook.events || []).join(','),
      status: webhook.status,
      secret: webhook.secret || '',
      editingId: webhook.id,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => setForm(emptyForm());

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.url.trim()) {
      toast.error('Name and URL are required.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      url: form.url.trim(),
      events: form.events.split(',').map((evt) => evt.trim()).filter(Boolean),
      status: form.status,
      secret: form.secret || undefined,
    };
    if (!payload.events.length) {
      toast.error('Provide at least one event.');
      return;
    }
    setSaving(true);
    try {
      if (form.editingId) {
        await api.patch(`/webhooks/${form.editingId}`, payload);
        toast.success('Webhook updated.');
      } else {
        await api.post('/webhooks', payload);
        toast.success('Webhook created.');
      }
      resetForm();
      fetchWebhooks();
    } catch (err) {
      toast.error(err.message || 'Unable to save webhook.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this webhook?')) return;
    try {
      await api.delete(`/webhooks/${id}`);
      toast.success('Webhook removed.');
      fetchWebhooks();
    } catch (err) {
      toast.error(err.message || 'Unable to delete webhook.');
    }
  };

  const handleTest = async (id) => {
    try {
      await api.post(`/webhooks/${id}/test`);
      toast.success('Test event queued.');
    } catch (err) {
      toast.error(err.message || 'Test failed.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Outbound Webhooks</h1>
        <p style={{ color: '#64748b' }}>Notify external services when orders, transfers, or inventory change.</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 style={{ margin: 0 }}>{form.editingId ? 'Update webhook' : 'Register webhook'}</h2>
          <button
            type="button"
            className="btn-secondary"
            onClick={resetForm}
            style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
          >
            Reset form
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          <label>
            Name
            <input className="input-field" value={form.name} onChange={(event) => handleChange('name', event.target.value)} placeholder="Order webhook" />
          </label>
          <label>
            URL
            <input className="input-field" value={form.url} onChange={(event) => handleChange('url', event.target.value)} placeholder="https://hooks.example.com/orders" />
          </label>
          <label>
            Events (comma separated)
            <input className="input-field" value={form.events} onChange={(event) => handleChange('events', event.target.value)} placeholder="order.created,inventory.updated" />
          </label>
          <label>
            Secret (optional)
            <input className="input-field" value={form.secret} onChange={(event) => handleChange('secret', event.target.value)} placeholder="Leave blank to auto-generate" />
          </label>
          <label>
            Status
            <select className="input-field" value={form.status} onChange={(event) => handleChange('status', event.target.value)}>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={saving} style={{ width: 'auto' }}>
              {saving ? 'Saving' : form.editingId ? 'Update webhook' : 'Create webhook'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Webhook registry</h2>
            <small style={{ color: '#64748b' }}>Filter by URL, name, or status.</small>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.75rem', borderRadius: '999px', border: '1px solid var(--border-color)', background: 'white' }}>
              <Search size={16} color="#94a3b8" />
              <input
                className="input-field"
                placeholder="Search name or URL"
                style={{ border: 'none', padding: 0, width: '220px' }}
                value={filters.search}
                onChange={(event) => handleFilterChange('search', event.target.value)}
              />
            </div>
            <select
              className="input-field"
              style={{ width: '160px' }}
              value={filters.status}
              onChange={(event) => handleFilterChange('status', event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="enabled">enabled</option>
              <option value="disabled">disabled</option>
            </select>
            <button
              type="button"
              className="btn-secondary"
              onClick={fetchWebhooks}
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="table-responsive" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>
                {['Name', 'URL', 'Events', 'Status', 'Last result', 'Actions'].map((title) => (
                  <th key={title} style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid #e5e7eb' }}>{title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>Loading</td>
                </tr>
              )}
              {!loading && !webhooks.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>No webhooks yet.</td>
                </tr>
              )}
              {!loading && webhooks.map((hook) => (
                <tr key={hook.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{hook.name}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{hook.url}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{(hook.events || []).join(', ')}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{hook.status}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{hook.lastStatus || '-'}</td>
                  <td style={{ padding: '0.75rem 0.5rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      onClick={() => startEdit(hook)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      onClick={() => handleTest(hook.id)}
                    >
                      Test
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#dc2626' }}
                      onClick={() => handleDelete(hook.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationControls
          currentPage={pagination.currentPage || page}
          totalPages={Math.max(1, pagination.pages || 1)}
          onChange={(targetPage) => setPage(targetPage)}
        />
      </div>
    </div>
  );
}
