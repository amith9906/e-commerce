import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  ShieldCheck, 
  ShieldAlert,
  Globe,
  Settings
} from 'lucide-react';
import api from '../../api/client';

export default function TenantManagement() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    customDomain: '',
    plan: 'free',
    status: 'active'
  });

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const response = await api.get('/super/tenants');
      // The API returns { success: true, data: [...] }
      setTenants(response.data || []);
    } catch (error) {
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleOpenModal = (tenant = null) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData({
        name: tenant.name,
        slug: tenant.slug,
        customDomain: tenant.customDomain || '',
        plan: tenant.plan,
        status: tenant.status
      });
    } else {
      setEditingTenant(null);
      setFormData({
        name: '',
        slug: '',
        customDomain: '',
        plan: 'free',
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTenant) {
        await api.put(`/super/tenants/${editingTenant.id}`, formData);
        toast.success('Tenant updated successfully');
      } else {
        await api.post('/super/tenants', formData);
        toast.success('Tenant created successfully');
      }
      setIsModalOpen(false);
      fetchTenants();
    } catch (error) {
      toast.error(error.message || 'Action failed');
    }
  };

  const handleToggleStatus = async (tenant) => {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    try {
      await api.put(`/super/tenants/${tenant.id}`, { status: newStatus });
      toast.success(`Tenant ${newStatus === 'active' ? 'activated' : 'suspended'}`);
      fetchTenants();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const s = {
    container: { padding: '2rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    title: { fontSize: '1.5rem', fontWeight: 700, margin: 0 },
    card: { background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
    th: { textAlign: 'left', padding: '12px 16px', background: '#f9fafb', color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb' },
    td: { padding: '16px', borderBottom: '1px solid #e5e7eb' },
    badge: (status) => ({
      padding: '4px 8px',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      background: status === 'active' ? '#def7ec' : '#fde2e2',
      color: status === 'active' ? '#03543f' : '#9b1c1c'
    }),
    btnPrimary: { 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.5rem', 
      padding: '0.6rem 1.2rem', 
      background: 'var(--primary-color)', 
      color: 'white', 
      border: 'none', 
      borderRadius: '8px', 
      cursor: 'pointer',
      fontWeight: 600
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      background: 'white',
      padding: '2rem',
      borderRadius: '16px',
      width: '100%',
      maxWidth: '500px',
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
    },
    formGroup: { marginBottom: '1.25rem' },
    label: { display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#374151' },
    input: { width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem' },
    select: { width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem', background: 'white' },
    btnGroup: { display: 'flex', gap: '1rem', marginTop: '2rem' }
  };

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div>
          <h1 style={s.title}>Tenant Management</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Manage platform merchants and domains</p>
        </div>
        <button style={s.btnPrimary} onClick={() => handleOpenModal()}>
          <Plus size={18} />
          Create Tenant
        </button>
      </header>

      <div style={s.card}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Tenant</th>
              <th style={s.th}>Domains</th>
              <th style={s.th}>Plan</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
            ) : tenants.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No tenants found.</td></tr>
            ) : tenants.map(tenant => (
              <tr key={tenant.id}>
                <td style={s.td}>
                  <div style={{ fontWeight: 600 }}>{tenant.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>ID: {tenant.id}</div>
                </td>
                <td style={s.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Globe size={10} color="#9ca3af" />
                    </div>
                    <span>{tenant.slug}.ammoghtech.co</span>
                  </div>
                  {tenant.customDomain && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontSize: '0.85rem' }}>
                      <ExternalLink size={12} />
                      {tenant.customDomain}
                    </div>
                  )}
                </td>
                <td style={s.td}>
                  <span style={{ textTransform: 'capitalize' }}>{tenant.plan}</span>
                </td>
                <td style={s.td}>
                  <span style={s.badge(tenant.status)}>{tenant.status}</span>
                </td>
                <td style={s.td}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                      onClick={() => handleOpenModal(tenant)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563' }}
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(tenant)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: tenant.status === 'active' ? '#dc2626' : '#16a34a' }}
                      title={tenant.status === 'active' ? 'Suspend' : 'Activate'}
                    >
                      {tenant.status === 'active' ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={s.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={s.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
              {editingTenant ? 'Edit Tenant' : 'Create New Tenant'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={s.formGroup}>
                <label style={s.label}>Store Name</label>
                <input 
                  style={s.input} 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Awesome Shoes"
                />
              </div>

              {!editingTenant && (
                <div style={s.formGroup}>
                  <label style={s.label}>Subdomain Slug</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      style={s.input} 
                      required
                      value={formData.slug}
                      onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                      placeholder="awesome-shoes"
                    />
                    <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>.ammoghtech.co</span>
                  </div>
                </div>
              )}

              <div style={s.formGroup}>
                <label style={s.label}>Custom Domain (Optional)</label>
                <input 
                  style={s.input} 
                  value={formData.customDomain}
                  onChange={e => setFormData({...formData, customDomain: e.target.value})}
                  placeholder="e.g. shop.awesomeshoes.com"
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Subscription Plan</label>
                <select 
                  style={s.select}
                  value={formData.plan}
                  onChange={e => setFormData({...formData, plan: e.target.value})}
                >
                  <option value="free">Free Plan</option>
                  <option value="starter">Starter Plan</option>
                  <option value="growth">Growth Plan</option>
                  <option value="enterprise">Enterprise Plan</option>
                </select>
              </div>

              {editingTenant && (
                <div style={s.formGroup}>
                  <label style={s.label}>Status</label>
                  <select 
                    style={s.select}
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              )}

              <div style={s.btnGroup}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ ...s.btnPrimary, background: '#f3f4f6', color: '#4b5563', flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ ...s.btnPrimary, flex: 2, justifyContent: 'center' }}
                >
                  {editingTenant ? 'Save Changes' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
