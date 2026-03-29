import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { useBrand } from '../../context/BrandContext';

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
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
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', textAlign: 'center' }}>
        Create an account
      </h1>
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
        Join {storeName} today.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Full Name</label>
          <input
            {...register('name', { required: 'Name is required' })}
            type="text"
            className="input-field"
            placeholder="John Doe"
          />
          {errors.name && <p className="error-text">{errors.name.message}</p>}
        </div>

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email</label>
          <input
            {...register('email', { 
              required: 'Email is required',
              pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' }
            })}
            type="email"
            className="input-field"
            placeholder="you@example.com"
          />
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
          <input
            {...register('password', { 
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' }
            })}
            type="password"
            className="input-field"
            placeholder="••••••••"
          />
          {errors.password && <p className="error-text">{errors.password.message}</p>}
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'Registering...' : 'Sign up'}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Already have an account? <Link to="/login" style={{ fontWeight: 500 }}>Log in</Link>
      </div>
    </div>
  );
}
