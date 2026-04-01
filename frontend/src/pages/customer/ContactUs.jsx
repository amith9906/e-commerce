import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useBrand } from '../../context/BrandContext';

export default function ContactUs() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({});
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const [searchParams] = useSearchParams();
  const orderIdParam = searchParams.get('orderId');
  const { supportContacts = {} } = useBrand();
  const contactEmail = supportContacts.email || 'support@ecommerce.com';
  const contactPhone = supportContacts.phone || '+1 (555) 000-0000';

  useEffect(() => {
    const subject = searchParams.get('subject');
    const message = searchParams.get('message');
    const orderId = orderIdParam;

    if (subject) setValue('subject', subject);
    if (message) setValue('message', message);
    if (orderId && !message) {
      setValue('message', `Order reference: ${orderId}`);
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await api.post('/support', data);
      if (res.success) {
      toast.success(res.message || 'Message sent successfully!');
      reset();
      fetchHistory(1);
    }
  } catch (err) {
    toast.error('Failed to send message. Please try again.');
  } finally {
    setLoading(false);
  }
};

const fetchHistory = useCallback(async (page = 1) => {
  try {
    setHistoryLoading(true);
    const res = await api.get('/support/me', { params: { page, limit: 6 } });
    if (res.success) {
      setHistory(res.data);
      setHistoryPagination(res.pagination || {});
      setHistoryPage(page);
    }
  } catch (err) {
    toast.error(err.message || 'Unable to load support history.');
  } finally {
    setHistoryLoading(false);
  }
}, []);

useEffect(() => {
  fetchHistory(historyPage);
}, [fetchHistory]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>Contact Our Team</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.125rem' }}>
          Have a question about an order or want to give feedback? We're here to help you 24/7.
        </p>
        {orderIdParam && (
          <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', fontWeight: 600 }}>
            We pre-filled your order #{orderIdParam.split('-')[0]} for faster support.
          </p>
        )}
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
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{contactEmail}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>sales@ecommerce.com</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <Phone size={24} />
              </div>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>Call Us</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{contactPhone}</p>
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
      <div className="card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Your support history</h2>
        {historyLoading ? (
          <p>Loading past messages...</p>
        ) : history.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No previous messages. Submit one above and we will respond shortly.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map((item) => (
              <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{item.subject}</strong>
                  <span style={{ fontSize: '0.85rem', color: '#10b981' }}>{item.status}</span>
                </div>
                <p style={{ margin: '0 0 0.5rem', color: '#475569' }}>{item.message}</p>
                <small style={{ color: '#6b7280' }}>Submitted on {new Date(item.createdAt).toLocaleString()}</small>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#475569' }}>
              <div>Page {historyPage} of {historyPagination.pages || 1}</div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  onClick={() => fetchHistory(Math.max(1, historyPage - 1))}
                  disabled={historyPage <= 1}
                  className="btn-secondary"
                >Prev</button>
                <button
                  onClick={() => fetchHistory(historyPage + 1)}
                  disabled={historyPage >= (historyPagination.pages || 1)}
                  className="btn-secondary"
                >Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
