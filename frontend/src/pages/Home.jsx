import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useBrand } from '../context/BrandContext';
import { ShoppingCart } from 'lucide-react';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { storeName } = useBrand();

  useEffect(() => {
    api.get('/products?limit=8')
      .then(res => {
        if (res.success) setProducts(res.data);
      })
      .catch(err => console.error('Failed to load products', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero Banner */}
      <div style={{
        backgroundColor: 'var(--primary-color)',
        color: 'white',
        borderRadius: '8px',
        padding: '4rem 2rem',
        textAlign: 'center',
        marginBottom: '3rem'
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>
          Welcome to {storeName}
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
          Discover our curated collection of premium products. 
          Sign up today to start shopping!
        </p>
      </div>

      {/* Featured Products */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Featured Products</h2>
        <Link to="/products" style={{ fontWeight: 500, color: 'var(--primary-color)' }}>View All &rarr;</Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading products...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '8px' }}>
          No products available right now.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          {products.map(product => (
            <div key={product.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
              <div style={{ height: '200px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>No Image</span>
                )}
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                  {product.category || 'General'}
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>{product.name}</h3>
                
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>${Number(product.price).toFixed(2)}</span>
                  <button className="btn-primary" style={{ padding: '0.5rem', display: 'flex' }} title="Add to Cart">
                    <ShoppingCart size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
