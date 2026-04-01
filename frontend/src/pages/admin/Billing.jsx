import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CreditCard, CheckCircle, AlertTriangle, ArrowUpCircle, ExternalLink, XCircle } from 'lucide-react';
import api from '../../api/client';

const PLAN_COLORS = { free: '#6b7280', starter: '#3b82f6', growth: '#8b5cf6', enterprise: '#f59e0b' };
const PLAN_BADGES = { free: '#f3f4f6', starter: '#eff6ff', growth: '#f5f3ff', enterprise: '#fffbeb' };

export default function Billing() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === '1') {
      toast.success(`Plan upgraded to ${searchParams.get('plan') || 'new plan'}!`);
    }
    if (searchParams.get('cancelled') === '1') {
      toast.info('Checkout cancelled.');
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subRes, planRes] = await Promise.all([
        api.get('/saas/subscription'),
        api.get('/saas/plans'),
      ]);
      setData(subRes.data);
      setPlans(planRes.data || []);
    } catch {
      toast.error('Failed to load billing information.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan) => {
    setUpgrading(plan);
    try {
      const res = await api.post('/saas/checkout', { plan });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      toast.error(err.message || 'Failed to start checkout.');
    } finally {
      setUpgrading(null);
    }
  };

  const handlePortal = async () => {
    try {
      const res = await api.post('/saas/portal');
      if (res.data?.url) window.location.href = res.data.url;
    } catch {
      toast.error('Failed to open billing portal.');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure? Your store will be downgraded to the Free plan immediately.')) return;
    setCancelling(true);
    try {
      await api.post('/saas/cancel');
      toast.success('Subscription cancelled.');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel subscription.');
    } finally {
      setCancelling(false);
    }
  };

  const s = {
    page: { padding: '2rem' },
    heading: { fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 },
    card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 20 },
    planBadge: (plan) => ({ display: 'inline-block', padding: '4px 12px', borderRadius: 20, background: PLAN_BADGES[plan] || '#f3f4f6', color: PLAN_COLORS[plan] || '#374151', fontWeight: 700, fontSize: 13 }),
    statusBadge: (status) => {
      const colors = { active: ['#f0fdf4', '#15803d'], trialing: ['#eff6ff', '#1d4ed8'], past_due: ['#fff7ed', '#c2410c'], cancelled: ['#fef2f2', '#b91c1c'] };
      const [bg, color] = colors[status] || ['#f3f4f6', '#374151'];
      return { display: 'inline-block', padding: '4px 12px', borderRadius: 20, background: bg, color, fontWeight: 600, fontSize: 13 };
    },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 },
    planCard: (isCurrent, isPopular) => ({
      border: `2px solid ${isCurrent ? '#22c55e' : isPopular ? '#8b5cf6' : '#e5e7eb'}`,
      borderRadius: 12,
      padding: 20,
      background: isCurrent ? '#f0fdf4' : '#fff',
      position: 'relative',
    }),
    btn: { padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
    btnPrimary: { background: '#4f46e5', color: '#fff' },
    btnDanger: { background: '#fff', color: '#ef4444', border: '1.5px solid #fca5a5' },
  };

  if (loading) return <div style={s.page}>Loading billing information...</div>;

  const { subscription, plan: currentPlan, isMockMode } = data || {};
  const currentPlanKey = currentPlan?.key || 'free';

  return (
    <div style={s.page}>
      <h1 style={s.heading}>Billing & Subscription</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Manage your plan, billing, and subscription settings.</p>

      {isMockMode && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertTriangle size={16} color="#d97706" />
          <span style={{ fontSize: 14 }}>Running in <strong>mock mode</strong> — Stripe is not configured. Plan upgrades are simulated.</span>
        </div>
      )}

      {/* Current plan card */}
      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <CreditCard size={20} color="#4f46e5" />
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Current Plan</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
              <span style={s.planBadge(currentPlanKey)}>{currentPlan?.name || 'Free'}</span>
              {subscription && <span style={s.statusBadge(subscription.status)}>{subscription.status}</span>}
            </div>
            {subscription?.currentPeriodEnd && (
              <p style={{ fontSize: 13, color: '#666' }}>
                {subscription.status === 'trialing' ? 'Trial ends' : 'Renews'}: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
            {currentPlanKey === 'free' && <p style={{ fontSize: 13, color: '#666' }}>Free plan — upgrade to unlock more features.</p>}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {currentPlanKey !== 'free' && subscription?.stripeCustomerId && (
              <button onClick={handlePortal} style={{ ...s.btn, background: '#f3f4f6', color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ExternalLink size={14} /> Manage Billing
              </button>
            )}
            {subscription?.status === 'active' && currentPlanKey !== 'free' && (
              <button onClick={handleCancel} disabled={cancelling} style={{ ...s.btn, ...s.btnDanger, display: 'flex', alignItems: 'center', gap: 6 }}>
                <XCircle size={14} /> {cancelling ? 'Cancelling...' : 'Cancel Plan'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Plan comparison */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, marginTop: 8 }}>Available Plans</h2>
      <div style={s.grid}>
        {plans.map(plan => {
          const isCurrent = plan.key === currentPlanKey;
          const isPopular = plan.key === 'growth';
          const isDowngrade = ['free', 'starter', 'growth', 'enterprise'].indexOf(plan.key) < ['free', 'starter', 'growth', 'enterprise'].indexOf(currentPlanKey);

          return (
            <div key={plan.key} style={s.planCard(isCurrent, isPopular)}>
              {isCurrent && (
                <div style={{ position: 'absolute', top: -12, right: 12, background: '#22c55e', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
                  Current
                </div>
              )}
              {isPopular && !isCurrent && (
                <div style={{ position: 'absolute', top: -12, right: 12, background: '#8b5cf6', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
                  Popular
                </div>
              )}
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{plan.name}</h3>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 12, color: PLAN_COLORS[plan.key] }}>
                {plan.price === 0 ? 'Free' : `$${plan.price}`}
                {plan.price > 0 && <span style={{ fontSize: 13, fontWeight: 400, color: '#888' }}>/mo</span>}
              </div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 16 }}>
                <div>{plan.limits.products === 1e308 ? 'Unlimited' : plan.limits.products} products</div>
                <div>{plan.limits.stores === 1e308 ? 'Unlimited' : plan.limits.stores} stores</div>
                <div>{plan.limits.users === 1e308 ? 'Unlimited' : plan.limits.users} team members</div>
              </div>

              {isCurrent ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontSize: 13, fontWeight: 600 }}>
                  <CheckCircle size={14} /> Your Current Plan
                </div>
              ) : isDowngrade ? (
                <button onClick={() => handleUpgrade(plan.key)} style={{ ...s.btn, width: '100%', background: '#f3f4f6', color: '#374151' }}>
                  Downgrade
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={upgrading === plan.key}
                  style={{ ...s.btn, ...s.btnPrimary, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  {upgrading === plan.key ? 'Redirecting...' : <><ArrowUpCircle size={14} /> {plan.price === 0 ? 'Downgrade to Free' : `Upgrade to ${plan.name}`}</>}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
