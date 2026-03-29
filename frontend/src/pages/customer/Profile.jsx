import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { User as UserIcon, MapPin, Mail } from 'lucide-react';

export default function Profile() {
  const { user, login } = useAuth(); // login function updates the contextual user too
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, setValue } = useForm();

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('email', user.email);
    }
    
    api.get('/users/me')
      .then(res => {
        if (res.success) {
          setAddresses(res.data.addresses || []);
        }
      })
      .finally(() => setLoading(false));
  }, [user, setValue]);

  const onUpdateProfile = async (data) => {
    try {
      const res = await api.put('/users/me', data);
      if (res.success) {
        toast.success('Profile updated');
        // Update auth context
        login(localStorage.getItem('token'), res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const res = await api.delete(`/users/addresses/${id}`);
      if (res.success) {
        toast.success('Address deleted');
        setAddresses(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      
      <div className="card" style={{ flex: '1 1 40%', minWidth: '300px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserIcon size={20} /> Personal Information
        </h2>
        
        <form onSubmit={handleSubmit(onUpdateProfile)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Full Name</label>
            <input {...register('name', { required: true })} className="input-field" />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Mail size={16} /> Email Address (Cannot change)
            </label>
            <input {...register('email')} className="input-field" disabled style={{ backgroundColor: '#f1f5f9', color: 'var(--text-muted)' }} />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem', alignSelf: 'flex-start' }}>
            Save Changes
          </button>
        </form>
      </div>

      <div className="card" style={{ flex: '1 1 50%', minWidth: '300px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={20} /> Saved Addresses
        </h2>

        {addresses.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No saved addresses. You can add one during checkout.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {addresses.map(addr => (
              <div key={addr.id} style={{ 
                padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '4px',
                position: 'relative'
              }}>
                {addr.isDefault && (
                  <span style={{ 
                    position: 'absolute', top: '-10px', right: '10px', 
                    background: 'var(--primary-color)', color: 'white', 
                    fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '999px', fontWeight: 600 
                  }}>
                    DEFAULT
                  </span>
                )}
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{addr.fullName}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {addr.addressLine1} <br />
                  {addr.city}, {addr.country} {addr.postalCode} <br />
                  {addr.phone && `Phone: ${addr.phone}`}
                </div>
                
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <button onClick={() => handleDeleteAddress(addr.id)} style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 500 }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
