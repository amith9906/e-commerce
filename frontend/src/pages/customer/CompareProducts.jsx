import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../../api/client';
import { ShoppingCart, ArrowLeft, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { getProductCover } from '../../utils/productImage';

export default function CompareProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { addToCart } = useCart();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ids = params.get('ids')?.split(',') || [];
    
    if (ids.length > 0) {
      Promise.all(ids.map(id => api.get(`/products/${id}`)))
        .then(responses => {
          const fetched = responses.filter(r => r.success).map(r => r.data);
          setProducts(fetched);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [location.search]);

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Comparing products...</div>;
  if (products.length === 0) return (
    <div style={{ textAlign: 'center', padding: '5rem' }}>
      <h2>No products selected for comparison</h2>
      <Link to="/products" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Back to Shop</Link>
    </div>
  );

  const features = [
    { label: 'Price', key: 'price', format: (v) => `$${Number(v).toFixed(2)}` },
    { label: 'Category', key: 'category' },
    { label: 'Brand', key: 'brand' },
    { label: 'Color', key: 'color' },
    { label: 'Size', key: 'size' },
    { label: 'SKU', key: 'sku' },
    { label: 'Availability', key: 'stock', format: (v) => v?.quantity > 0 ? `${v.quantity} in stock` : 'Out of Stock' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/products" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={24} /></Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Compare Products</h1>
      </div>

      <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr>
              <th style={{ padding: '2rem', width: '200px', backgroundColor: '#f8fafc', borderBottom: '2px solid var(--border-color)' }}>Product</th>
              {products.map(p => (
                <th key={p.id} style={{ padding: '2rem', borderBottom: '2px solid var(--border-color)', verticalAlign: 'top' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '120px', height: '120px', margin: '0 auto 1rem', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={getProductCover(p.images)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <Link to={`/products/${p.id}`} style={{ display: 'block', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1rem', height: '3rem', overflow: 'hidden' }}>
                      {p.name}
                    </Link>
                    <button 
                      className="btn-primary" 
                      onClick={() => addToCart(p)}
                      disabled={p.stock?.quantity <= 0}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map(feat => (
              <tr key={feat.key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1.25rem 2rem', fontWeight: 600, color: 'var(--text-muted)', backgroundColor: '#f8fafc' }}>
                  {feat.label}
                </td>
                {products.map(p => (
                  <td key={p.id} style={{ padding: '1.25rem 2rem' }}>
                    {feat.format ? feat.format(p[feat.key]) : (p[feat.key] || 'N/A')}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td style={{ padding: '1.25rem 2rem', fontWeight: 600, color: 'var(--text-muted)', backgroundColor: '#f8fafc' }}>
                Description
              </td>
              {products.map(p => (
                <td key={p.id} style={{ padding: '1.25rem 2rem', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {p.description || 'No description available.'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
