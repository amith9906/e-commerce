import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { storeName } = useBrand();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', data);
      if (res.success) {
        toast.success('Logged in successfully');
        login(res.token, res.user);
        if (res.user.role === 'admin' || res.user.role === 'superadmin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      if (err.message === 'Please verify your email first.') {
        toast.error('Email not verified. Redirecting to OTP page.');
        navigate('/verify-otp', { state: { userId: err.userId, email: data.email } });
      } else {
        toast.error(err.message || 'Login failed');
      }
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
            Welcome back
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Sign in to {storeName}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Mail size={16} />
              </div>
              <input
                {...register('email', { required: 'Email is required' })}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Lock size={16} />
              </div>
              <input
                {...register('password', { required: 'Password is required' })}
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="••••••••"
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

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
