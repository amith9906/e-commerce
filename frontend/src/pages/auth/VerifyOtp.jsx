import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Read state passed from Register or Login
  const { userId, email } = location.state || {};

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/verify-otp', { userId, otp: data.otp });
      
      if (res.success) {
        toast.success(res.message);
        login(res.token, res.user);
        navigate('/');
      }
    } catch (err) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      const res = await api.post('/auth/resend-otp', { userId });
      if (res.success) {
        toast.success(res.message);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', textAlign: 'center' }}>
        Verify your email
      </h1>
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.875rem' }}>
        We sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify your account.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>OTP Code</label>
          <input
            {...register('otp', { 
              required: 'Code is required',
              pattern: { value: /^\d{6}$/, message: 'Must be exactly 6 digits' } 
            })}
            type="text"
            className="input-field"
            placeholder="123456"
            maxLength={6}
            style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.5rem' }}
          />
          {errors.otp && <p className="error-text" style={{ textAlign: 'center' }}>{errors.otp.message}</p>}
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Didn't receive the code?{' '}
        <button 
          onClick={handleResend} 
          disabled={resending}
          style={{ fontWeight: 500, color: 'var(--primary-color)' }}>
          {resending ? 'Sending...' : 'Resend'}
        </button>
      </div>
    </div>
  );
}
