import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Tag, ArrowRight, Star, ShoppingBag, Zap } from 'lucide-react';
import api from '../api/client';
import { useBrand } from '../context/BrandContext';
import { formatCurrency } from '../utils/formatCurrency';
import Footer from '../components/Footer';
import { scheduleIdleCallback } from '../utils/idle';
import { getProductCover } from '../utils/productImage';

function ProductCard({ product, currency }) {
  const basePrice = Number(product.price) || 0;
  const salePrice = product.salePrice !== null && product.salePrice !== undefined ? Number(product.salePrice) : null;
  const hasOffer = salePrice !== null && basePrice > salePrice;
  const percentOff = hasOffer ? Math.round(((basePrice - salePrice) / Math.max(basePrice, 1)) * 100) : null;
  const bestSeller = Boolean(product.isBestSeller);
  const lowestEver = product.lowestSalePriceEver ?? product.lowest_sale_price_ever ?? null;
  const showAllTimeLow = lowestEver !== null && hasOffer && Number(lowestEver) <= salePrice;
  const offerEnds = product.offerExpiresAt || product.offer_expires_at;
  const offerEndsLabel = offerEnds ? new Date(offerEnds).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : null;
  return (
    <Link to={`/products/${product.id}`} className="product-card" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="product-card-image">
        <img src={getProductCover(product.images)} alt={product.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div className="product-card-body">
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
          {product.category || 'General'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
          <Link to={`/products/${product.id}`} style={{ color: 'var(--text-main)', textDecoration: 'none', flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 600, lineHeight: 1.3 }}>{product.name}</h3>
          </Link>
          {bestSeller && (
            <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '999px', backgroundColor: '#fde68a', color: '#92400e', fontWeight: 700 }}>
              Best seller
            </span>
          )}
        </div>
        {product.description && (
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {product.description}
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', paddingTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {hasOffer ? (
                <>
                  <span style={{ textDecoration: 'line-through', fontSize: '1rem', color: '#64748b' }}>{formatCurrency(basePrice, currency)}</span>
                  {formatCurrency(salePrice, currency)}
                  {percentOff ? (
                    <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
                      {percentOff}% off
                    </span>
                  ) : null}
                </>
              ) : (
                formatCurrency(basePrice, currency)
              )}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Star size={12} fill="var(--warning)" color="var(--warning)" />
              <span>4.5</span>
            </div>
          </div>
          {product.offerLabel && (
            <div style={{ fontSize: '0.8rem', color: '#1f2937', marginTop: '0.25rem', fontWeight: 600 }}>
              {product.offerLabel}
              {offerEndsLabel && <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '0.35rem' }}>Ends {offerEndsLabel}</span>}
            </div>
          )}
          {showAllTimeLow && (
            <div style={{ fontSize: '0.75rem', color: '#0f172a', marginTop: '0.25rem', fontWeight: 600 }}>
              All-time low {formatCurrency(lowestEver, currency)}
            </div>
          )}
      </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [hero, setHero] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { storeName, currency = 'INR' } = useBrand();

  const fetchRecommendations = useCallback(async (productId) => {
    try {
      const recRes = await api.get(`/products/${productId}/recommendations`);
      if (recRes.success) setRecommendations(recRes.data);
    } catch (err) {
      console.error('Failed to load recommendations', err);
    }
  }, []);

    useEffect(() => {
      let cancelIdle = null;
      const fetchPageData = async () => {
        setLoading(true);
        try {
          const [productsRes, heroRes] = await Promise.all([
            api.get('/products?limit=8'),
            api.get('/promotions/hero'),
          ]);
          if (productsRes.success) setFeatured(productsRes.data);
          if (heroRes.success) setHero(heroRes.data?.[0] || null);
          if (productsRes.success && productsRes.data.length > 0) {
            cancelIdle = scheduleIdleCallback(() => fetchRecommendations(productsRes.data[0].id), { timeout: 500 });
          }
        } catch (err) {
          console.error('Failed to load home data', err);
        } finally {
          setLoading(false);
        }
      };
      fetchPageData();
      return () => cancelIdle?.();
    }, [fetchRecommendations]);

  const heroBg = hero?.bannerImage
    ? { backgroundImage: `linear-gradient(120deg, rgba(14,165,233,0.9), rgba(59,130,246,0.85)), url(${hero.bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

      {/* Hero Banner */}
      <section style={{
        ...heroBg,
        borderRadius: 20,
        padding: 'clamp(2rem, 5vw, 3.5rem)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 280,
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: '40%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 600, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '5px 14px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.25rem' }}>
            <Zap size={13} />
            {hero ? 'Featured Offer' : 'New Arrivals Daily'}
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 1rem' }}>
            {hero?.name || `Welcome to ${storeName}`}
          </h1>
          <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', opacity: 0.85, marginBottom: '1.75rem', lineHeight: 1.6, maxWidth: 480 }}>
            {hero?.description || 'Curated picks delivered with premium support and lightning-fast checkout.'}
          </p>
          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
            {hero?.ctaUrl && hero?.ctaText ? (
              <Link
                to={hero.ctaUrl}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#312e81', padding: '11px 22px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: '0.95rem', transition: 'transform 0.15s', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}
              >
                <Sparkles size={16} /> {hero.ctaText}
              </Link>
            ) : (
              <Link
                to="/products"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#312e81', padding: '11px 22px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}
              >
                <Sparkles size={16} /> Shop Now
              </Link>
            )}
            <Link
              to="/products"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', color: '#fff', padding: '11px 22px', borderRadius: 10, fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
            >
              Browse catalog <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Active Promotions */}
      {hero && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Live Promotions</h2>
              <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Always-on savings and new drops</p>
            </div>
            <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              See all <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, var(--primary-light), rgba(139,92,246,0.08))',
              border: '1px solid rgba(79,70,229,0.15)',
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} color="#fff" />
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{hero.name}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-body)', lineHeight: 1.5 }}>{hero.description}</p>
              {hero.conditionType === 'min_order_amount' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                  <Tag size={12} />
                  Spend {formatCurrency(hero.conditionValue, currency)}+ to unlock
                </div>
              )}
              {hero.ctaUrl && hero.ctaText && (
                <Link to={hero.ctaUrl} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  {hero.ctaText} <ArrowRight size={13} />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* "Customers also bought" */}
      {recommendations.length > 0 && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Customers Also Bought</h2>
              <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Based on trending purchases</p>
            </div>
            <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Browse all <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {recommendations.map(product => (
              <ProductCard key={product.id} product={product} currency={currency} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Featured Products</h2>
            <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Hand-selected assortments refreshed daily</p>
          </div>
          <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            See catalog <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ height: 200, background: 'var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 12, width: '40%', background: 'var(--border)', borderRadius: 4 }} />
                  <div style={{ height: 16, width: '80%', background: 'var(--border)', borderRadius: 4 }} />
                  <div style={{ height: 12, width: '60%', background: 'var(--border)', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <ShoppingBag size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>No products to show right now.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>Check back soon for new arrivals!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {featured.map(product => (
              <ProductCard key={product.id} product={product} currency={currency} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Banner */}
      <section style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        borderRadius: 20,
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap',
      }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 800, color: '#fff' }}>
            Discover Everything in Our Catalog
          </h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '0.925rem' }}>
            Thousands of products with competitive prices and fast delivery.
          </p>
        </div>
        <Link
          to="/products"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#4f46e5', padding: '12px 24px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: '0.95rem', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}
        >
          Shop All Products <ArrowRight size={16} />
        </Link>
      </section>
      <Footer />
    </div>
  );
}
