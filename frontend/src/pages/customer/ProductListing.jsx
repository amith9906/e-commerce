import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Filter as FilterIcon, ArrowUpDown, CheckSquare, Square, X, Heart } from 'lucide-react';

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState([]);
  const [meta, setMeta] = useState({ categories: [], brands: [], colors: [], sizes: [] });
  const [filters, setFilters] = useState({ category: '', brand: '', color: '', size: '', sort: 'newest', q: '' });
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();

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
    setFilters({ category: '', brand: '', color: '', size: '', sort: 'newest', q: '' });
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FilterIcon size={18} />
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Filters</h2>
          </div>
          <button onClick={clearFilters} style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Clear All</button>
        </div>

        {/* Category */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Category</label>
          <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)} className="input-field" style={{ marginBottom: 0 }}>
            <option value="">All Categories</option>
            {meta.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Brand */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Brand</label>
          <select value={filters.brand} onChange={(e) => handleFilterChange('brand', e.target.value)} className="input-field" style={{ marginBottom: 0 }}>
            <option value="">All Brands</option>
            {meta.brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Color */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Color</label>
          <select value={filters.color} onChange={(e) => handleFilterChange('color', e.target.value)} className="input-field" style={{ marginBottom: 0 }}>
            <option value="">All Colors</option>
            {meta.colors.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Size */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Size</label>
          <select value={filters.size} onChange={(e) => handleFilterChange('size', e.target.value)} className="input-field" style={{ marginBottom: 0 }}>
            <option value="">All Sizes</option>
            {meta.sizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
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
            {products.map(product => (
              <div key={product.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', position: 'relative', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
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

                <Link to={`/products/${product.id}`} style={{ display: 'block', height: '240px', backgroundColor: '#f8fafc' }}>
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No Image available</div>
                  )}
                </Link>

                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                    {product.brand}
                  </div>
                  <Link to={`/products/${product.id}`} style={{ color: 'var(--text-main)', textDecoration: 'none' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', lineHeight: 1.4, height: '2.8em', overflow: 'hidden' }}>{product.name}</h3>
                  </Link>
                  
                  {product.color || product.size ? (
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        {product.color && <span style={{ fontSize: '0.7rem', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>{product.color}</span>}
                        {product.size && <span style={{ fontSize: '0.7rem', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>{product.size}</span>}
                    </div>
                  ) : <div style={{ marginBottom: '1rem', height: '1.2em' }}></div>}

                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)' }}>${Number(product.price).toFixed(2)}</div>
                        {product.stock?.quantity <= 5 && product.stock?.quantity > 1 && (
                            <div style={{ fontSize: '0.65rem', color: '#d97706', fontWeight: 700 }}>Hurry! Only {product.stock.quantity} left</div>
                        )}
                        {product.stock?.quantity <= 1 && (
                            <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 700 }}>OUT OF STOCK</div>
                        )}
                    </div>
                    
                    <button 
                      className="btn-primary" 
                      style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', opacity: product.stock?.quantity > 1 ? 1 : 0.5 }} 
                      disabled={product.stock?.quantity <= 1}
                      onClick={(e) => { e.preventDefault(); addToCart(product); }}
                    >
                      <ShoppingCart size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
