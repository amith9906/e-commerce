import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';

export default function ContactUs() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await api.post('/support', data);
      if (res.success) {
        toast.success(res.message || 'Message sent successfully!');
        reset();
      }
    } catch (err) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>Contact Our Team</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.125rem' }}>
          Have a question about an order or want to give feedback? We're here to help you 24/7.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem' }}>
        {/* Contact Info */}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>Get in Touch</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                <Mail size={24} />
              </div>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>Email Us</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>support@ecommerce.com</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>sales@ecommerce.com</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <Phone size={24} />
              </div>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>Call Us</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>+1 (555) 000-0000</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Mon-Fri, 9am - 6pm EST</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#fff7ed', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                <MapPin size={24} />
              </div>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>Visit Us</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>123 Commerce St, Suite 100</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>New York, NY 10001</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Form */}
        <div className="card" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <MessageSquare size={20} color="var(--primary-color)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Send us a Message</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Your Name</label>
                <input 
                  {...register('name', { required: 'Name is required' })} 
                  className="input-field" 
                  placeholder="John Doe" 
                />
                {errors.name && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.name.message}</p>}
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
                <input 
                  {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })} 
                  className="input-field" 
                  placeholder="john@example.com" 
                />
                {errors.email && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Subject</label>
              <input 
                {...register('subject', { required: 'Subject is required' })} 
                className="input-field" 
                placeholder="How can we help?" 
              />
              {errors.subject && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.subject.message}</p>}
            </div>

            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Message</label>
              <textarea 
                {...register('message', { required: 'Message is required' })} 
                className="input-field" 
                rows="5" 
                placeholder="Tell us more about your inquiry..."
                style={{ resize: 'none' }}
              />
              {errors.message && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.message.message}</p>}
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1rem', fontWeight: 700 }}
            >
              {loading ? 'Sending...' : <><Send size={18} /> Send Message</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
