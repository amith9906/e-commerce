import { useState, useEffect } from 'react';
import api from '../../api/client';
import { toast } from 'react-toastify';
import { Plus, Trash2, Zap } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { useBrand } from '../../context/BrandContext';

const initialFormState = {
  name: '',
  description: '',
  discountType: 'percentage',
  discountValue: 0,
  conditionValue: 5000,
  validFrom: '',
  validTo: '',
  isActive: true
};

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const { currency = 'INR' } = useBrand();

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const res = await api.get('/promotions');
      if (res.success) setPromotions(res.data);
    } catch (err) {
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const formatPromoDate = (value) =>
    value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : null;

  const getPromoStatus = (promo) => {
    const now = new Date();
    const start = promo.validFrom ? new Date(promo.validFrom) : null;
    const end = promo.validTo ? new Date(promo.validTo) : null;
    if (start && start > now) return 'upcoming';
    if (end && end < now) return 'expired';
    return 'active';
  };

  const statusStyles = {
    active: { background: '#dcfce7', color: '#166534' },
    upcoming: { background: '#fef9c3', color: '#92400e' },
    expired: { background: '#fee2e2', color: '#991b1b' }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (formData.validFrom && formData.validTo && new Date(formData.validTo) < new Date(formData.validFrom)) {
      toast.error('End date must be after the start date');
      return;
    }

    try {
      const payload = {
        ...formData,
        conditionValue: Number(formData.conditionValue),
        discountValue: Number(formData.discountValue),
        validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : null,
        validTo: formData.validTo ? new Date(formData.validTo).toISOString() : null
      };
      const res = await api.post('/promotions', payload);
      if (res.success) {
        toast.success('Promotion created successfully');
        setShowAddForm(false);
        fetchPromotions();
        setFormData({ ...initialFormState });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create promotion');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) return;
    try {
      const res = await api.delete(`/promotions/${id}`);
      if (res.success) {
        toast.success('Promotion deleted');
        fetchPromotions();
      }
    } catch (err) {
      toast.error('Failed to delete promotion');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Automatic Promotions</h1>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} />
          {showAddForm ? 'Cancel' : 'Add Promotion'}
        </button>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Create New Promotion</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="label">Promotion Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="E.g. High Volume Discount" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="label">Description</label>
              <textarea 
                className="input-field" 
                placeholder="Details of the offer..." 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div>
              <label className="label">Discount Type</label>
              <select 
                className="input-field" 
                value={formData.discountType}
                onChange={(e) => setFormData({...formData, discountType: e.target.value})}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="label">Discount Value</label>
              <input 
                type="number" 
                className="input-field" 
                required 
                value={formData.discountValue}
                onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
              />
            </div>
            <div>
              <label className="label">Minimum Order ({currency})</label>
              <input 
                type="number" 
                className="input-field" 
                required 
                min="0"
                step="1"
                value={formData.conditionValue}
                onChange={(e) => setFormData({...formData, conditionValue: e.target.value})}
              />
            </div>
            <div>
              <label className="label">Starts (optional)</label>
              <input
                type="datetime-local"
                className="input-field"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Ends (optional)</label>
              <input
                type="datetime-local"
                className="input-field"
                value={formData.validTo}
                onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2', marginTop: '1rem' }}>Create Promotion</button>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading promotions...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {promotions.map((promo) => {
            const status = getPromoStatus(promo);
            const statusLabel = `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
            const scheduleStyle = statusStyles[status] || statusStyles.active;
            const startsAt = promo.validFrom ? `Starts ${formatPromoDate(promo.validFrom)}` : 'Starts immediately';
            const endsAt = promo.validTo ? `Ends ${formatPromoDate(promo.validTo)}` : 'No end date';
            const discountDisplay =
              promo.discountType === 'percentage'
                ? `${promo.discountValue ?? 0}%`
                : formatCurrency(promo.discountValue ?? 0, currency);
            return (
              <div key={promo.id} className="card" style={{ borderLeft: promo.isActive ? '4px solid #10b981' : '4px solid #94a3b8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: promo.isActive ? '#10b981' : 'var(--text-muted)' }}>
                    <Zap size={20} fill={promo.isActive ? '#10b981' : 'none'} />
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>{promo.name}</span>
                  </div>
                  <button onClick={() => handleDelete(promo.id)} style={{ color: '#ef4444' }}><Trash2 size={18} /></button>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{promo.description}</p>
                <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '4px', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Discount:</span>
                    <span style={{ fontWeight: 600 }}>{discountDisplay}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Condition:</span>
                    <span style={{ fontWeight: 600 }}>Spend {formatCurrency(promo.conditionValue || 0, currency)}+</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        ...scheduleStyle,
                        borderRadius: '999px',
                        padding: '0.2rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}
                    >
                      {statusLabel}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem', color: '#475569' }}>
                      <span>{startsAt}</span>
                      <span>{endsAt}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {promotions.length === 0 && (
            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No automatic promotions configured yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
