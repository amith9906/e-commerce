import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, Eye, EyeOff, User, Zap } from 'lucide-react';
import api from '../../api/client';
import { useBrand } from '../../context/BrandContext';

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { storeName } = useBrand();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/register', data);
      if (res.success) {
        toast.success(res.message);
        navigate('/verify-otp', { state: { userId: res.userId, email: data.email } });
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', marginBottom: '1rem', boxShadow: '0 8px 24px rgba(79,70,229,0.3)' }}>
            <Zap size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.35rem' }}>
            Create account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Join {storeName} today
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <User size={16} />
              </div>
              <input
                {...register('name', { required: 'Name is required' })}
                type="text"
                className="input-field"
                placeholder="John Doe"
                style={{ paddingLeft: 38 }}
              />
            </div>
            {errors.name && <p className="error-text">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Mail size={16} />
              </div>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' }
                })}
                type="email"
                className="input-field"
                placeholder="you@example.com"
                style={{ paddingLeft: 38 }}
              />
            </div>
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Lock size={16} />
              </div>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'At least 6 characters' }
                })}
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Min. 6 characters"
                style={{ paddingLeft: 38, paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="error-text">{errors.password.message}</p>}
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
            By registering, you agree to our{' '}
            <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Terms of Service</a> and{' '}
            <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Privacy Policy</a>.
          </p>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: '0.25rem' }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
