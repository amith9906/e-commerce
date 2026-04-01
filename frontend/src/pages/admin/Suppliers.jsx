'use strict';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/client';
import PaginationControls from '../../components/PaginationControls';

const createEmptySupplierForm = () => ({
  name: '',
  email: '',
  phone: '',
  contactName: '',
  address: '',
  notes: '',
  status: 'active',
});

const normalizeAddress = (address) => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  if (address.raw) return address.raw;
  if (Array.isArray(address.lines)) return address.lines.join(', ');
  return JSON.stringify(address);
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(createEmptySupplierForm());
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, pages: 1, total: 0 });
  const PAGE_LIMIT = 10;

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_LIMIT };
      const res = await api.get('/suppliers', { params });
      if (res.success) {
        setSuppliers(res.data || []);
        const meta = res.pagination || { currentPage: page, pages: 1, total: (res.data || []).length };
        setPagination(meta);
        if (meta.pages && page > meta.pages) {
          setPage(meta.pages);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Unable to load suppliers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      contactName: supplier.contactName || '',
      address: normalizeAddress(supplier.address),
      notes: supplier.notes || '',
      status: supplier.status || 'active',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setForm(createEmptySupplierForm());
    setEditingSupplier(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Supplier name is required.');
      return;
    }
    setSaving(true);
    try {
      if (editingSupplier) {
        await api.patch(`/suppliers/${editingSupplier.id}`, {
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          contactName: form.contactName.trim() || undefined,
          address: form.address.trim() || undefined,
          notes: form.notes.trim() || undefined,
          status: form.status,
        });
        toast.success('Supplier updated.');
      } else {
        await api.post('/suppliers', {
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          contactName: form.contactName.trim() || undefined,
          address: form.address.trim() || undefined,
          notes: form.notes.trim() || undefined,
          status: form.status,
        });
        toast.success('Supplier added.');
      }
      resetForm();
      fetchSuppliers();
    } catch (err) {
      toast.error(err.message || 'Unable to save supplier.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Suppliers</h1>
        <p style={{ color: '#64748b' }}>Capture supplier details, contact info, and status for purchase orders.</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>{editingSupplier ? 'Update supplier' : 'Add new supplier'}</h2>
            <p style={{ color: '#475569', fontSize: '0.9rem' }}>
              Provide the vendor details that will appear on purchase orders and receiving sheets.
            </p>
          </div>
          {(editingSupplier || form.name || form.email) && (
            <button type="button" className="btn-secondary" onClick={resetForm} style={{ alignSelf: 'flex-start' }}>
              Reset form
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <label>
              Supplier name
              <input
                className="input-field"
                value={form.name}
                onChange={(event) => handleFormChange('name', event.target.value)}
                placeholder="ABC Distributors"
              />
            </label>
            <label>
              Contact person
              <input
                className="input-field"
                value={form.contactName}
                onChange={(event) => handleFormChange('contactName', event.target.value)}
                placeholder="Priya Shah"
              />
            </label>
            <label>
              Email
              <input
                className="input-field"
                type="email"
                value={form.email}
                onChange={(event) => handleFormChange('email', event.target.value)}
                placeholder="procurement@example.com"
              />
            </label>
            <label>
              Phone
              <input
                className="input-field"
                value={form.phone}
                onChange={(event) => handleFormChange('phone', event.target.value)}
                placeholder="+91 98765 43210"
              />
            </label>
            <label>
              Status
              <select
                className="input-field"
                value={form.status}
                onChange={(event) => handleFormChange('status', event.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <label>
            Address
            <textarea
              className="input-field"
              rows={2}
              value={form.address}
              onChange={(event) => handleFormChange('address', event.target.value)}
              placeholder="Street, city, state"
            />
          </label>
          <label>
            Notes
            <textarea
              className="input-field"
              rows={2}
              value={form.notes}
              onChange={(event) => handleFormChange('notes', event.target.value)}
              placeholder="Delivery cadence, payment terms, etc."
            />
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="submit" className="btn-primary" disabled={saving} style={{ width: 'auto' }}>
              {saving ? 'Saving...' : editingSupplier ? 'Update supplier' : 'Add supplier'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>Supplier directory</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Search or select a supplier to edit their information.</p>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{pagination.total || suppliers.length} suppliers</span>
        </div>
        <div className="table-responsive" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>
                {['Name', 'Contact', 'Email', 'Phone', 'Status', 'Notes', 'Actions'].map((title) => (
                  <th key={title} style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid #e5e7eb' }}>
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '1rem' }}>
                    Loading suppliers...
                  </td>
                </tr>
              )}
              {!loading && suppliers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '1rem' }}>
                    No suppliers added yet.
                  </td>
                </tr>
              )}
              {!loading && suppliers.map((supplier) => (
                <tr key={supplier.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{supplier.name}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{supplier.contactName || '—'}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{supplier.email || '—'}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{supplier.phone || '—'}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <span style={{
                      padding: '0.2rem 0.65rem',
                      borderRadius: '999px',
                      background: supplier.status === 'active' ? '#ecfdf5' : '#fef3c7',
                      color: supplier.status === 'active' ? '#047857' : '#b45309',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {supplier.status || 'active'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', maxWidth: '240px' }}>
                    <small style={{ color: '#475569' }}>{supplier.notes || '—'}</small>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <button type="button" className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleEdit(supplier)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationControls currentPage={pagination.currentPage || page} totalPages={pagination.pages || 1} onChange={(target) => setPage(target)} />
        </div>
      </div>
    </div>
  );
}
