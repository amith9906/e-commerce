import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Trash2, Heart, ArrowRight, ShoppingBag } from 'lucide-react';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart, addToWishlist } = useCart();

  const handleMoveToWishlist = (item) => {
    addToWishlist({
        id: item.productId,
        name: item.name,
        price: item.price,
        images: [item.imageUrl],
        brand: item.brand
    });
    removeFromCart(item.productId);
  };

  if (cartItems.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 2rem', backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <ShoppingBag size={40} color="var(--text-muted)" />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>Your Cart is Empty</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '400px', marginInline: 'auto' }}>Looks like you haven't added anything to your cart yet. Browse our products and find something you love!</p>
        <Link to="/products" className="btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            Explore Shop <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>Shopping Cart</h1>
        <button 
            onClick={clearCart} 
            style={{ color: '#ef4444', background: 'none', border: '1px solid #fee2e2', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
            <Trash2 size={16} /> Clear Cart
        </button>
      </div>

      <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Cart Items List */}
        <div style={{ flex: '1 1 65%' }}>
          {cartItems.map((item, index) => (
            <div key={item.productId} className="card" style={{ 
              display: 'flex', gap: '1.5rem', padding: '1.5rem', 
              marginBottom: '1rem', borderRadius: '16px', border: '1px solid var(--border-color)',
              transition: 'transform 0.2s'
            }}>
              
              <div style={{ width: '120px', height: '120px', backgroundColor: '#f8fafc', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>No Image</div>
                )}
              </div>

              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>{item.brand}</div>
                        <Link to={`/products/${item.productId}`} style={{ color: 'var(--text-main)', textDecoration: 'none' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{item.name}</h3>
                        </Link>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>${Number(item.price).toFixed(2)}</div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '10px', padding: '0.25rem' }}>
                    <button 
                      style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >-</button>
                    <span style={{ padding: '0 1.25rem', fontSize: '1rem', fontWeight: 700 }}>{item.quantity}</span>
                    <button 
                      style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >+</button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        onClick={() => handleMoveToWishlist(item)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                    >
                        <Heart size={18} /> Save for later
                    </button>
                    <button 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.875rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                        onClick={() => removeFromCart(item.productId)}
                    >
                        <Trash2 size={18} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div style={{ flex: '1 1 30%', minWidth: '320px', position: 'sticky', top: '7rem' }}>
          <div className="card" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', color: 'var(--text-main)' }}>Summary</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '1rem' }}>
                <span>Subtotal ({cartItems.length} items)</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>${cartTotal.toFixed(2)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '1rem' }}>
                <span>Estimated Shipping</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>FREE</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '1rem' }}>
                <span>Tax</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>$0.00</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px dashed var(--border-color)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-main)' }}>
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
            </div>

            <Link to="/checkout" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', height: '3.5rem', marginTop: '2.5rem', borderRadius: '16px', fontSize: '1.125rem', fontWeight: 700 }}>
                Checkout <ArrowRight size={20} />
            </Link>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <Link to="/products" style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>Continue Shopping</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
