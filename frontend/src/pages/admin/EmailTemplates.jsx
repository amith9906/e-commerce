'use strict';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/client';

const emptyTemplate = { templateType: '', name: '', subject: '', body: '', placeholders: '' };

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyTemplate);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/email-templates');
      if (res.success) setTemplates(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Unable to load templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const initForm = (template) => {
    setSelected(template);
    setForm({
      templateType: template.templateType,
      name: template.name,
      subject: template.subject,
      body: template.body,
      placeholders: (template.placeholders || []).join(', '),
    });
  };

  const startCreate = () => {
    setSelected(null);
    setForm(emptyTemplate);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.templateType || !form.name || !form.subject || !form.body) {
      toast.error('Complete template type, name, subject and body.');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      subject: form.subject,
      body: form.body,
      placeholders: form.placeholders.split(',').map((value) => value.trim()).filter(Boolean),
    };
    try {
      if (selected) {
        await api.patch(`/email-templates/${selected.templateType}`, payload);
        toast.success('Template updated.');
      } else {
        await api.post('/email-templates', {
          ...payload,
          templateType: form.templateType,
        });
        toast.success('Template created.');
      }
      fetchTemplates();
    } catch (err) {
      toast.error(err.message || 'Unable to save template.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm('Delete this template?')) return;
    try {
      await api.delete(`/email-templates/${selected.templateType}`);
      toast.success('Template deleted.');
      startCreate();
      fetchTemplates();
    } catch (err) {
      toast.error(err.message || 'Unable to delete template.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Email Templates</h1>
        <p style={{ color: '#64748b' }}>Customize transactional email copy per event.</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 style={{ margin: 0 }}>{selected ? `Editing: ${selected.name}` : 'Create a template'}</h2>
          <button
            type="button"
            className="btn-secondary"
            onClick={startCreate}
            style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
          >
            Start new
          </button>
        </div>
        <form
          onSubmit={handleSave}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}
        >
          <label>
            Template type
            <input
              className="input-field"
              value={form.templateType}
              onChange={(event) => handleChange('templateType', event.target.value)}
              placeholder="order.confirmed"
              disabled={Boolean(selected)}
            />
          </label>
          <label>
            Name
            <input
              className="input-field"
              value={form.name}
              onChange={(event) => handleChange('name', event.target.value)}
              placeholder="Order confirmation"
            />
          </label>
          <label>
            Subject
            <input
              className="input-field"
              value={form.subject}
              onChange={(event) => handleChange('subject', event.target.value)}
              placeholder="Your order is confirmed"
            />
          </label>
          <label className="full-width">
            Body
            <textarea
              className="input-field"
              rows="4"
              value={form.body}
              onChange={(event) => handleChange('body', event.target.value)}
              placeholder="Hello {customerName} ..."
            />
          </label>
          <label className="full-width">
            Placeholders (comma separated)
            <input
              className="input-field"
              value={form.placeholders}
              onChange={(event) => handleChange('placeholders', event.target.value)}
              placeholder="customerName totalAmount"
            />
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={saving} style={{ width: 'auto' }}>
              {saving ? 'Saving�' : selected ? 'Update template' : 'Create template'}
            </button>
            {selected && (
              <button
                type="button"
                className="btn-secondary"
                style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: '#dc2626' }}
                onClick={handleDelete}
              >
                Delete template
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Available templates</h2>
        <div className="table-responsive" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>
                {['Type', 'Name', 'Status', 'Placeholders', 'Actions'].map((title) => (
                  <th key={title} style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid #e5e7eb' }}>{title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>Loading�</td>
                </tr>
              )}
              {!loading && !templates.length && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>No templates yet.</td>
                </tr>
              )}
              {!loading &&
                templates.map((template) => (
                  <tr key={template.templateType} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{template.templateType}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{template.name}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{template.status}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{(template.placeholders || []).join(', ')}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => initForm(template)}
                      >
                        Edit
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
