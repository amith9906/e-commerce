import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { discount, couponId }
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const selectedAddressId = watch('shippingAddressId');

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart', { replace: true });
    }
    
    // Fetch user's saved addresses
    if (user) {
      api.get('/users/me')
        .then(res => {
          if (res.success && res.data.addresses) {
            setAddresses(res.data.addresses);
          }
        })
        .catch(err => console.error('Failed to load addresses', err));
    }
  }, [cartItems, navigate, user]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setValidatingCoupon(true);
      const res = await api.post('/coupons/validate', { 
        code: couponCode, 
        orderAmount: cartTotal 
      });
      if (res.success) {
        setAppliedCoupon(res.data);
        toast.success('Coupon applied!');
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.message || 'Invalid coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Logic mirroring backend for display
  const shippingFee = cartTotal > 2000 ? 0 : 50;
  const discountAmount = appliedCoupon?.discount || 0;
  // Note: Automatic promotions (>5k) will be applied by backend, 
  // we could fetch them here too for better UX but for now we'll just show the coupon discount.
  const displayTotal = cartTotal - discountAmount + shippingFee;

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      let addressId = data.shippingAddressId;

      // If they chose to create a new address or have none
      if (addressId === 'new' || addresses.length === 0) {
        const addressRes = await api.post('/users/addresses', {
          fullName: data.fullName,
          addressLine1: data.addressLine1,
          city: data.city,
          country: data.country,
          postalCode: data.postalCode,
          phone: data.phone,
          isDefault: true
        });
        
        if (addressRes.success) {
          addressId = addressRes.data.id;
        } else {
          throw new Error('Failed to save new address');
        }
      }

      // Format items for the API
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const orderRes = await api.post('/orders', {
        items: orderItems,
        shippingAddressId: addressId,
        notes: data.notes || '',
        couponCode: appliedCoupon ? couponCode : undefined
      });

      if (orderRes.success) {
        // Automatically mock successful payment for demo
        const { orderId } = orderRes.data;
        
        // Fetch the order to get the payment ID
        const orderDetails = await api.get(`/orders/${orderId}`);
        const paymentId = orderDetails.data?.payment?.id;

        if (paymentId) {
          await api.post(`/payments/${paymentId}/mock-success`);
          toast.success('Order placed and payment successful!');
        } else {
          toast.success('Order placed successfully!');
        }
        
        clearCart();
        navigate('/orders');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to place order. Check stock availability.');
    } finally {
      setLoading(false);
    }
  };

  const showNewAddressFields = selectedAddressId === 'new' || addresses.length === 0;

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      
      <div className="card" style={{ flex: '1 1 60%' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>Checkout securely</h1>
        
        <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Shipping Information</h2>
            
            {addresses.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Saved Addresses</label>
                <select 
                  {...register('shippingAddressId')} 
                  className="input-field" 
                  defaultValue={addresses.find(a => a.isDefault)?.id || addresses[0].id}
                >
                  {addresses.map(a => (
                    <option key={a.id} value={a.id}>{a.fullName} - {a.addressLine1}, {a.city}</option>
                  ))}
                  <option value="new">+ Add a new address</option>
                </select>
              </div>
            )}

            {showNewAddressFields && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Full Name</label>
                  <input {...register('fullName', { required: showNewAddressFields })} className="input-field" placeholder="John Doe" />
                  {errors.fullName && <p className="error-text">Required</p>}
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Address Line 1</label>
                  <input {...register('addressLine1', { required: showNewAddressFields })} className="input-field" placeholder="123 Main St" />
                  {errors.addressLine1 && <p className="error-text">Required</p>}
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>City</label>
                  <input {...register('city', { required: showNewAddressFields })} className="input-field" placeholder="New York" />
                  {errors.city && <p className="error-text">Required</p>}
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Country</label>
                  <input {...register('country', { required: showNewAddressFields })} className="input-field" placeholder="US" defaultValue="US" />
                  {errors.country && <p className="error-text">Required</p>}
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>ZIP / Postal Code</label>
                  <input {...register('postalCode')} className="input-field" placeholder="10001" />
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Phone (Optional)</label>
                  <input {...register('phone')} className="input-field" placeholder="555-0100" />
                </div>
              </div>
            )}
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Payment</h2>
            <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#f8fafc' }}>
              <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Demo Payment System</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                This is a mock checkout flow. Clicking "Place Order" will automatically mark the payment as successful 
                and confirm your order. Real credit card details are not required.
              </p>
            </div>
          </div>

        </form>
      </div>

      <div className="card" style={{ flex: '1 1 30%', minWidth: '300px', position: 'sticky', top: '5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Order Summary</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          {cartItems.map(item => (
            <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{item.quantity}x {item.name}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-muted)' }}>
          <span>Subtotal</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Apply Coupon</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter code" 
              value={couponCode} 
              onChange={(e) => setCouponCode(e.target.value)}
              style={{ padding: '0.5rem', marginBottom: 0 }}
            />
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handleApplyCoupon}
              disabled={validatingCoupon || !couponCode}
              style={{ width: 'auto', padding: '0.5rem 1rem' }}
            >
              {validatingCoupon ? '...' : 'Apply'}
            </button>
          </div>
          {appliedCoupon && (
            <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
              Coupon "{couponCode}" applied: -${appliedCoupon.discount.toFixed(2)}
            </p>
          )}
        </div>
        
        {appliedCoupon && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#10b981' }}>
            <span>Discount</span>
            <span>-${appliedCoupon.discount.toFixed(2)}</span>
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-muted)' }}>
          <span>Shipping</span>
          {shippingFee === 0 ? (
            <span style={{ color: '#10b981' }}>Free</span>
          ) : (
            <span>${shippingFee.toFixed(2)}</span>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', fontWeight: 600, fontSize: '1.25rem' }}>
          <span>Total To Pay</span>
          <span>${displayTotal.toFixed(2)}</span>
        </div>

        <button 
          type="submit" 
          form="checkout-form"
          className="btn-primary" 
          disabled={loading}
          style={{ width: '100%', marginTop: '2rem', padding: '1rem', fontSize: '1.125rem' }}
        >
          {loading ? 'Processing...' : `Pay $${displayTotal.toFixed(2)}`}
        </button>
      </div>

    </div>
  );
}
