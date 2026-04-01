import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useBrand } from '../../context/BrandContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { getProductCover } from '../../utils/productImage';
import { ShoppingCart, CheckCircle, Table, Info, Truck, ShieldCheck, RefreshCw, MapPin, Star, Heart } from 'lucide-react';
import { toast } from 'react-toastify';
import ReviewSection from '../../components/ReviewSection';
import { useAuth } from '../../context/AuthContext';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [deliveryInfoLoading, setDeliveryInfoLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const { currency = 'INR', settings = {} } = useBrand();
  const resolvedCurrency = settings.currency || currency;
  const { user } = useAuth();
  const [alertEmail, setAlertEmail] = useState('');
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionText, setQuestionText] = useState('');
  const [qaSubmitting, setQaSubmitting] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recentlyViewedLoading, setRecentlyViewedLoading] = useState(false);
  const [socialProof, setSocialProof] = useState(null);
  const [productStats, setProductStats] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get(`/products/${id}`)
      .then(res => { 
        if (res.success) {
          setProduct(res.data);
          setSelectedImage(0);
          // Auto-select first variant if available
          if (res.data.availableSizes?.length > 0) setSelectedSize(res.data.availableSizes[0]);
          if (res.data.availableColors?.length > 0) setSelectedColor(res.data.availableColors[0]);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!product) return;
    setAvailabilityLoading(true);
    api.get(`/store-stock/product/${product.id}/availability`)
      .then((res) => {
        if (res.success) {
          setAvailability(res.data);
        }
      })
      .finally(() => setAvailabilityLoading(false));
  }, [product]);

  useEffect(() => {
    if (user?.email) {
      setAlertEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!product) return;
    setDeliveryInfoLoading(true);
    api.get('/delivery/availability', { params: { productId: product.id } })
      .then((res) => {
        if (res.success) {
          setDeliveryInfo(res.data);
        }
      })
      .catch(() => setDeliveryInfo(null))
      .finally(() => setDeliveryInfoLoading(false));
  }, [product]);

  const fetchQuestions = async () => {
    if (!product) return;
    setQuestionsLoading(true);
    try {
      const res = await api.get(`/products/${product.id}/questions`);
      if (res.success) {
        setQuestions(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load product questions', err);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const fetchSocialProof = async () => {
    if (!product) return;
    try {
      const res = await api.get(`/products/${product.id}/social-proof`);
      if (res.success) {
        setSocialProof(res.data || null);
      }
    } catch (err) {
      console.error('Failed to load social proof data', err);
    }
  };

  const fetchRecentlyViewed = async () => {
    if (!user) {
      setRecentlyViewed([]);
      return;
    }
    setRecentlyViewedLoading(true);
    try {
      const res = await api.get('/products/recently-viewed');
      if (res.success) {
        const filtered = (res.data || []).filter((item) => item.id !== product?.id);
        setRecentlyViewed(filtered);
      }
    } catch (err) {
      console.error('Failed to load recently viewed', err);
    } finally {
      setRecentlyViewedLoading(false);
    }
  };

  useEffect(() => {
    if (product) {
      fetchQuestions();
      fetchSocialProof();
    }
  }, [product]);

  useEffect(() => {
    if (!product) {
      setProductStats(null);
      return;
    }
    let isMounted = true;
    const fetchSummary = async () => {
      try {
        const res = await api.get(`/products/${product.id}/summary`);
        if (isMounted && res.success) {
          setProductStats(res.data || null);
        }
      } catch (err) {
        console.error('Failed to load product summary', err);
      }
    };
    fetchSummary();
    return () => { isMounted = false; };
  }, [product]);

  useEffect(() => {
    fetchRecentlyViewed();
  }, [user]);

  const handleQuestionSubmit = async (event) => {
    event.preventDefault();
    if (!user) {
      return toast.error('Please log in to ask a question.');
    }
    if (!questionText.trim()) {
      return toast.error('Question cannot be blank.');
    }
    setQaSubmitting(true);
    try {
      await api.post(`/products/${product.id}/questions`, { question: questionText.trim() });
      setQuestionText('');
      toast.success('Question submitted. We will notify you when it is answered.');
      fetchQuestions();
    } catch (err) {
      toast.error(err?.message || 'Unable to submit your question.');
    } finally {
      setQaSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="loader">Loading refined details...</div>
    </div>
  );
  
  if (!product) return (
    <div style={{ textAlign: 'center', padding: '5rem' }}>
      <h2 style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>Product not found.</h2>
    </div>
  );

  const statsStock = productStats?.stock ?? product.stock?.quantity ?? 0;
  const statsSold = productStats?.soldCount ?? 0;
  const statsReviews = productStats?.ratingCount ?? product.ratingCount ?? 0;
  const statsList = [
    { label: 'In Stock', value: statsStock, helper: 'Units available' },
    { label: 'Sold', value: statsSold, helper: 'Units fulfilled' },
    { label: 'Reviews', value: statsReviews, helper: 'Community feedback' }
  ];

  const inStock = product.stock?.quantity > 0;

  const handleSubscribeAlert = async () => {
    if (!alertEmail) {
      return toast.error('Please provide an email address.');
    }
    setAlertLoading(true);
    try {
      const res = await api.post('/stock/alerts', { productId: product.id, email: alertEmail });
      if (res.success) {
        setAlertMessage(res.message || 'We will let you know when this item is back in stock.');
      }
    } catch (err) {
      toast.error(err.message || 'Unable to register alert.');
    } finally {
      setAlertLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product.availableSizes?.length > 0 && !selectedSize) {
      return toast.error('Please select a size');
    }
    if (product.availableColors?.length > 0 && !selectedColor) {
      return toast.error('Please select a color');
    }
    addToCart(product, quantity, selectedSize, selectedColor);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Breadcrumbs */}
      <nav style={{ marginBottom: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Home / {product.category} / <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{product.name}</span>
      </nav>

      <div className="responsive-stack" style={{ marginBottom: '4rem' }}>
        
        {/* Left: Image Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ 
            aspectRatio: '1/1', 
            backgroundColor: 'white', 
            borderRadius: '24px', 
            overflow: 'hidden', 
            border: '1px solid var(--border-color)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
          }}>
            {product.images?.[selectedImage] ? (
              <img 
                src={product.images[selectedImage]} 
                alt={product.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} 
              />
            ) : <Info size={48} color="var(--border-color)" />}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            {product.images?.map((img, idx) => (
              <button 
                key={idx} 
                onClick={() => setSelectedImage(idx)}
                style={{ 
                  width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', padding: 0,
                  border: selectedImage === idx ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  opacity: selectedImage === idx ? 1 : 0.6,
                  transition: '0.2s'
                }}
              >
                <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Primary Info */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ 
              backgroundColor: 'var(--primary-color)', color: 'white', padding: '0.25rem 0.75rem', 
              borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' 
            }}>
              {product.brand || 'Premium'}
            </span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '0.5rem', lineHeight: 1.1 }}>{product.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
               <div style={{ display: 'flex' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < Math.round(product.ratingAvg || 0) ? '#f59e0b' : 'none'} color={i < Math.round(product.ratingAvg || 0) ? '#f59e0b' : '#d1d5db'} />
                  ))}
               </div>
               <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{Number(product.ratingAvg || 0).toFixed(1)}</span>
               <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>({product.ratingCount || 0} reviews)</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
              {statsList.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    minWidth: '140px',
                    padding: '0.9rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#f8fafc'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{stat.label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.helper}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{formatCurrency(product.price, resolvedCurrency)}</span>
            {product.price > 1000 && (
              <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '1.25rem' }}>
                {formatCurrency(product.price * 1.2, resolvedCurrency)}
              </span>
            )}
          </div>
          <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#047857' }}>
            {socialProof?.viewCount
              ? `Over ${socialProof.viewCount} shoppers viewed this in the last ${Math.max(1, Math.round((socialProof.windowMinutes || 0) / 60))}h.`
              : 'Be the first to check availability for this item.'}
          </div>

          {!inStock && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '12px', border: '1px dashed #e5e7eb', background: '#f8fafc' }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Get notified when back in stock</h3>
              <p style={{ color: '#475569', margin: 0, marginBottom: '0.75rem' }}>
                Enter your email and we will ping you as soon as this product is available again.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  placeholder="Email address"
                  className="input-field"
                  style={{ flex: 1, minWidth: '220px' }}
                />
                <button onClick={handleSubscribeAlert} className="btn-secondary" disabled={alertLoading}>
                  {alertLoading ? 'Signing up…' : 'Notify me'}
                </button>
              </div>
              {alertMessage && <p style={{ color: '#047857', marginTop: '0.5rem' }}>{alertMessage}</p>}
            </div>
          )}

          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '1.125rem', marginBottom: '2rem' }}>
            {product.description?.substring(0, 200)}...
          </p>

          <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {product.availableColors?.length > 0 && (
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'block' }}>Color: {selectedColor}</label>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {product.availableColors.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      title={c}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%', backgroundColor: c,
                        border: selectedColor === c ? '2px solid var(--primary-color)' : '2px solid transparent',
                        boxShadow: selectedColor === c ? '0 0 0 2px white, 0 0 0 4px var(--primary-color)' : '0 1px 3px rgba(0,0,0,0.1)',
                        cursor: 'pointer', transition: '0.2s', padding: 0
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {product.availableSizes?.length > 0 && (
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'block' }}>Size: {selectedSize}</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {product.availableSizes.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      style={{
                        minWidth: '45px', minHeight: '45px', borderRadius: '10px',
                        border: selectedSize === s ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        backgroundColor: selectedSize === s ? 'rgba(37, 99, 235, 0.05)' : 'white',
                        color: selectedSize === s ? 'var(--primary-color)' : 'var(--text-main)',
                        fontWeight: 700, cursor: 'pointer', transition: '0.2s', fontSize: '0.875rem'
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ 
            padding: '2rem', backgroundColor: 'white', borderRadius: '24px', border: '1px solid var(--border-color)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
               <span style={{ fontWeight: 600 }}>Quantity</span>
               <span style={{ color: inStock ? '#10b981' : '#ef4444', fontSize: '0.875rem', fontWeight: 700 }}>
                 {inStock ? `In Stock (${product.stock?.quantity || 0})` : 'Out of Stock'}
               </span>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >-</button>
                <span style={{ padding: '0 1rem', minWidth: '40px', textAlign: 'center', fontWeight: 700 }}>{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >+</button>
              </div>
              <button 
                className="btn-primary" 
                style={{ flex: 1, height: '54px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1.1rem' }}
                disabled={!inStock}
                onClick={handleAddToCart}
              >
                <ShoppingCart size={20} /> Add to Cart
              </button>
              <button 
                onClick={() => isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist(product)}
                style={{ 
                    width: '54px', height: '54px', borderRadius: '12px', border: '1px solid var(--border-color)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white',
                    color: isInWishlist(product.id) ? '#ef4444' : 'var(--text-muted)', cursor: 'pointer', transition: '0.2s'
                }}
              >
                <Heart size={24} fill={isInWishlist(product.id) ? '#ef4444' : 'none'} />
              </button>
            </div>
            {availabilityLoading ? (
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Checking store availability …</p>
            ) : availability ? (
              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} color="#047857" />
                  <span style={{ fontWeight: 600 }}>Available in {availability.stores.length} stores</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {availability.stores.slice(0, 3).map((store) => (
                    <span key={store.id} style={{ color: '#4b5563' }}>
                      {store.name} — {store.quantity} units {(store.contactPhone && `· ${store.contactPhone}`) || ''}
                    </span>
                  ))}
                  {availability.stores.length > 3 && (
                    <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>And {availability.stores.length - 3} more store(s)</span>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ marginTop: '1rem', color: '#ef4444', fontWeight: 600 }}>Currently not stocked in our stores.</p>
            )}
          </div>

          {/* Quick Perks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
               <Truck size={18} /> <span>Free Shipping</span>
            </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <ShieldCheck size={18} /> <span>2 Year Warranty</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <RefreshCw size={18} /> <span>30-Day Returns</span>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
            {deliveryInfoLoading ? (
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Checking delivery availability …</p>
            ) : deliveryInfo ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <MapPin size={18} color={deliveryInfo.isDeliverable ? '#10b981' : '#ef4444'} />
                  <strong style={{ color: deliveryInfo.isDeliverable ? '#0f766e' : '#b91c1c' }}>
                    {deliveryInfo.isDeliverable ? 'Deliverable to your location' : 'Not deliverable to your area'}
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                  {deliveryInfo.matchedRegion
                    ? `${deliveryInfo.matchedRegion.name} · Estimated ${deliveryInfo.matchedRegion.leadTimeDays ?? 'N/A'} day(s)`
                    : 'Deliverable regions are configured for this product.'}
                </p>
                <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem', color: '#475569', fontSize: '0.85rem' }}>
                  {deliveryInfo.deliverableRegions?.length > 0
                    ? deliveryInfo.deliverableRegions.map((region) => (
                        <span key={region.id} style={{ background: '#f8fafc', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                          {region.name}
                        </span>
                      ))
                    : 'No regions configured yet.'}
                </div>
              </>
            ) : (
              <p style={{ margin: 0, color: '#475569' }}>Delivery regions are not configured yet.</p>
            )}
          </div>
        </div>
      </div>
      <section style={{ marginTop: '3rem', padding: '2rem', borderRadius: '18px', border: '1px solid rgba(15,23,42,0.08)', background: '#fff', boxShadow: '0 30px 60px rgba(15,23,42,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.35rem' }}>Product Q&A</h3>
            <p style={{ margin: '0.25rem 0 0', color: '#475569' }}>Ask a question about fit, shipping, or usage; we’ll reply soon.</p>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#0f766e' }}>Answered by the merchant</span>
        </div>
        <form onSubmit={handleQuestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
          <textarea
            rows={3}
            placeholder="How does this fit? Is it available in store?"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="input-field"
            style={{ borderRadius: '12px' }}
          />
          <button type="submit" className="btn-primary" disabled={qaSubmitting}>
            {qaSubmitting ? 'Submitting…' : 'Submit question'}
          </button>
        </form>
        {questionsLoading ? (
          <p style={{ margin: 0, color: '#475569' }}>Loading recent questions…</p>
        ) : questions.length === 0 ? (
          <p style={{ margin: 0, color: '#475569' }}>No questions yet – be the first to ask!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {questions.map((item) => (
              <article key={item.id} style={{ border: '1px solid rgba(15,23,42,0.08)', borderRadius: '12px', padding: '1rem', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.95rem' }}>Q: {item.question}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                {item.answer ? (
                  <div style={{ paddingLeft: '0.75rem', borderLeft: '3px solid #0f766e' }}>
                    <p style={{ margin: '0 0 0.35rem' }}><strong>A:</strong> {item.answer}</p>
                    <span style={{ fontSize: '0.75rem', color: '#0f766e' }}>Answered by {item.answerAuthor?.name || 'merchant team'}</span>
                  </div>
                ) : (
                  <em style={{ color: '#475569' }}>Awaiting response from the store.</em>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {recentlyViewedLoading ? (
        <p style={{ marginTop: '2rem', color: '#475569' }}>Loading your recently viewed products…</p>
      ) : recentlyViewed.length > 0 ? (
        <section style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Recently viewed</h3>
            <span style={{ fontSize: '0.85rem', color: '#0f766e' }}>Picked up from your browser</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {recentlyViewed.map((item) => (
              <Link key={item.id} to={`/products/${item.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ height: '160px', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={getProductCover(item.images)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{item.name}</strong>
                  <span style={{ fontSize: '0.85rem', color: '#475569' }}>{item.category || 'Trending'}</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(item.price, resolvedCurrency)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Details Tabs */}
      <div style={{ marginTop: '4rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
          {['description', 'highlights', 'specifications'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '1rem 2rem', border: 'none', background: 'none', fontSize: '1rem', fontWeight: 600,
                color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '3px solid var(--primary-color)' : '3px solid transparent',
                cursor: 'pointer', textTransform: 'capitalize', transition: '0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ minHeight: '300px', animation: 'fadeIn 0.4s easeOut' }}>
          {activeTab === 'description' && (
            <div style={{ lineHeight: 1.8, fontSize: '1.125rem', color: 'var(--text-main)', maxWidth: '800px' }}>
              {product.description}
            </div>
          )}

          {activeTab === 'highlights' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
              {product.highlights?.length > 0 ? product.highlights.map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                  <CheckCircle size={24} color="#10b981" style={{ flexShrink: 0 }} />
                  <p style={{ fontWeight: 500, margin: 0 }}>{h}</p>
                </div>
              )) : <p>Great product features coming soon.</p>}
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', maxWidth: '800px' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {product.specifications && Object.entries(product.specifications).map(([key, val], i) => (
                      <tr key={key} style={{ borderBottom: i === Object.keys(product.specifications).length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1.25rem', backgroundColor: '#f8fafc', fontWeight: 600, width: '30%', borderRight: '1px solid var(--border-color)' }}>{key}</td>
                        <td style={{ padding: '1.25rem', color: 'var(--text-main)' }}>{val}</td>
                      </tr>
                    ))}
                    {!product.specifications && (
                      <tr><td style={{ padding: '2rem', textAlign: 'center' }}>No specifications available.</td></tr>
                    )}
                  </tbody>
               </table>
            </div>
          )}
        </div>
      </div>

      <ReviewSection 
        productId={product.id} 
        productRating={product.ratingAvg} 
        productCount={product.ratingCount} 
      />
    </div>
  );
}
