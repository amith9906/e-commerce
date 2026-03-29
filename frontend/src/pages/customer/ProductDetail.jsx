import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, CheckCircle, Table, Info, Truck, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get(`/products/${id}`)
      .then(res => { 
        if (res.success) {
          setProduct(res.data);
          setSelectedImage(0);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

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

  const inStock = product.stock?.quantity > 1;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Breadcrumbs */}
      <nav style={{ marginBottom: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Home / {product.category} / <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{product.name}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', marginBottom: '4rem' }}>
        
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
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)' }}>${Number(product.price).toFixed(2)}</span>
            {product.price > 1000 && <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '1.25rem' }}>${(product.price * 1.2).toFixed(2)}</span>}
          </div>

          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '1.125rem', marginBottom: '2rem' }}>
            {product.description?.substring(0, 200)}...
          </p>

          <div style={{ 
            padding: '2rem', backgroundColor: 'white', borderRadius: '24px', border: '1px solid var(--border-color)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
               <span style={{ fontWeight: 600 }}>Quantity</span>
               <span style={{ color: inStock ? '#10b981' : '#ef4444', fontSize: '0.875rem', fontWeight: 700 }}>
                 {inStock ? `In Stock (${product.stock.quantity})` : 'Out of Stock'}
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
        </div>
      </div>

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
    </div>
  );
}
