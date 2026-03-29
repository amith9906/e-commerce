import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
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
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', textAlign: 'center' }}>
        Log in to {storeName}
      </h1>
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
        Welcome back! Please enter your details.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email</label>
          <input
            {...register('email', { required: 'Email is required' })}
            type="email"
            className="input-field"
            placeholder="you@example.com"
          />
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
          <input
            {...register('password', { required: 'Password is required' })}
            type="password"
            className="input-field"
            placeholder="••••••••"
          />
          {errors.password && <p className="error-text">{errors.password.message}</p>}
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Don't have an account? <Link to="/register" style={{ fontWeight: 500 }}>Sign up</Link>
      </div>
    </div>
  );
}
