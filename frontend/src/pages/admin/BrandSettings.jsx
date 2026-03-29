import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { useBrand } from '../../context/BrandContext';
import { Palette, Type, Upload } from 'lucide-react';

export default function BrandSettings() {
  const { register, handleSubmit, setValue } = useForm();
  const [loading, setLoading] = useState(false);
  const { storeName, primaryColor, logoUrl } = useBrand();

  useEffect(() => {
    // Populate form with current context values
    setValue('storeName', storeName);
    setValue('primaryColor', primaryColor || '#3b82f6');
  }, [storeName, primaryColor, setValue]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      if (data.storeName) formData.append('storeName', data.storeName);
      if (data.primaryColor) formData.append('primaryColor', data.primaryColor);
      if (data.logo && data.logo[0]) formData.append('logo', data.logo[0]);

      const res = await api.put('/brand', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.success) {
        toast.success(res.message);
        // Force a reload to apply new CSS variables / Context globally 
        // A better approach in a real app would be to update context state directly
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update brand settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>Brand Settings</h1>
      
      <div className="card">
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Customize the look and feel of your storefront. Changes apply immediately to all customers.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, marginBottom: '0.5rem' }}>
              <Type size={18} /> Store Name
            </label>
            <input
              {...register('storeName', { required: 'Store name is required' })}
              type="text"
              className="input-field"
              placeholder="My Awesome Store"
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, marginBottom: '0.5rem' }}>
              <Palette size={18} /> Primary Theme Color
            </label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                {...register('primaryColor')}
                type="color"
                style={{ width: '50px', height: '40px', padding: 0, cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              />
              <span style={{ color: 'var(--text-muted)' }}>Select the main brand color for buttons, links, etc.</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, marginBottom: '0.5rem' }}>
              <Upload size={18} /> Logo Upload
            </label>
            <input
              {...register('logo')}
              type="file"
              accept="image/*"
              className="input-field"
              style={{ padding: '0.25rem' }}
            />
            {logoUrl && (
              <div style={{ marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Current logo:</span>
                <img src={logoUrl} alt="Logo" style={{ height: '40px', marginTop: '0.25rem', display: 'block' }} />
              </div>
            )}
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
              Upload a transparent PNG or SVG logo for the header.
            </span>
          </div>

          <div style={{ marginTop: '1rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Live Preview
            </h3>
            <button type="button" className="btn-primary" style={{ cursor: 'default' }}>
              Primary Button Preview
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Brand Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
