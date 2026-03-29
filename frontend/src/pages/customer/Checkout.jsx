import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, CheckCircle, ShieldCheck, QrCode, ArrowRight, Loader } from 'lucide-react';

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); 
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  
  // New States for Payment Intent
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [orderId, setOrderId] = useState(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const selectedAddressId = watch('shippingAddressId');

  useEffect(() => {
    if (cartItems.length === 0 && !orderId) {
      navigate('/cart', { replace: true });
    }
    
    if (user) {
      api.get('/users/me')
        .then(res => {
          if (res.success && res.data.addresses) {
            setAddresses(res.data.addresses);
          }
        })
        .catch(err => console.error('Failed to load addresses', err));
    }
  }, [cartItems, navigate, user, orderId]);

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

  const shippingFee = cartTotal > 2000 ? 0 : 50;
  const discountAmount = appliedCoupon?.discount || 0;
  const displayTotal = cartTotal - discountAmount + shippingFee;

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      let addressId = data.shippingAddressId;

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
         const newOrderId = orderRes.data.orderId;
         setOrderId(newOrderId);
         
         // Fetch order to get the payment ID
         const orderDetails = await api.get(`/orders/${newOrderId}`);
         const paymentId = orderDetails.data?.payment?.id;

         if (paymentId) {
            // Get Payment Intent from the factory logic
            const intentRes = await api.post('/payments/intent', { paymentId });
            if (intentRes.success) {
                setPaymentIntent({ ...intentRes.data, paymentId });
                // If it's mock, we might want to just show the button, 
                // but let's show the payment screen regardless for consistency.
            }
         }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to place order. Check stock availability.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizePayment = async () => {
    try {
        setLoading(true);
        // This would call /confirm. In a real Stripe integration, Stripe SDK would handle this.
        // For our multi-gateway demo, we'll call our confirm endpoint.
        const res = await api.post(`/payments/${paymentIntent.paymentId}/confirm`, {
            transactionRef: `TXN-${Date.now()}`,
            gatewayResponse: { mode: paymentIntent.mode, status: 'simulated_success' }
        });

        if (res.success) {
            toast.success('Payment Successful!');
            clearCart();
            navigate('/orders');
        }
    } catch (err) {
        toast.error('Payment failed. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  const showNewAddressFields = selectedAddressId === 'new' || addresses.length === 0;

  // Render Payment Screen if order is placed
  if (paymentIntent) {
      return (
          <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
              <div className="card" style={{ padding: '3rem' }}>
                  <div style={{ width: '80px', height: '80px', backgroundColor: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                      {paymentIntent.mode === 'qr' ? <QrCode size={40} color="var(--primary-color)" /> : <CreditCard size={40} color="var(--primary-color)" />}
                  </div>
                  
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Complete Payment</h1>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Total Amount: <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>${displayTotal.toFixed(2)}</span></p>

                  <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2.5rem', textAlign: 'left' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Instructions</p>
                      <p style={{ fontSize: '0.925rem', lineHeight: 1.6 }}>{paymentIntent.instructions || 'Please follow the gateway instructions to complete your transaction.'}</p>
                      
                      {paymentIntent.mode === 'qr' && (
                          <div style={{ marginTop: '1.5rem', textAlign: 'center', padding: '1rem', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                              <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '1rem' }}>Scan to Pay</div>
                              {/* In a real app, use a QR generator component here */}
                              <div style={{ width: '150px', height: '150px', margin: '0 auto', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <QrCode size={100} color="#cbd5e1" />
                              </div>
                              <p style={{ fontSize: '0.75rem', marginTop: '1rem', color: 'var(--text-muted)' }}>{paymentIntent.qrString}</p>
                          </div>
                      )}

                      {paymentIntent.mode === 'stripe' && (
                          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                              <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Stripe Elements would render here.</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Intent: {paymentIntent.clientSecret}</p>
                          </div>
                      )}
                  </div>

                  <button 
                    onClick={handleFinalizePayment}
                    disabled={loading}
                    className="btn-primary" 
                    style={{ width: '100%', height: '3.5rem', borderRadius: '12px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                  >
                    {loading ? <Loader className="animate-spin" size={20} /> : <><ShieldCheck size={20} /> Confirm Payment</>}
                  </button>
                  <button 
                    onClick={() => navigate('/orders')}
                    style={{ margin: '1.5rem 0 0', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Pay Later / View Order
                  </button>
              </div>
          </div>
      );
  }

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
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Payment Summary</h2>
            <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#f8fafc' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                You will be redirected to the secure payment screen after confirming your order details.
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
          style={{ width: '100%', marginTop: '2rem', padding: '1rem', fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
        >
          {loading ? 'Processing...' : <><ArrowRight size={20} /> Continue to Payment</>}
        </button>
      </div>

    </div>
  );
}
