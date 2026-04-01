import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { useBrand } from '../../context/BrandContext';
import { Palette, Type, Upload, Sparkles } from 'lucide-react';

const SocialIcon = ({ type, size = 16 }) => {
  const commonProps = { width: size, height: size, fill: 'currentColor', ariaHidden: true };
  if (type === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" {...commonProps}>
        <path d="M13.5 6.5h2.5V3h-2.9c-3.2 0-4.1 1.5-4.1 4.3V9H6v3h2.1v9h3.5v-9h2.5l.4-3h-2.9V7c0-.5.4-.5.9-.5z" />
      </svg>
    );
  }
  if (type === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" {...commonProps} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <path d="M16 11.37a4 4 0 1 1-4.63-4.63 4 4 0 0 1 4.63 4.63z" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (type === 'youtube') {
    return (
      <svg viewBox="0 0 24 24" {...commonProps} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.8 8s-.2-1.4-.9-2c-.8-.8-1.7-.8-2.1-.9C16.9 5 12 5 12 5s-4.9 0-6.8.1c-.4 0-1.3.1-2.1.9-.7.6-.9 2-.9 2S2 9.8 2 11.7v.6c0 1.9.1 3.7.1 3.7s.2 1.4.9 2c.8.8 1.8.8 2.2.9 1.6.1 6.8.1 6.8.1s4.9 0 6.8-.1c.4 0 1.3-.1 2.1-.9.7-.6.9-2 .9-2s.1-1.8.1-3.7v-.6c0-1.9-.1-3.7-.1-3.7z" />
        <polygon points="10 14.5 16 12 10 9.5 10 14.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return null;
};

export default function BrandSettings() {
  const { register, handleSubmit, setValue } = useForm();
  const [loading, setLoading] = useState(false);
  const { storeName, primaryColor, logoUrl, socialLinks } = useBrand();

  useEffect(() => {
    // Populate form with current context values
    setValue('storeName', storeName);
    setValue('primaryColor', primaryColor || '#3b82f6');
    setValue('facebookUrl', socialLinks?.facebookUrl || '');
    setValue('instagramUrl', socialLinks?.instagramUrl || '');
    setValue('youtubeUrl', socialLinks?.youtubeUrl || '');
    setValue('showFacebook', socialLinks?.showFacebook || false);
    setValue('showInstagram', socialLinks?.showInstagram || false);
    setValue('showYoutube', socialLinks?.showYoutube || false);
  }, [storeName, primaryColor, socialLinks, setValue]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      if (data.storeName) formData.append('storeName', data.storeName);
      if (data.primaryColor) formData.append('primaryColor', data.primaryColor);
      if (data.logo && data.logo[0]) formData.append('logo', data.logo[0]);
      const socialLinksPayload = {
        facebookUrl: data.facebookUrl?.trim() || '',
        instagramUrl: data.instagramUrl?.trim() || '',
        youtubeUrl: data.youtubeUrl?.trim() || '',
        showFacebook: Boolean(data.showFacebook),
        showInstagram: Boolean(data.showInstagram),
        showYoutube: Boolean(data.showYoutube),
      };
      formData.append('socialLinks', JSON.stringify(socialLinksPayload));

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

          <div style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '10px', border: '1px dashed var(--border-color)', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Sparkles size={18} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Social Links</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Enable any social channels that should appear in the storefront footer.</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 4 }}>
                  <SocialIcon type="facebook" />
                  Facebook URL
                </div>
                <input {...register('facebookUrl')} type="url" className="input-field" placeholder="https://facebook.com/your-store" />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 0.5, fontSize: '0.85rem' }}>
                  <input {...register('showFacebook')} type="checkbox" />
                  Show Facebook link
                </label>
              </label>
              <label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 4 }}>
                  <SocialIcon type="instagram" />
                  Instagram URL
                </div>
                <input {...register('instagramUrl')} type="url" className="input-field" placeholder="https://instagram.com/your-store" />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 0.5, fontSize: '0.85rem' }}>
                  <input {...register('showInstagram')} type="checkbox" />
                  Show Instagram link
                </label>
              </label>
              <label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 4 }}>
                  <SocialIcon type="youtube" />
                  YouTube URL
                </div>
                <input {...register('youtubeUrl')} type="url" className="input-field" placeholder="https://youtube.com/your-channel" />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 0.5, fontSize: '0.85rem' }}>
                  <input {...register('showYoutube')} type="checkbox" />
                  Show YouTube link
                </label>
              </label>
            </div>
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
