import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, Zap, Store, BarChart3, Shield, Globe, Users,
  ArrowRight, Star, Package, Truck, CreditCard, ChevronRight,
} from 'lucide-react';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function Landing() {
  const [plans, setPlans] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${BASE_URL}/saas/plans`).then(r => setPlans(r.data.data || [])).catch(() => {});
  }, []);

  const featureLabel = (key) => ({
    analytics: 'Advanced Analytics', customDomain: 'Custom Domain',
    auditLogs: 'Audit Logs', coupons: 'Coupons & Discounts',
    promotions: 'Promotions', invoiceTemplates: 'Invoice Templates',
    commissions: 'Sales Commissions', multiStore: 'Multi-Store',
    prioritySupport: 'Priority Support', dataExport: 'Data Export',
    apiAccess: 'API Access', apiKeyManagement: 'API Keys',
    outboundWebhooks: 'Webhooks', emailTemplates: 'Email Templates', sso: 'SSO Login',
  }[key] || key);

  const features = [
    { icon: Store, title: 'Multi-Store Management', desc: 'Run multiple locations with unified inventory, orders, and analytics across all your stores.', color: '#6366f1' },
    { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Revenue dashboards, sales trends, and product performance metrics updated live.', color: '#8b5cf6' },
    { icon: Shield, title: 'Audit Logs', desc: 'Complete activity history — every admin action logged with timestamp and user context.', color: '#ec4899' },
    { icon: Globe, title: 'Custom Domains', desc: 'Your brand, your URL. Connect your own domain with automatic SSL.', color: '#06b6d4' },
    { icon: Users, title: 'Team & Roles', desc: 'Admin, store manager, salesperson — fine-grained access control for your entire team.', color: '#10b981' },
    { icon: CreditCard, title: 'Flexible Payments', desc: 'Stripe, UPI, QR codes, or bring your own gateway via our pluggable architecture.', color: '#f59e0b' },
    { icon: Truck, title: 'Delivery Zones', desc: 'Set up delivery regions with custom pricing, restrictions, and coverage areas.', color: '#ef4444' },
    { icon: Package, title: 'Smart Inventory', desc: 'Track stock across locations, transfers, thresholds, and automated low-stock alerts.', color: '#3b82f6' },
  ];

  const testimonials = [
    { name: 'Sarah K.', role: 'Founder, Bloom Boutique', avatar: 'S', text: 'Switched from 3 separate tools to this one platform. Setup took an afternoon, not weeks.', rating: 5 },
    { name: 'Ravi M.', role: 'Operations Lead, TechGear', avatar: 'R', text: 'The multi-store inventory management alone saves us 6+ hours a week. Incredible product.', rating: 5 },
    { name: 'Priya J.', role: 'CEO, StyleHouse', avatar: 'P', text: 'The analytics dashboard gives me everything I need at a glance. Our team loves it.', rating: 5 },
  ];

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#111' }}>

      {/* ── Nav bar for landing ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,12,41,.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <span style={{ fontWeight: 800, fontSize: '1.125rem', color: '#fff', letterSpacing: '-0.02em' }}>ShopSaaS</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => navigate('/login')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.2)', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Sign in</button>
            <button onClick={() => navigate('/get-started')} style={{ background: '#4f46e5', border: 'none', color: '#fff', padding: '7px 18px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Get started free</button>
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <section style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', color: '#fff', padding: 'clamp(4rem,10vw,7rem) 1.5rem clamp(3rem,8vw,6rem)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background mesh */}
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,.3) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '50%', height: '50%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,.25) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,.2)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 100, padding: '5px 14px', marginBottom: 24, fontSize: 13, fontWeight: 600, color: '#a5b4fc' }}>
            <Zap size={13} /> Launch your store in minutes
          </div>

          <h1 style={{ fontSize: 'clamp(2.25rem,6vw,4rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.04em', marginBottom: 20, background: 'linear-gradient(135deg,#fff 30%,rgba(255,255,255,.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            The Modern SaaS Platform<br />for Commerce Teams
          </h1>

          <p style={{ fontSize: 'clamp(1rem,2vw,1.2rem)', color: 'rgba(255,255,255,.7)', maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Products, orders, inventory, payments, multi-store, analytics, commissions — everything in one beautifully designed platform.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/get-started')} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 24px rgba(79,70,229,.5)' }}>
              Start free — no card needed <ArrowRight size={18} />
            </button>
            <button onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })} style={{ background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, padding: '14px 28px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
              View pricing
            </button>
          </div>

          <p style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,.4)' }}>14-day free trial on paid plans · No credit card required</p>
        </div>

        {/* Stats strip */}
        <div style={{ maxWidth: 700, margin: '4rem auto 0', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
          {[['10,000+', 'Stores Powered'], ['99.9%', 'Uptime SLA'], ['4.9★', 'Customer Rating']].map(([val, lbl]) => (
            <div key={lbl} style={{ padding: '1.25rem', background: 'rgba(255,255,255,.06)', borderRadius: 12, border: '1px solid rgba(255,255,255,.1)' }}>
              <div style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, color: '#fff' }}>{val}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginTop: 4 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: 'clamp(3rem,8vw,5rem) 1.5rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem,4vw,3.5rem)' }}>
            <div style={{ display: 'inline-block', background: '#eef2ff', color: '#4f46e5', borderRadius: 100, padding: '4px 14px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Features</div>
            <h2 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: 12 }}>Everything you need to sell</h2>
            <p style={{ color: '#64748b', fontSize: 'clamp(0.9rem,2vw,1.0625rem)', maxWidth: 540, margin: '0 auto' }}>A complete commerce operating system built for teams that move fast.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: '1.25rem' }}>
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', border: '1px solid #e2e8f0', transition: 'box-shadow .2s,transform .2s', cursor: 'default' }}
                onMouseOver={e => { e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={22} color={color} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a', marginBottom: 6 }}>{title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: 'clamp(3rem,8vw,5rem) 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(1.75rem,4vw,2.25rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: 8 }}>Loved by commerce teams</h2>
            <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>Join thousands of merchants growing their business on our platform.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.25rem' }}>
            {testimonials.map(t => (
              <div key={t.name} style={{ background: '#f8fafc', borderRadius: 16, padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                  {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={15} color="#f59e0b" fill="#f59e0b" />)}
                </div>
                <p style={{ color: '#334155', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9375rem' }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: 'clamp(3rem,8vw,5rem) 1.5rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem,4vw,3rem)' }}>
            <div style={{ display: 'inline-block', background: '#eef2ff', color: '#4f46e5', borderRadius: 100, padding: '4px 14px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Pricing</div>
            <h2 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: 10 }}>Simple, transparent pricing</h2>
            <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>Start free. Upgrade as you grow. Downgrade anytime.</p>
          </div>

          {plans.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Loading plans...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '1.25rem', alignItems: 'start' }}>
              {plans.map((plan) => {
                const popular = plan.key === 'growth';
                return (
                  <div key={plan.key} style={{ background: '#fff', borderRadius: 20, border: `2px solid ${popular ? '#4f46e5' : '#e2e8f0'}`, padding: '1.75rem', position: 'relative', boxShadow: popular ? '0 8px 40px rgba(79,70,229,.15)' : 'none' }}>
                    {popular && (
                      <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#4f46e5', color: '#fff', borderRadius: 100, padding: '4px 16px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        ⚡ Most Popular
                      </div>
                    )}
                    <div style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{plan.name}</div>
                    <div style={{ fontSize: 'clamp(2rem,4vw,2.5rem)', fontWeight: 900, color: popular ? '#4f46e5' : '#0f172a', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>
                      {plan.price === 0 ? 'Free' : `$${plan.price}`}
                      {plan.price > 0 && <span style={{ fontSize: 14, fontWeight: 500, color: '#94a3b8' }}>/mo</span>}
                    </div>
                    {plan.price > 0
                      ? <p style={{ fontSize: 12, color: '#22c55e', marginBottom: 20, fontWeight: 600 }}>✓ 14-day free trial</p>
                      : <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>Forever free, no card needed</p>
                    }

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }}>
                      {[
                        ['Products', plan.limits.products],
                        ['Stores', plan.limits.stores],
                        ['Team members', plan.limits.users],
                        ['Orders/month', plan.limits.ordersPerMonth],
                      ].map(([label, val]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: '#64748b' }}>{label}</span>
                          <span style={{ fontWeight: 600, color: val === Infinity || val === 1e308 ? '#22c55e' : '#0f172a' }}>
                            {val === Infinity || val === 1e308 ? 'Unlimited' : val.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                      {Object.entries(plan.features).slice(0, 8).map(([key, enabled]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', background: enabled ? '#22c55e' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {enabled && <Check size={10} color="#fff" strokeWidth={3} />}
                          </div>
                          <span style={{ fontSize: 13, color: enabled ? '#334155' : '#94a3b8' }}>{featureLabel(key)}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => navigate(`/get-started?plan=${plan.key}`)}
                      style={{ width: '100%', padding: '11px', borderRadius: 10, border: popular ? 'none' : '1.5px solid #e2e8f0', background: popular ? '#4f46e5' : 'transparent', color: popular ? '#fff' : '#334155', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
                      onMouseOver={e => { if (!popular) { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; } }}
                      onMouseOut={e => { if (!popular) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; } }}
                    >
                      {plan.price === 0 ? 'Get started free' : `Start ${plan.name} trial`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', padding: 'clamp(3rem,8vw,5rem) 1.5rem', textAlign: 'center', color: '#fff' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12 }}>Ready to launch your store?</h2>
          <p style={{ color: 'rgba(255,255,255,.8)', marginBottom: 32, fontSize: '1.0625rem', lineHeight: 1.6 }}>
            Join thousands of merchants running their business on our platform. Get started in minutes.
          </p>
          <button onClick={() => navigate('/get-started')} style={{ background: '#fff', color: '#4f46e5', border: 'none', borderRadius: 12, padding: '15px 36px', fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 24px rgba(0,0,0,.2)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Start for free <ArrowRight size={18} />
          </button>
          <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,.5)' }}>No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#0f172a', color: 'rgba(255,255,255,.5)', padding: '2rem 1.5rem', textAlign: 'center', fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 12, flexWrap: 'wrap' }}>
          {['Privacy Policy', 'Terms of Service', 'Documentation', 'Support'].map(link => (
            <span key={link} style={{ cursor: 'pointer', transition: 'color .2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,.5)'}>{link}</span>
          ))}
        </div>
        <p>© {new Date().getFullYear()} ShopSaaS. All rights reserved.</p>
      </footer>
    </div>
  );
}
