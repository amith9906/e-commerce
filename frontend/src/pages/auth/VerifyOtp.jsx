import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Shield } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

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
      if (res.success) toast.success(res.message);
    } catch (err) {
      toast.error(err.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(79,70,229,0.12), rgba(124,58,237,0.12))', border: '2px solid rgba(79,70,229,0.2)', marginBottom: '1rem' }}>
            <Shield size={30} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
            Check your email
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0, lineHeight: 1.6 }}>
            We sent a 6-digit code to{' '}
            <strong style={{ color: 'var(--text-body)' }}>{email}</strong>.<br />
            Enter it below to verify your account.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>Verification Code</label>
            <input
              {...register('otp', {
                required: 'Code is required',
                pattern: { value: /^\d{6}$/, message: 'Must be exactly 6 digits' }
              })}
              type="text"
              className="input-field"
              placeholder="000000"
              maxLength={6}
              style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, letterSpacing: '0.5rem', padding: '0.875rem' }}
            />
            {errors.otp && <p className="error-text" style={{ textAlign: 'center' }}>{errors.otp.message}</p>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        {/* Resend */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>
            Didn't receive the code?
          </p>
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              background: 'none', border: 'none', cursor: resending ? 'not-allowed' : 'pointer',
              color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', padding: 0,
              opacity: resending ? 0.6 : 1,
            }}
          >
            {resending ? 'Sending...' : 'Resend code'}
          </button>
        </div>

        {/* Email hint */}
        <div style={{ marginTop: '1.5rem', padding: '0.875rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Mail size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--primary)', margin: 0, lineHeight: 1.5 }}>
            Check your spam folder if you don't see the email within a few minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
