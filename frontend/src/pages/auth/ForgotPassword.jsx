import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, Eye, EyeOff, CheckCircle, KeyRound } from 'lucide-react';
import api from '../../api/client';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [codeSentAt, setCodeSentAt] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const newPasswordValue = watch('newPassword');

  const handleRequestCode = async (data) => {
    try {
      setLoading(true);
      await api.post('/auth/forgot-password', { email: data.email });
      setEmail(data.email);
      setCodeSentAt(new Date());
      toast.success('Check your inbox for the reset code.');
      setStep(2);
    } catch (err) {
      toast.error(err.message || 'Unable to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (data) => {
    try {
      setLoading(true);
      await api.post('/auth/reset-password', {
        email: email || data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      toast.success('Password reset. You can now log in.');
      setStep(3);
    } catch (err) {
      toast.error(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const inputIcon = (icon) => ({
    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
    color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none',
  });

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 14, background: step === 3 ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)', marginBottom: '1rem', boxShadow: step === 3 ? '0 8px 24px rgba(34,197,94,0.3)' : '0 8px 24px rgba(79,70,229,0.3)' }}>
            {step === 3 ? <CheckCircle size={26} color="#fff" /> : <KeyRound size={26} color="#fff" />}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.35rem' }}>
            {step === 1 ? 'Reset password' : step === 2 ? 'Set new password' : 'All done!'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            {step === 1 && "We'll send a verification code to your email."}
            {step === 2 && `Code sent to ${email}${codeSentAt ? ` at ${codeSentAt.toLocaleTimeString()}` : ''}.`}
            {step === 3 && 'Your password has been reset successfully.'}
          </p>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: '1.5rem', justifyContent: 'center' }}>
            {[1, 2].map(s => (
              <div key={s} style={{ height: 4, width: 40, borderRadius: 2, background: s <= step ? 'var(--primary)' : 'var(--border)', transition: 'background 0.3s' }} />
            ))}
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={handleSubmit(handleRequestCode)} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <div style={{ position: 'relative' }}>
                <div style={inputIcon()}><Mail size={16} /></div>
                <input
                  {...register('email', { required: 'Email is required', pattern: /^\S+@\S+$/i })}
                  className="input-field"
                  type="email"
                  placeholder="you@example.com"
                  style={{ paddingLeft: 38 }}
                />
              </div>
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
              {loading ? 'Sending code...' : 'Send verification code'}
            </button>
            <p style={{ fontSize: '0.875rem', textAlign: 'center', color: 'var(--text-muted)', margin: 0 }}>
              Remembered it?{' '}
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Back to login</Link>
            </p>
          </form>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={handleSubmit(handleReset)} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>Verification Code</label>
              <input
                {...register('otp', { required: 'Code is required', minLength: 6, maxLength: 6 })}
                className="input-field"
                placeholder="000000"
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '0.4rem' }}
              />
              {errors.otp && <p className="error-text" style={{ textAlign: 'center' }}>{errors.otp.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <div style={inputIcon()}><Lock size={16} /></div>
                <input
                  {...register('newPassword', { required: 'New password required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Min. 6 characters"
                  style={{ paddingLeft: 38, paddingRight: 42 }}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.newPassword && <p className="error-text">{errors.newPassword.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <div style={inputIcon()}><Lock size={16} /></div>
                <input
                  {...register('confirmPassword', {
                    required: 'Confirm your password',
                    validate: (value) => value === newPasswordValue || 'Passwords must match',
                  })}
                  type={showConfirm ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  style={{ paddingLeft: 38, paddingRight: 42 }}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="error-text">{errors.confirmPassword.message}</p>}
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <p style={{ fontSize: '0.875rem', textAlign: 'center', color: 'var(--text-muted)', margin: 0 }}>
              Didn't get a code?{' '}
              <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: 'inherit', padding: 0 }}>
                Resend
              </button>
            </p>
          </form>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.08))', border: '2px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={30} color="#22c55e" />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              All set! You can now sign in with your new password.
            </p>
            <Link to="/login" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
              Return to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
