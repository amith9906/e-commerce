import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useBrand } from '../../context/BrandContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { getProductCover } from '../../utils/productImage';
import { ShoppingCart, Filter as FilterIcon, ArrowUpDown, CheckSquare, Square, X, Heart, Eye, Star } from 'lucide-react';

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState([]);
  const [meta, setMeta] = useState({ categories: [], brands: [], colors: [], sizes: [], priceRange: { min: 0, max: 0 } });
  const [filters, setFilters] = useState({ category: '', brand: '', color: '', size: '', sort: 'newest', q: '', minRating: '', minPrice: '', maxPrice: '' });
  const [priceInput, setPriceInput] = useState({ min: '', max: '' });
  const [availabilityMap, setAvailabilityMap] = useState({});
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const { currency = 'INR', settings = {} } = useBrand();
  const resolvedCurrency = settings.currency || currency;

  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    setFilters((prev) => (prev.q === qParam ? prev : { ...prev, q: qParam }));
  }, [searchParams]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await api.get('/products/meta/filters');
        if (res.success) {
          setMeta(res.data);
        }
      } catch (err) {
        console.error('Unable to load filters metadata', err);
      }
    };

    fetchMeta();
  }, []);

  // Sync priceInput local state with meta range on first load
  useEffect(() => {
    if (meta.priceRange.max > 0 && !priceInput.min && !priceInput.max) {
      setPriceInput({ min: String(meta.priceRange.min), max: String(meta.priceRange.max) });
    }
  }, [meta.priceRange]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {
          ...filters,
          limit: 60,
        };
        const res = await api.get('/products', { params });
        if (res.success) {
          setProducts(res.data);
        }
      } catch (err) {
        console.error('Unable to load products', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  useEffect(() => {
    if (!products.length) {
      setAvailabilityMap({});
      return;
    }
    const ids = products.slice(0, 24).map((p) => p.id).join(',');
    if (!ids) {
      setAvailabilityMap({});
      return;
    }
    const fetchAvailability = async () => {
      try {
        const res = await api.get('/store-stock/products/availability', { params: { productIds: ids } });
        if (res.success) {
          const map = {};
          res.data.forEach((item) => {
            map[item.productId] = item;
          });
          setAvailabilityMap(map);
        }
      } catch (err) {
        console.error('Unable to load availability', err);
      }
    };
    fetchAvailability();
  }, [products]);

  const handleWishlistToggle = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(product.id)) {
        removeFromWishlist(product.id);
    } else {
        addToWishlist(product);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ category: '', brand: '', color: '', size: '', sort: 'newest', q: '', minRating: '', minPrice: '', maxPrice: '' });
    setPriceInput({ min: String(meta.priceRange.min), max: String(meta.priceRange.max) });
  };

  const applyPriceFilter = () => {
    const min = parseFloat(priceInput.min);
    const max = parseFloat(priceInput.max);
    setFilters(prev => ({
      ...prev,
      minPrice: !isNaN(min) && min > meta.priceRange.min ? String(min) : '',
      maxPrice: !isNaN(max) && max < meta.priceRange.max ? String(max) : '',
    }));
  };

  const toggleCompare = (productId) => {
    setComparing(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId].slice(0, 4)
    );
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', minHeight: '80vh' }}>
      {/* Sidebar Filters */}
      <aside style={{ flex: '0 0 250px', background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', height: 'fit-content', position: 'sticky', top: '100px' }}>
        {(() => {
          const activeCount = [filters.category, filters.brand, filters.color, filters.size, filters.minRating, filters.minPrice, filters.maxPrice].filter(Boolean).length;
          return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FilterIcon size={18} />
                <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Filters</h2>
                {activeCount > 0 && (
                  <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, padding: '1px 7px' }}>{activeCount}</span>
                )}
              </div>
              {activeCount > 0 && (
                <button onClick={clearFilters} style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Clear All</button>
              )}
            </div>
          );
        })()}

        {/* Category */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Category</label>
          <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)} className="input-field" style={{ marginBottom: 0 }}>
            <option value="">All Categories</option>
            {meta.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Price Range */}
        {meta.priceRange.max > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'block' }}>Price Range</label>

            {/* Range track visual */}
            <div style={{ position: 'relative', height: 4, background: 'var(--border)', borderRadius: 2, margin: '0.5rem 0.25rem 1.25rem' }}>
              {(() => {
                const rangeMin = meta.priceRange.min;
                const rangeMax = meta.priceRange.max;
                const span = rangeMax - rangeMin || 1;
                const lo = Math.max(rangeMin, parseFloat(priceInput.min) || rangeMin);
                const hi = Math.min(rangeMax, parseFloat(priceInput.max) || rangeMax);
                const leftPct = ((lo - rangeMin) / span) * 100;
                const rightPct = ((rangeMax - hi) / span) * 100;
                return (
                  <div style={{ position: 'absolute', left: `${leftPct}%`, right: `${rightPct}%`, height: '100%', background: 'var(--primary)', borderRadius: 2 }} />
                );
              })()}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600 }}>MIN</div>
                <input
                  type="number"
                  value={priceInput.min}
                  min={meta.priceRange.min}
                  max={priceInput.max || meta.priceRange.max}
                  onChange={e => setPriceInput(p => ({ ...p, min: e.target.value }))}
                  onBlur={applyPriceFilter}
                  onKeyDown={e => e.key === 'Enter' && applyPriceFilter()}
                  className="input-field"
                  style={{ marginBottom: 0, padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
                  placeholder={String(meta.priceRange.min)}
                />
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', paddingTop: 18 }}>—</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600 }}>MAX</div>
                <input
                  type="number"
                  value={priceInput.max}
                  min={priceInput.min || meta.priceRange.min}
                  max={meta.priceRange.max}
                  onChange={e => setPriceInput(p => ({ ...p, max: e.target.value }))}
                  onBlur={applyPriceFilter}
                  onKeyDown={e => e.key === 'Enter' && applyPriceFilter()}
                  className="input-field"
                  style={{ marginBottom: 0, padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
                  placeholder={String(meta.priceRange.max)}
                />
              </div>
            </div>
            {(filters.minPrice || filters.maxPrice) && (
              <button
                type="button"
                onClick={() => {
                  setFilters(p => ({ ...p, minPrice: '', maxPrice: '' }));
                  setPriceInput({ min: String(meta.priceRange.min), max: String(meta.priceRange.max) });
                }}
                style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.5rem', padding: 0 }}
              >
                Clear price filter
              </button>
            )}
          </div>
        )}

        {/* Brand — only shown when catalog has multiple brands, as tag buttons */}
        {meta.brands?.length > 1 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Brand</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {meta.brands.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => handleFilterChange('brand', filters.brand === b ? '' : b)}
                  style={{
                    padding: '0.25rem 0.65rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${filters.brand === b ? 'var(--primary)' : 'var(--border)'}`,
                    background: filters.brand === b ? 'var(--primary-light)' : 'transparent',
                    color: filters.brand === b ? 'var(--primary)' : 'var(--text-body)',
                    transition: 'all 0.15s',
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Size */}
        {meta.sizes?.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Size</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {meta.sizes.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleFilterChange('size', filters.size === s ? '' : s)}
                  style={{
                    padding: '0.25rem 0.6rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${filters.size === s ? 'var(--primary)' : 'var(--border)'}`,
                    background: filters.size === s ? 'var(--primary-light)' : 'transparent',
                    color: filters.size === s ? 'var(--primary)' : 'var(--text-body)',
                    transition: 'all 0.15s',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color */}
        {meta.colors?.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Color</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {meta.colors.map(c => {
                const isHex = /^#[0-9a-f]{3,8}$/i.test(c);
                const isSelected = filters.color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => handleFilterChange('color', isSelected ? '' : c)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.25rem 0.6rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                      cursor: 'pointer', border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--primary-light)' : 'transparent',
                      color: isSelected ? 'var(--primary)' : 'var(--text-body)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {isHex && <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, border: '1px solid #e5e7eb', flexShrink: 0 }} />}
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Rating */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'block' }}>Rating</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[4, 3, 2, 1].map(rating => {
              const isSelected = filters.minRating === String(rating);
              return (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleFilterChange('minRating', isSelected ? '' : String(rating))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.4rem 0.6rem', borderRadius: 8, cursor: 'pointer',
                    border: `1.5px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                    background: isSelected ? 'var(--primary-light)' : 'transparent',
                    textAlign: 'left', width: '100%',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', gap: 1 }}>
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={13}
                        fill={i <= rating ? '#f59e0b' : 'none'}
                        color={i <= rating ? '#f59e0b' : '#d1d5db'}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--text-body)' }}>
                    {rating}+ stars
                  </span>
                </button>
              );
            })}
            {filters.minRating && (
              <button
                type="button"
                onClick={() => handleFilterChange('minRating', '')}
                style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '0.2rem 0.6rem' }}
              >
                Clear rating filter
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {filters.q ? `Results for "${filters.q}"` : filters.category || 'All Products'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{products.length} products found</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', padding: '0.25rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <ArrowUpDown size={16} color="var(--text-muted)" />
              <select value={filters.sort} onChange={(e) => handleFilterChange('sort', e.target.value)} style={{ border: 'none', background: 'transparent', fontWeight: 600, fontSize: '0.875rem', outline: 'none', cursor: 'pointer', padding: '0.25rem' }}>
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">A-Z</option>
                <option value="rating_desc">Top Rated</option>
              </select>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[1,2,3,4].map(i => <div key={i} className="card" style={{ height: '350px', backgroundColor: '#f8fafc', border: 'none' }}></div>)}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
             <FilterIcon size={48} style={{ color: '#e2e8f0', marginBottom: '1rem' }} />
             <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No products found</h3>
             <p style={{ color: 'var(--text-muted)' }}>Try adjusting your filters or search terms.</p>
             <button onClick={clearFilters} className="btn-primary" style={{ marginTop: '1.5rem' }}>Clear Filters</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
          {products.map(product => {
            const salePriceValue = product.salePrice !== null && product.salePrice !== undefined ? Number(product.salePrice) : null;
            const basePrice = Number(product.price);
            const hasOffer = salePriceValue !== null && basePrice > salePriceValue;
            const percentOff = hasOffer ? Math.round(((basePrice - salePriceValue) / basePrice) * 100) : null;
            const bestSeller = Boolean(product.isBestSeller);
            const lowestEver = product.lowestSalePriceEver ?? product.lowest_sale_price_ever ?? null;
            const showAllTimeLow = lowestEver !== null && hasOffer && Number(lowestEver) <= salePriceValue;
            const offerEndsLabel = product.offerExpiresAt || product.offer_expires_at
              ? new Date(product.offerExpiresAt || product.offer_expires_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
              : null;
            return (
            <div key={product.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', position: 'relative', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                {/* Compare Button */}
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(product.id); }}
                  style={{ 
                    position: 'absolute', top: '12px', left: '12px', zIndex: 10, 
                    backgroundColor: 'white', borderRadius: '6px', padding: '0.4rem',
                    display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', color: comparing.includes(product.id) ? 'var(--primary-color)' : 'var(--text-muted)',
                    border: 'none', cursor: 'pointer'
                  }}
                >
                  {comparing.includes(product.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                  COMPARE
                </button>

                {/* Wishlist Button */}
                <button 
                  onClick={(e) => handleWishlistToggle(e, product)}
                  style={{ 
                    position: 'absolute', top: '12px', right: '12px', zIndex: 10, 
                    backgroundColor: 'white', borderRadius: '50%', width: '32px', height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', color: isInWishlist(product.id) ? '#ef4444' : 'var(--text-muted)',
                    border: 'none', cursor: 'pointer', transition: '0.2s'
                  }}
                >
                  <Heart size={18} fill={isInWishlist(product.id) ? '#ef4444' : 'none'} />
                </button>

                {/* Product Image */}
                <Link to={`/products/${product.id}`} style={{ display: 'block', height: '240px', backgroundColor: '#f8fafc' }}>
                  <img src={getProductCover(product.images)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Link>

                {/* Product Info */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                    {product.brand}
                  </div>
                  <Link to={`/products/${product.id}`} style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', lineHeight: 1.4, height: '2.8em', overflow: 'hidden', flex: 1 }}>{product.name}</h3>
                    {bestSeller && (
                      <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '999px', backgroundColor: '#fde68a', color: '#92400e', fontWeight: 700 }}>
                        Best seller
                      </span>
                    )}
                  </Link>

                  {/* Rating */}
                  {product.ratingCount > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: 1 }}>
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={12}
                            fill={i <= Math.round(product.ratingAvg) ? '#f59e0b' : 'none'}
                            color={i <= Math.round(product.ratingAvg) ? '#f59e0b' : '#d1d5db'}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {Number(product.ratingAvg).toFixed(1)} ({product.ratingCount})
                      </span>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '0.5rem', height: '1rem' }} />
                  )}

                  {/* Quick specs selection hint */}
                  {product.availableSizes?.length > 0 || product.availableColors?.length > 0 ? (
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        {product.availableColors?.slice(0, 3).map(c => <span key={c} style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: c, border: '1px solid #e2e8f0' }} title={c}></span>)}
                        {product.availableSizes?.slice(0, 3).map(s => <span key={s} style={{ fontSize: '0.65rem', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>{s}</span>)}
                        {(product.availableSizes?.length > 3 || product.availableColors?.length > 3) && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+more</span>}
                    </div>
                  ) : <div style={{ marginBottom: '1rem', height: '1.2em' }}></div>}

                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {hasOffer ? (
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                            <span style={{ textDecoration: 'line-through', fontSize: '1rem', color: '#64748b' }}>{formatCurrency(basePrice, resolvedCurrency)}</span>
                            <span>{formatCurrency(salePriceValue, resolvedCurrency)}</span>
                            {percentOff ? (
                              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
                                {percentOff}% off
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          formatCurrency(basePrice, resolvedCurrency)
                        )}
                      </div>
                      {product.stock?.quantity <= 5 && product.stock?.quantity > 0 && (
                        <div style={{ fontSize: '0.65rem', color: '#d97706', fontWeight: 700 }}>Hurry! {product.stock.quantity} left</div>
                      )}
                      {product.stock?.quantity === 0 && (
                        <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 700 }}>OUT OF STOCK</div>
                      )}
                    </div>

                    {product.offerLabel && (
                      <div style={{ fontSize: '0.8rem', marginBottom: '0.35rem', color: '#1f2937', fontWeight: 600 }}>
                        {product.offerLabel}
                        {offerEndsLabel && <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '0.35rem' }}>Ends {offerEndsLabel}</span>}
                      </div>
                    )}
                    {showAllTimeLow && (
                      <div style={{ fontSize: '0.75rem', color: '#0f172a', marginBottom: '0.35rem', fontWeight: 600 }}>
                        All-time low {formatCurrency(lowestEver, resolvedCurrency)}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link 
                        to={`/products/${product.id}`}
                        className="btn-secondary"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem', padding: '0.6rem' }}
                      >
                        <Eye size={16} /> View Details
                      </Link>
                <button 
                  className="btn-primary" 
                  style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', opacity: product.stock?.quantity > 0 ? 1 : 0.5 }} 
                  disabled={product.stock?.quantity <= 0}
                  onClick={(e) => { e.preventDefault(); addToCart(product); }}
                >
                  <ShoppingCart size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
        )}
      </div>

      {comparing.length > 0 && (
        <div style={{ 
            position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', 
            backgroundColor: 'var(--text-main)', color: 'white', padding: '0.75rem 1.5rem', 
            borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '1.5rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', zIndex: 1000
        }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{comparing.length} products selected for comparison</span>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                    className="btn-primary" 
                    onClick={() => navigate(`/compare?ids=${comparing.join(',')}`)}
                    style={{ padding: '0.4rem 1.25rem', fontSize: '0.875rem', backgroundColor: '#8b5cf6' }}
                >
                    Compare Now
                </button>
                <button onClick={() => setComparing([])} style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
            </div>
        </div>
      )}
    </div>
  );
}
