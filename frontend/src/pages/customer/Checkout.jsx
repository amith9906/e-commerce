import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';
import { CreditCard, CheckCircle, ShieldCheck, QrCode, ArrowRight, Loader } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { calculateShippingFee, determineShippingZone, describeShippingZone } from '../../utils/shipping';

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { currency = 'INR', settings: brandSettings = {} } = useBrand();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); 
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState(null);
  const [applyingGiftCard, setApplyingGiftCard] = useState(false);
  const [giftCardMessage, setGiftCardMessage] = useState('');
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsInput, setPointsInput] = useState('');
  const [appliedPoints, setAppliedPoints] = useState(0);
  const [pointsPreviewCredit, setPointsPreviewCredit] = useState(0);
  const [pointsMessage, setPointsMessage] = useState('');
  const [applyingPoints, setApplyingPoints] = useState(false);
  const [pointsLoading, setPointsLoading] = useState(false);
  
  // New States for Payment Intent
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('online');
  const [codOrderDetails, setCodOrderDetails] = useState(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const selectedAddressId = watch('shippingAddressId');
  const watchedCity = watch('city');
  const watchedState = watch('state');
  const watchedCountry = watch('country');
  const watchedPostal = watch('postalCode');
  const showNewAddressFields = selectedAddressId === 'new' || addresses.length === 0;
  const mandatoryFieldRules = (rules) => (showNewAddressFields ? rules : {});
  const [deliveryCheck, setDeliveryCheck] = useState({ loading: false, isDeliverable: true, message: '' });
  const loyaltySettings = brandSettings?.loyalty || {};
  const valuePerPoint = Math.max(0, Number(loyaltySettings?.valuePerPoint || 1));
  const loyaltyRedemptionEnabled = loyaltySettings.redemptionEnabled !== false;
  const codEnabled = Boolean(brandSettings?.codEnabled);
  const paymentGatewayKey = brandSettings?.paymentGateway || 'mock';
  const paymentGatewayLabel = paymentGatewayKey === 'stripe'
    ? 'Stripe'
    : paymentGatewayKey === 'qr'
      ? 'Dynamic UPI/QR'
      : paymentGatewayKey === 'mock'
        ? 'Demo gateway'
        : paymentGatewayKey;
  const shippingSettings = brandSettings?.shipping || {};
  const selectedSavedAddress = addresses.find((addr) => addr.id === selectedAddressId);
  const shippingAddressForCalc = selectedAddressId === 'new' || !selectedSavedAddress
    ? { city: watchedCity, state: watchedState, country: watchedCountry, postalCode: watchedPostal }
    : selectedSavedAddress;
  const shippingZone = determineShippingZone(shippingSettings.origin || {}, shippingAddressForCalc);
  const shippingFee = calculateShippingFee({ shippingSettings, address: shippingAddressForCalc, cartTotal });
  const shippingZoneLabel = describeShippingZone(shippingZone);
  const shippingZoneMessage = shippingAddressForCalc?.country
    ? shippingZoneLabel
    : 'Enter an address to calculate the shipping zone.';

  useEffect(() => {
    if (!codEnabled && selectedPaymentMethod === 'cod') {
      setSelectedPaymentMethod('online');
    }
  }, [codEnabled, selectedPaymentMethod]);

  const paymentOptions = [
    {
      id: 'online',
      title: 'Pay securely',
      description: `Checkout via ${paymentGatewayLabel}`,
      subText: `Cards, wallets, UPI or mock payments`
    },
    ...(codEnabled
      ? [{
          id: 'cod',
          title: 'Cash on Delivery',
          description: 'Pay the courier in cash when your order arrives',
          subText: 'COD orders require payment collection and manual confirmation in the admin panel'
        }]
      : [])
  ];

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

  const loadLoyaltyBalance = async () => {
    if (!loyaltyRedemptionEnabled) return;
    try {
      setPointsLoading(true);
      const res = await api.get('/loyalty/balance');
      if (res?.data?.balance !== undefined) {
        setPointsBalance(Number(res.data.balance));
      }
    } catch (err) {
      console.error('Failed to load loyalty balance', err);
    } finally {
      setPointsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadLoyaltyBalance();
    }
  }, [user, loyaltyRedemptionEnabled]);

  useEffect(() => {
    const runValidation = async (address) => {
      if (!address) return;
      setDeliveryCheck((prev) => ({ ...prev, loading: true }));
      try {
        const res = await api.get('/delivery/availability', {
          params: {
            productId: cartItems[0]?.productId,
            country: address.country,
            state: address.state,
            city: address.city,
            postalCode: address.postalCode
          }
        });
        if (res.success) {
          setDeliveryCheck({
            loading: false,
            isDeliverable: res.data.isDeliverable,
            message: res.data.isDeliverable
              ? `${res.data.matchedRegion?.name || 'Delivery'} confirmed`
              : 'Selected address is outside configured delivery regions.'
          });
        }
      } catch {
        setDeliveryCheck({
          loading: false,
          isDeliverable: false,
          message: 'Unable to verify delivery availability.'
        });
      }
    };

    if (selectedAddressId && selectedAddressId !== 'new') {
      const address = addresses.find((addr) => addr.id === selectedAddressId);
      runValidation(address);
    } else if (showNewAddressFields) {
      runValidation({
        country: watchedCountry,
        state: watchedState,
        city: watchedCity,
        postalCode: watchedPostal
      });
    }
  }, [selectedAddressId, addresses, showNewAddressFields, watchedCity, watchedState, watchedCountry, watchedPostal, cartItems]);

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

  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) return;
    try {
      setApplyingGiftCard(true);
      const res = await api.post('/gift-cards/validate', { code: giftCardCode.trim() });
      setAppliedGiftCard(res.data);
      const expiryNote = res.data.expiresAt ? ` (expires ${new Date(res.data.expiresAt).toLocaleDateString()})` : '';
      setGiftCardMessage(`Gift card ${res.data.code} ready to cover up to ${formatCurrency(res.data.balance, currency)}${expiryNote}.`);
      toast.success('Gift card applied!');
    } catch (err) {
      setAppliedGiftCard(null);
      setGiftCardMessage('');
      toast.error(err.message || 'Invalid gift card code.');
    } finally {
      setApplyingGiftCard(false);
    }
  };

  const handleApplyPoints = () => {
    if (!loyaltyRedemptionEnabled) {
      setPointsMessage('Point redemption is disabled for this store.');
      return;
    }
    const requested = Math.max(0, Math.floor(Number(pointsInput) || 0));
    const usablePoints = Math.min(requested, pointsBalance, pointsCapByAmount);
    setAppliedPoints(usablePoints);
    const credit = usablePoints * valuePerPoint;
    setPointsPreviewCredit(credit);
    if (usablePoints > 0) {
      setPointsMessage(`Applying ${usablePoints} point${usablePoints > 1 ? 's' : ''} saves ${formatCurrency(credit, currency)}.`);
      toast.success('Points applied!');
    } else {
      setPointsMessage('No points could be applied. Check your balance or reduce the amount.');
      toast.info('Adjust the point amount or ensure you have enough balance.');
    }
  };

  const handleClearPoints = () => {
    setAppliedPoints(0);
    setPointsPreviewCredit(0);
    setPointsInput('');
    setPointsMessage('');
  };

  const handleClearGiftCard = () => {
    setAppliedGiftCard(null);
    setGiftCardCode('');
    setGiftCardMessage('');
  };

  const taxRate = Number(brandSettings?.taxRate || 0);
  const taxLabel = brandSettings?.taxLabel || 'Tax';
  const discountAmount = appliedCoupon?.discount || 0;
  const taxableAmount = cartTotal - discountAmount;
  const taxAmount = taxRate > 0 ? Math.round(taxableAmount * (taxRate / 100) * 100) / 100 : 0;
  const displayTotal = taxableAmount + taxAmount + shippingFee;
  const giftCardBalance = Number(appliedGiftCard?.balance || 0);
  const giftCardCredit = appliedGiftCard ? Math.min(giftCardBalance, displayTotal) : 0;
  const displayTotalAfterGiftCard = Math.max(displayTotal - giftCardCredit, 0);
  const pointsCapByAmount = valuePerPoint > 0 ? Math.floor(displayTotalAfterGiftCard / valuePerPoint) : 0;
  const totalAfterPointsPreview = Math.max(displayTotalAfterGiftCard - pointsPreviewCredit, 0);

  const onSubmit = async (data) => {
    try {
      setPaymentIntent(null);
      setCodOrderDetails(null);
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

      const resolvedPaymentMethod = selectedPaymentMethod === 'cod' ? 'cod' : 'online';

      const orderRes = await api.post('/orders', {
        items: orderItems,
        shippingAddressId: addressId,
        notes: data.notes || '',
        couponCode: appliedCoupon ? couponCode : undefined,
        giftCardCode: appliedGiftCard ? appliedGiftCard.code : undefined,
        pointsToRedeem: appliedPoints || undefined,
        paymentMethod: resolvedPaymentMethod
      });

      if (orderRes.success) {
        const newOrderId = orderRes.data.orderId;
        setOrderId(newOrderId);
        loadLoyaltyBalance();
        const isCodOrder = orderRes.data.isCod || resolvedPaymentMethod === 'cod';

        if (isCodOrder) {
          clearCart();
          setCodOrderDetails({
            orderId: newOrderId,
            paymentId: orderRes.data.paymentId,
            amountDue: Number(orderRes.data.amountDue || 0)
          });
          return;
        }

        const paymentId = orderRes.data.paymentId;
        if (paymentId) {
          const intentRes = await api.post('/payments/intent', { paymentId });
          if (intentRes.success) {
            setPaymentIntent({ ...intentRes.data, paymentId });
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

  // Render Payment Screen if order is placed
  if (paymentIntent) {
      return (
          <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
              <div className="card" style={{ padding: '3rem' }}>
                  <div style={{ width: '80px', height: '80px', backgroundColor: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                      {paymentIntent.mode === 'qr' ? <QrCode size={40} color="var(--primary-color)" /> : <CreditCard size={40} color="var(--primary-color)" />}
                  </div>
                  
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Complete Payment</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Total Amount: <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{formatCurrency(totalAfterPointsPreview, currency)}</span></p>

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

  if (codOrderDetails) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3rem' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: '#ecfccb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
            <CheckCircle size={40} color="#15803d" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Order placed</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Order #{codOrderDetails.orderId?.substring(0, 8)} is confirmed. Please pay <strong>{formatCurrency(Number(codOrderDetails.amountDue || 0), currency)}</strong> in cash when the courier delivers your items.</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>We&apos;ll notify you once the delivery is marked complete and the payment is collected.</p>
          <button onClick={() => navigate('/orders')} className="btn-primary" style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', fontSize: '1rem', marginBottom: '0.75rem' }}>
            View my orders
          </button>
          <button onClick={() => navigate('/')} style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', fontSize: '1rem', border: '1px solid var(--border-color)', background: 'white', color: 'var(--text-muted)' }}>
            Continue shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="responsive-stack" style={{ width: '100%' }}>
      
      <div className="card" style={{ flex: '1 1 60%', minWidth: 0 }}>
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
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    Full Name<span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>*</span>
                  </label>
                  <input
                    aria-invalid={errors.fullName ? 'true' : 'false'}
                    {...register(
                      'fullName',
                      mandatoryFieldRules({
                        required: 'Full name is required when adding a new address.',
                        minLength: { value: 3, message: 'Enter at least 3 characters.' }
                      })
                    )}
                    className="input-field"
                    placeholder="John Doe"
                  />
                  {errors.fullName && <p className="error-text">{errors.fullName.message}</p>}
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    Address Line 1<span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>*</span>
                  </label>
                  <input
                    aria-invalid={errors.addressLine1 ? 'true' : 'false'}
                    {...register(
                      'addressLine1',
                      mandatoryFieldRules({
                        required: 'Address line is required.',
                        minLength: { value: 5, message: 'Provide a more detailed address.' }
                      })
                    )}
                    className="input-field"
                    placeholder="123 Main St"
                  />
                  {errors.addressLine1 && <p className="error-text">{errors.addressLine1.message}</p>}
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    City<span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>*</span>
                  </label>
                  <input
                    aria-invalid={errors.city ? 'true' : 'false'}
                    {...register(
                      'city',
                      mandatoryFieldRules({ required: 'City is mandatory.' })
                    )}
                    className="input-field"
                    placeholder="New York"
                  />
                  {errors.city && <p className="error-text">{errors.city.message}</p>}
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    State / Province<span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>*</span>
                  </label>
                  <input
                    aria-invalid={errors.state ? 'true' : 'false'}
                    {...register(
                      'state',
                      mandatoryFieldRules({ required: 'State or province is required.' })
                    )}
                    className="input-field"
                    placeholder="New York"
                  />
                  {errors.state && <p className="error-text">{errors.state.message}</p>}
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    Country<span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>*</span>
                  </label>
                  <input
                    aria-invalid={errors.country ? 'true' : 'false'}
                    {...register(
                      'country',
                      mandatoryFieldRules({ required: 'Country is required.' })
                    )}
                    className="input-field"
                    placeholder="India"
                    defaultValue="India"
                  />
                  {errors.country && <p className="error-text">{errors.country.message}</p>}
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    ZIP / Postal Code<span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>*</span>
                  </label>
                  <input
                    aria-invalid={errors.postalCode ? 'true' : 'false'}
                    {...register(
                      'postalCode',
                      mandatoryFieldRules({
                        required: 'Postal code is mandatory.',
                        pattern: {
                          value: /^[0-9]{5,10}$/,
                          message: 'Enter a valid postal code.'
                        }
                      })
                    )}
                    className="input-field"
                    placeholder="10001"
                  />
                  {errors.postalCode && <p className="error-text">{errors.postalCode.message}</p>}
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    Mobile number<span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>*</span>
                  </label>
                  <input
                    aria-invalid={errors.phone ? 'true' : 'false'}
                    {...register(
                      'phone',
                      mandatoryFieldRules({
                        required: 'Mobile number is required.',
                        pattern: {
                          value: /^[6-9]\d{9}$/,
                          message: 'Enter a valid 10-digit Indian number.'
                        }
                      })
                    )}
                    className="input-field"
                    placeholder="9876543210"
                    inputMode="tel"
                  />
                  {errors.phone && <p className="error-text">{errors.phone.message}</p>}
                </div>
              </div>
            )}
            {deliveryCheck.message && (
              <p style={{ marginTop: '1rem', color: deliveryCheck.isDeliverable ? '#047857' : '#dc2626', fontWeight: 600 }}>
                {deliveryCheck.loading ? 'Verifying delivery availability…' : deliveryCheck.message}
              </p>
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
            <div style={{ marginTop: '1.5rem', display: 'grid', gap: '0.75rem' }}>
              {paymentOptions.map((option) => {
                const isSelected = selectedPaymentMethod === option.id;
                return (
                  <label
                    key={option.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      padding: '0.9rem 1rem',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? '#eef2ff' : 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.id}
                        checked={isSelected}
                        onChange={() => setSelectedPaymentMethod(option.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: 700 }}>{option.title}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{option.description}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{option.subText}</span>
                  </label>
                );
              })}
            </div>
          </div>

        </form>
      </div>

      <div className="card" style={{ flex: '1 1 30%', minWidth: '280px', position: 'sticky', top: '5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Order Summary</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          {cartItems.map(item => (
            <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{item.quantity}x {item.name}</span>
              <span>{formatCurrency(item.price * item.quantity, currency)}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-muted)' }}>
          <span>Subtotal</span>
          <span>{formatCurrency(cartTotal, currency)}</span>
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
              Coupon "{couponCode}" applied: -{formatCurrency(appliedCoupon.discount, currency)}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Gift Card</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter gift card code" 
              value={giftCardCode}
              onChange={(e) => setGiftCardCode(e.target.value)}
              style={{ padding: '0.5rem', marginBottom: 0 }}
              disabled={Boolean(appliedGiftCard)}
            />
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handleApplyGiftCard}
              disabled={applyingGiftCard || !(giftCardCode.trim())}
              style={{ width: 'auto', padding: '0.5rem 1rem' }}
            >
              {applyingGiftCard ? '...' : (appliedGiftCard ? 'Revalidate' : 'Apply')}
            </button>
          </div>
          {giftCardMessage && (
            <p style={{ fontSize: '0.75rem', color: appliedGiftCard ? '#10b981' : '#f97316', marginTop: '0.25rem' }}>
              {giftCardMessage}
            </p>
          )}
          {appliedGiftCard && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', alignItems: 'center' }}>
              <span>
                Gift card {appliedGiftCard.code} applied: -{formatCurrency(giftCardCredit, currency)} (balance {formatCurrency(giftCardBalance, currency)})
              </span>
              <button 
                type="button" 
                onClick={handleClearGiftCard}
                style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.75rem' }}
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Redeem loyalty points</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              className="input-field"
              placeholder="Points to use"
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              style={{ padding: '0.5rem', marginBottom: 0 }}
              min={0}
              disabled={!loyaltyRedemptionEnabled || pointsCapByAmount <= 0}
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={handleApplyPoints}
              disabled={!loyaltyRedemptionEnabled || pointsCapByAmount <= 0 || applyingPoints}
              style={{ width: 'auto', padding: '0.5rem 1rem' }}
            >
              {applyingPoints ? '...' : (appliedPoints ? 'Update' : 'Apply')}
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Points available: {pointsLoading ? 'loading...' : pointsBalance} {valuePerPoint ? `(worth ${formatCurrency(pointsBalance * valuePerPoint, currency)})` : ''}
          </p>
          {pointsMessage && (
            <p style={{ fontSize: '0.75rem', color: appliedPoints ? '#10b981' : '#f97316', marginTop: '0.25rem' }}>
              {pointsMessage}
            </p>
          )}
          {appliedPoints > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', alignItems: 'center' }}>
              <span>
                Applying {appliedPoints} point{appliedPoints > 1 ? 's' : ''} to cover {formatCurrency(pointsPreviewCredit, currency)}.
              </span>
              <button
                type="button"
                onClick={handleClearPoints}
                style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.75rem' }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
        
        {appliedCoupon && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#10b981' }}>
            <span>Discount</span>
            <span>-{formatCurrency(appliedCoupon.discount, currency)}</span>
          </div>
        )}
        
        {taxAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-muted)' }}>
            <span>{taxLabel} ({taxRate}%)</span>
            <span>{formatCurrency(taxAmount, currency)}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-muted)' }}>
          <span>Shipping</span>
          {shippingFee === 0 ? (
            <span style={{ color: '#10b981' }}>Free</span>
          ) : (
            <span>{formatCurrency(shippingFee, currency)}</span>
          )}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '1rem' }}>
          Shipping zone: <strong>{shippingZoneMessage}</strong>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', fontWeight: 600, fontSize: '1.25rem' }}>
          <span>Total To Pay</span>
          <span>{formatCurrency(totalAfterPointsPreview, currency)}</span>
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
