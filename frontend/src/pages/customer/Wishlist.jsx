import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Heart, ShoppingBag, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import { getProductCover } from '../../utils/productImage';

export default function Wishlist() {
  const { wishlistItems, removeFromWishlist, addToCart } = useCart();

  const handleMoveToCart = (item) => {
    addToCart(item);
    removeFromWishlist(item.id);
  };

  if (wishlistItems.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 2rem', backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#fff1f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Heart size={40} color="#ef4444" fill="#ef4444" />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>Your Wishlist is Empty</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '400px', marginInline: 'auto' }}>Browse our collection and save your favorite items here to find them easily later!</p>
        <Link to="/products" className="btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} /> Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>My Wishlist</h1>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{wishlistItems.length} items saved</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
        {wishlistItems.map(product => (
          <div key={product.id} className="card" style={{ 
            display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', 
            borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative'
          }}>
            <button 
              onClick={() => removeFromWishlist(product.id)}
              style={{ 
                position: 'absolute', top: '12px', right: '12px', zIndex: 10,
                backgroundColor: 'white', border: '1px solid var(--border-color)',
                borderRadius: '50%', width: '32px', height: '32px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                color: '#ef4444', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}
            >
              <Trash2 size={16} />
            </button>

            <Link to={`/products/${product.id}`} style={{ display: 'block', height: '240px', backgroundColor: '#f8fafc' }}>
              <img src={getProductCover(product.images)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Link>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                {product.brand}
              </div>
              <Link to={`/products/${product.id}`} style={{ color: 'var(--text-main)', textDecoration: 'none' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', lineHeight: 1.4, height: '2.8em', overflow: 'hidden' }}>{product.name}</h3>
              </Link>
              
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>${Number(product.price).toFixed(2)}</div>
                <button 
                  onClick={() => handleMoveToCart(product)}
                  className="btn-primary"
                  style={{ 
                    padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700
                  }}
                >
                  <ShoppingCart size={16} /> Buy Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
