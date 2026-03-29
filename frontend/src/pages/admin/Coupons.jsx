import { useState, useEffect } from 'react';
import api from '../../api/client';
import { toast } from 'react-toastify';
import { Plus, Trash2, Calendar, Tag } from 'lucide-react';
import dayjs from 'dayjs';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderAmount: 0,
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().add(1, 'month').format('YYYY-MM-DD'),
    usageLimit: 100
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/coupons');
      if (res.success) setCoupons(res.data);
    } catch (err) {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/coupons', formData);
      if (res.success) {
        toast.success('Coupon created successfully');
        setShowAddForm(false);
        fetchCoupons();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await api.delete(`/coupons/${id}`);
      if (res.success) {
        toast.success('Coupon deleted');
        fetchCoupons();
      }
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Discount Coupons</h1>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} />
          {showAddForm ? 'Cancel' : 'Add Coupon'}
        </button>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Create New Coupon</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label className="label">Coupon Code</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="E.g. SUMMER10" 
                required 
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
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
              <label className="label">Min Order Amount ($)</label>
              <input 
                type="number" 
                className="input-field" 
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value})}
              />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>Create Coupon</button>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading coupons...</p>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '1rem 1.5rem' }}>Code</th>
                <th style={{ textAlign: 'left', padding: '1rem 1.5rem' }}>Discount</th>
                <th style={{ textAlign: 'left', padding: '1rem 1.5rem' }}>Validity</th>
                <th style={{ textAlign: 'center', padding: '1rem 1.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => (
                <tr key={coupon.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      <Tag size={16} color="var(--primary-color)" />
                      {coupon.code}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Min: ${coupon.minOrderAmount}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={14} />
                      {dayjs(coupon.startDate).format('MMM D')} - {dayjs(coupon.endDate).format('MMM D, YYYY')}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                    <button onClick={() => handleDelete(coupon.id)} style={{ color: '#ef4444' }}><Trash2 size={20} /></button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No coupons found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
