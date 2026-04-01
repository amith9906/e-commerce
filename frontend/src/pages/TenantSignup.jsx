import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Store, User, Lock, Globe, CheckCircle, ArrowRight, ArrowLeft, Zap, Sparkles } from 'lucide-react';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const STEPS = [
  { id: 'plan', title: 'Choose Plan', icon: CheckCircle },
  { id: 'store', title: 'Store Details', icon: Store },
  { id: 'account', title: 'Your Account', icon: User },
  { id: 'verify', title: 'Verify Email', icon: Lock },
];

export default function TenantSignup() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(searchParams.get('plan') ? 1 : 0);
  const [selectedPlan, setSelectedPlan] = useState(searchParams.get('plan') || 'free');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [tenantSlug, setTenantSlug] = useState('');
  const navigate = useNavigate();

  const storeForm = useForm();
  const accountForm = useForm();
  const otpForm = useForm();

  useEffect(() => {
    axios.get(`${BASE_URL}/saas/plans`)
      .then(r => setPlans(r.data.data || []))
      .catch(() => {});
  }, []);

  const slugify = (val) => val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const handleStoreSubmit = storeForm.handleSubmit(async (data) => {
    const slug = slugify(data.storeName);
    storeForm.setValue('slug', slug);
    setTenantSlug(slug);
    setStep(2);
  });

  const handleAccountSubmit = accountForm.handleSubmit(async (data) => {
    setLoading(true);
    try {
      const storeData = storeForm.getValues();
      const slug = slugify(storeData.storeName);

      const res = await axios.post(`${BASE_URL}/saas/signup`, {
        storeName: storeData.storeName,
        slug,
        adminName: data.name,
        adminEmail: data.email,
        adminPassword: data.password,
        plan: selectedPlan,
      });

      setUserId(res.data.userId);
      setTenantSlug(res.data.slug);
      setStep(3);
      toast.success('Store created! Check your email for the verification code.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  const handleOtpSubmit = otpForm.handleSubmit(async (data) => {
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/auth/verify-otp`, { userId, otp: data.otp });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('tenantSlug', tenantSlug);
      toast.success('Email verified! Welcome to your store.');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  const planColors = {
    free: '#6b7280',
    starter: '#3b82f6',
    growth: '#8b5cf6',
    enterprise: '#f59e0b',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      {/* Logo */}
      <Link to="/landing" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, textDecoration: 'none' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #818cf8, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={20} color="#fff" />
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>ShopFlow</span>
      </Link>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: 0 }}>Create Your Store</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 6, fontSize: '0.95rem' }}>Get your e-commerce store running in minutes</p>
      </div>

      {/* Step Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                transition: 'all 0.3s',
                background: i < step ? '#22c55e' : i === step ? '#4f46e5' : 'rgba(255,255,255,0.1)',
                color: i <= step ? '#fff' : 'rgba(255,255,255,0.4)',
                border: i === step ? '2px solid rgba(255,255,255,0.3)' : '2px solid transparent',
                boxShadow: i === step ? '0 0 20px rgba(79,70,229,0.5)' : 'none',
              }}>
                {i < step ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span style={{ fontSize: 10, color: i === step ? '#a5b4fc' : 'rgba(255,255,255,0.3)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {s.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 48, height: 2, background: i < step ? '#22c55e' : 'rgba(255,255,255,0.1)', margin: '0 4px', marginBottom: 18, transition: 'all 0.3s' }} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: '2rem',
        width: '100%',
        maxWidth: 520,
      }}>
        {/* Card Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          {step > 0 && step < 3 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>{STEPS[step].title}</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Step {step + 1} of {STEPS.length}</p>
          </div>
        </div>

        {/* Step 0: Plan Selection */}
        {step === 0 && (
          <div>
            <div style={{ display: 'grid', gap: 10 }}>
              {plans.map(p => (
                <label
                  key={p.key}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    padding: '14px 16px',
                    border: `2px solid ${selectedPlan === p.key ? '#4f46e5' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: selectedPlan === p.key ? 'rgba(79,70,229,0.15)' : 'rgba(255,255,255,0.03)',
                    transition: 'all 0.2s',
                  }}
                >
                  <input type="radio" name="plan" value={p.key} checked={selectedPlan === p.key} onChange={() => setSelectedPlan(p.key)} style={{ marginTop: 3, accentColor: '#4f46e5' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{p.name}</span>
                        {p.key === 'growth' && (
                          <span style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>POPULAR</span>
                        )}
                      </div>
                      <span style={{ fontWeight: 700, color: '#a5b4fc', fontSize: 15 }}>
                        {p.price === 0 ? 'Free' : `$${p.price}/mo`}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                      {p.limits.products === 1e308 ? 'Unlimited' : p.limits.products} products &bull;{' '}
                      {p.limits.stores === 1e308 ? 'Unlimited' : p.limits.stores} store{p.limits.stores !== 1 ? 's' : ''} &bull;{' '}
                      {p.limits.users === 1e308 ? 'Unlimited' : p.limits.users} users
                    </div>
                    {p.price > 0 && <div style={{ fontSize: 11, color: '#4ade80', marginTop: 3, fontWeight: 600 }}>14-day free trial included</div>}
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              style={{
                width: '100%', marginTop: 20, padding: '13px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
              }}
            >
              Continue with {plans.find(p => p.key === selectedPlan)?.name || selectedPlan} <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 1: Store Details */}
        {step === 1 && (
          <form onSubmit={handleStoreSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                Store Name *
              </label>
              <input
                {...storeForm.register('storeName', { required: 'Store name is required' })}
                placeholder="My Awesome Store"
                style={{
                  width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 15,
                  outline: 'none', boxSizing: 'border-box', color: '#fff',
                }}
              />
              {storeForm.formState.errors.storeName && (
                <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{storeForm.formState.errors.storeName.message}</p>
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                Store URL Preview
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.08)', fontSize: 14 }}>
                <Globe size={15} color="rgba(255,255,255,0.4)" />
                <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{slugify(storeForm.watch('storeName') || '') || 'your-store'}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>.yoursaas.com</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>Connect a custom domain later from settings.</p>
            </div>
            <button
              type="submit"
              style={{
                width: '100%', padding: '13px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(79,70,229,0.4)', marginTop: 4,
              }}
            >
              Continue <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Step 2: Account Details */}
        {step === 2 && (
          <form onSubmit={handleAccountSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              { label: 'Your Full Name *', name: 'name', type: 'text', placeholder: 'Jane Smith', rules: { required: 'Name is required' } },
              { label: 'Email Address *', name: 'email', type: 'email', placeholder: 'jane@example.com', rules: { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } } },
              { label: 'Password *', name: 'password', type: 'password', placeholder: 'Min. 8 characters', rules: { required: 'Password is required', minLength: { value: 8, message: 'At least 8 characters' } } },
            ].map(field => (
              <div key={field.name}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                  {field.label}
                </label>
                <input
                  {...accountForm.register(field.name, field.rules)}
                  type={field.type}
                  placeholder={field.placeholder}
                  style={{
                    width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)',
                    border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 15,
                    outline: 'none', boxSizing: 'border-box', color: '#fff',
                  }}
                />
                {accountForm.formState.errors[field.name] && (
                  <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{accountForm.formState.errors[field.name].message}</p>
                )}
              </div>
            ))}
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              By continuing, you agree to our <a href="#" style={{ color: '#a5b4fc', textDecoration: 'none' }}>Terms of Service</a> and{' '}
              <a href="#" style={{ color: '#a5b4fc', textDecoration: 'none' }}>Privacy Policy</a>.
            </p>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
              }}
            >
              {loading ? 'Creating store...' : <><span>Create My Store</span><ArrowRight size={16} /></>}
            </button>
          </form>
        )}

        {/* Step 3: OTP Verification */}
        {step === 3 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))',
                border: '2px solid rgba(34,197,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <Lock size={30} color="#4ade80" />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                We sent a 6-digit code to your email.<br />Enter it below to activate your store.
              </p>
            </div>
            <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
                  Verification Code
                </label>
                <input
                  {...otpForm.register('otp', { required: 'OTP is required', minLength: { value: 6, message: 'Must be 6 digits' } })}
                  placeholder="000000"
                  maxLength={6}
                  style={{
                    width: '100%', padding: '14px', background: 'rgba(255,255,255,0.06)',
                    border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 8,
                    textAlign: 'center', fontSize: 28, fontWeight: 700, letterSpacing: 10,
                    color: '#fff', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {otpForm.formState.errors.otp && (
                  <p style={{ color: '#f87171', fontSize: 12, marginTop: 4, textAlign: 'center' }}>{otpForm.formState.errors.otp.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '13px', background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 20px rgba(34,197,94,0.3)',
                }}
              >
                {loading ? 'Verifying...' : <><Sparkles size={16} /> Verify & Open Store</>}
              </button>
            </form>
          </div>
        )}
      </div>

      <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
      </p>
    </div>
  );
}
