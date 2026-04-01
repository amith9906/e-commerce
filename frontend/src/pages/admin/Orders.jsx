import React, { useState, useEffect, Fragment,useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/client';
import dayjs from 'dayjs';
import { Search, Calendar, ChevronDown, ChevronUp, X } from 'lucide-react';
import { getProductCover } from '../../utils/productImage';
import { formatCurrency } from '../../utils/formatCurrency';
import PaginationControls from '../../components/PaginationControls';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { useBrand } from '../../context/BrandContext';

const formatOfferExpiryLabel = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
};

const PAGE_LIMIT = 10;

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currency: brandCurrency = 'INR' } = useBrand();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, pages: 1, total: 0 });
  const [paymentLoadingId, setPaymentLoadingId] = useState(null);
  const [codCollectingId, setCodCollectingId] = useState(null);

  const userIdFilter = searchParams.get('userId');
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    q: '',
    userId: userIdFilter || ''
  });
  const [searchTerm, setSearchTerm] = useState(filters.q || '');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);

  const handleFiltersChange = (updates) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    setPage(1);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: PAGE_LIMIT };
      const res = await api.get('/orders', { params });
      if (res.success) {
        setOrders(res.data);
        const meta = res.pagination || { currentPage: page, pages: 1, total: res.data.length || 0 };
        setPagination(meta);
        if (meta.pages && page > meta.pages) {
          setPage(meta.pages);
        }
      }
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      q: debouncedSearchTerm
    }));
    setPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (userIdFilter !== filters.userId) {
      setFilters((prev) => ({ ...prev, userId: userIdFilter || '' }));
      setPage(1);
    }
  }, [userIdFilter, filters.userId]);

  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    let delayReason = '';
    let trackingNumber = '';
    if (newStatus === 'delayed') {
      delayReason = window.prompt('Please enter the reason for the delay. This will be emailed to the customer.');
      if (delayReason === null) return;
    }
    if (newStatus === 'shipped') {
      trackingNumber = window.prompt('Enter tracking number (optional, press Cancel to skip):') || '';
    }

    try {
      const payload = { status: newStatus, delayReason };
      if (trackingNumber) payload.trackingNumber = trackingNumber;
      const res = await api.patch(`/orders/${orderId}/status`, payload);
      if (res.success) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrders();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  });

  const handleConfirmPayment = async (paymentId, method) => {
    if (!paymentId) return;
    if (!window.confirm('Mark this payment as collected/confirmed?')) return;
    try {
      setPaymentLoadingId(paymentId);
      const res = await api.post(`/payments/${paymentId}/confirm`, {
        transactionRef: method === 'cod' ? `COD-${Date.now()}` : `ADMIN-${Date.now()}`,
        gatewayResponse: { source: method === 'cod' ? 'cod' : 'admin-override', status: 'confirmed' }
      });
      if (res.success) {
        toast.success('Payment confirmed and order updated.');
        fetchOrders();
      }
    } catch (err) {
      toast.error('Unable to confirm payment');
    } finally {
      setPaymentLoadingId(null);
    }
  };

  const handleCollectCod = async (orderId) => {
    if (!orderId) return;
    if (!window.confirm('Confirm COD collected and update order status?')) return;
    try {
      setCodCollectingId(orderId);
      const res = await api.post(`/orders/${orderId}/cod/collect`, {
        status: 'delivered'
      });
      if (res.success) {
        toast.success('COD marked as collected. Order status updated.');
        fetchOrders();
      }
    } catch (err) {
      toast.error('Unable to collect COD payment.');
    } finally {
      setCodCollectingId(null);
    }
  };

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'pending': return { bg: '#fef3c7', text: '#d97706' };
      case 'confirmed': return { bg: '#dbeafe', text: '#2563eb' };
      case 'shipped': return { bg: '#e0e7ff', text: '#4f46e5' };
      case 'delivered': return { bg: '#d1fae5', text: '#10b981' };
      case 'cancelled': return { bg: '#fee2e2', text: '#ef4444' };
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  });

  const getPaymentColor = (status) => {
    switch (status) {
      case 'completed':
      case 'success': return { bg: '#d1fae5', text: '#10b981' };
      case 'pending': return { bg: '#fef3c7', text: '#d97706' };
      case 'failed': return { bg: '#fee2e2', text: '#ef4444' };
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  const orderRows = useMemo(() => orders.map((order) => {
    const colors = getStatusColor(order.status);
    const payColors = getPaymentColor(order.payment?.status);
    const isExpanded = expandedOrder === order.id;
    return (
      <Fragment key={order.id}>
        <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--border-color)' }}>
          <td style={{ padding: '1rem' }}>
            <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </td>
          <td style={{ padding: '1rem' }}>
            <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>#{order.id.substring(0, 8)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dayjs(order.createdAt).format('MMM D, h:mm A')}</div>
          </td>
          <td style={{ padding: '1rem' }}>
            <div style={{ fontWeight: 600 }}>{order.user?.name || 'Guest'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {order.user?.email}
              {order.user?.phone ? ` · ${order.user.phone}` : ''}
            </div>
            {order.shippingAddressSnapshot && (
              <div style={{ fontSize: '0.7rem', color: '#475569' }}>
                {order.shippingAddressSnapshot.city}, {order.shippingAddressSnapshot.country}
              </div>
            )}
          </td>
          <td style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 800,
                backgroundColor: payColors.bg,
                color: payColors.text,
                textTransform: 'uppercase'
              }}
              >
                {order.payment?.status || 'N/A'}
              </span>
              {order.payment?.status === 'pending' && order.payment?.id && (
                <button
                  type="button"
                  disabled={paymentLoadingId === order.payment?.id}
                  onClick={() => handleConfirmPayment(order.payment?.id, order.payment?.paymentMethod)}
                  className="btn-secondary"
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    minWidth: '140px'
                  }}
                >
                  {paymentLoadingId === order.payment.id
                    ? 'Processing...'
                    : (order.payment.paymentMethod === 'cod' ? 'Mark COD collected' : 'Confirm payment')}
                </button>
              )}
              {order.payment?.paymentMethod === 'cod' && order.payment?.status === 'pending' && (
                <button
                  type="button"
                  disabled={codCollectingId === order.id}
                  onClick={() => handleCollectCod(order.id)}
                  className="btn-primary"
                  style={{ marginLeft: '0.5rem', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                >
                  {codCollectingId === order.id ? 'Collecting...' : 'Capture COD'}
                </button>
              )}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Method: {order.payment?.paymentMethod || 'Online'}
            </div>
          </td>
      <td style={{ padding: '1rem', fontWeight: 700 }}>{formatCurrency(order.totalAmount, brandCurrency)}</td>
          <td style={{ padding: '1rem' }}>
            <span style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: colors.bg,
              color: colors.text,
              textTransform: 'uppercase'
            }}
            >
              {order.status}
            </span>
          </td>
          <td style={{ padding: '1rem' }}>
            <select
              style={{ padding: '0.35rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8125rem', width: '100%' }}
              value={order.status}
              onChange={(e) => handleStatusChange(order.id, e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </td>
        </tr>
        {isExpanded && (
          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
            <td colSpan="7" style={{ padding: '2rem 3rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items Ordered</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {order.items?.map((item) => {
                      const expiryLabel = formatOfferExpiryLabel(item.product?.offerExpiresAt);
                      return (
                        <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <div style={{ width: '48px', height: '48px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <img src={getProductCover(item.product?.images)} alt={item.product?.name || 'Product'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.product?.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.quantity} x {formatCurrency(item.unitPrice, brandCurrency)}</div>
                            {item.product?.offerLabel && (
                              <div style={{ fontSize: '0.75rem', color: '#0f172a', marginTop: '0.25rem', fontWeight: 600 }}>
                                {item.product.offerLabel}
                              </div>
                            )}
                            {expiryLabel && (
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                Ends {expiryLabel}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery Address</h4>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                    {order.shippingAddressSnapshot ? (
                      <>
                        <p style={{ fontWeight: 600 }}>{order.user?.name}</p>
                        <p>{order.shippingAddressSnapshot.street}</p>
                        <p>{order.shippingAddressSnapshot.city}, {order.shippingAddressSnapshot.state} {order.shippingAddressSnapshot.zipCode}</p>
                        <p>{order.shippingAddressSnapshot.country}</p>
                      </>
                    ) : (
                      <p>Address details unavailable</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Summary</h4>
                  <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                                <span>Subtotal</span>
                                <span>{formatCurrency(Number(order.totalAmount) - Number(order.shippingFee) + Number(order.discountAmount), brandCurrency)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem', color: '#ef4444' }}>
                      <span>Discount</span>
                          <span>-{formatCurrency(order.discountAmount, brandCurrency)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                      <span>Shipping</span>
                          <span>{formatCurrency(order.shippingFee, brandCurrency)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700, paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', marginTop: '0.5rem' }}>
                      <span>Total</span>
                          <span>{formatCurrency(order.totalAmount, brandCurrency)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        )}
      </Fragment>
    );
  }), [orders, expandedOrder, handleCollectCod, handleConfirmPayment, paymentLoadingId, codCollectingId, getStatusColor, getPaymentColor, brandCurrency]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Order Management</h1>
        {filters.userId && (
          <button
            type="button"
            onClick={() => {
              setSearchParams({});
              handleFiltersChange({ userId: '' });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#ef4444',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: '1px solid currentColor',
              padding: '0.4rem 1rem',
              borderRadius: '4px'
            }}
          >
            <X size={16} /> Viewing specific customer orders (Clear)
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', minWidth: '300px', flex: 1 }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search Order ID or Customer Email..."
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="input-field"
          style={{ width: 'auto', marginBottom: 0 }}
          value={filters.status}
          onChange={(e) => handleFiltersChange({ status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={18} color="var(--text-muted)" />
          <input
            type="date"
            className="input-field"
            style={{ width: 'auto', marginBottom: 0 }}
            value={filters.startDate}
            onChange={(e) => handleFiltersChange({ startDate: e.target.value })}
          />
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '1rem' }} />
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Order Details</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Customer</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Payment</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Total</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>No orders found.</td>
              </tr>
            ) : (
              orders.map((order) => {
                const colors = getStatusColor(order.status);
                const payColors = getPaymentColor(order.payment?.status);
                const isExpanded = expandedOrder === order.id;
                return (
                  <Fragment key={order.id}>
                    <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem' }}>
                        <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>#{order.id.substring(0, 8)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dayjs(order.createdAt).format('MMM D, h:mm A')}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{order.user?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.user?.email}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            backgroundColor: payColors.bg,
                            color: payColors.text,
                            textTransform: 'uppercase'
                          }}
                          >
                            {order.payment?.status || 'N/A'}
                          </span>
                          {order.payment?.status === 'pending' && order.payment?.id && (
                            <button
                              type="button"
                              disabled={paymentLoadingId === order.payment?.id}
                              onClick={() => handleConfirmPayment(order.payment?.id, order.payment?.paymentMethod)}
                              className="btn-secondary"
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                minWidth: '140px'
                              }}
                            >
                              {paymentLoadingId === order.payment.id
                                ? 'Processing...'
                                : (order.payment.paymentMethod === 'cod' ? 'Mark COD collected' : 'Confirm payment')}
                            </button>
                          )}
                          {order.payment?.paymentMethod === 'cod' && order.payment?.status === 'pending' && (
                            <button
                              type="button"
                              disabled={codCollectingId === order.id}
                              onClick={() => handleCollectCod(order.id)}
                              className="btn-primary"
                              style={{ marginLeft: '0.5rem', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                            >
                              {codCollectingId === order.id ? 'Collecting...' : 'Capture COD'}
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Method: {order.payment?.paymentMethod || 'Online'}
                          {order.payment?.amount ? ` · ${formatCurrency(order.payment.amount, brandCurrency)}` : ''}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>{formatCurrency(order.totalAmount, brandCurrency)}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.3rem 0.75rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: colors.bg,
                          color: colors.text,
                          textTransform: 'uppercase'
                        }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <select
                          style={{ padding: '0.35rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8125rem', width: '100%' }}
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                        <td colSpan="7" style={{ padding: '2rem 3rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}>
                            <div>
                              <h4 style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items Ordered</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {order.items?.map((item) => {
                                  const expiryLabel = formatOfferExpiryLabel(item.product?.offerExpiresAt);
                                  return (
                                    <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                      <div style={{ width: '48px', height: '48px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                        <img src={getProductCover(item.product?.images)} alt={item.product?.name || 'Product'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.product?.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                          {item.quantity} x {formatCurrency(item.unitPrice, brandCurrency)}
                                        </div>
                                        {item.product?.offerLabel && (
                                          <div style={{ fontSize: '0.75rem', color: '#0f172a', marginTop: '0.25rem', fontWeight: 600 }}>
                                            {item.product.offerLabel}
                                          </div>
                                        )}
                                        {expiryLabel && (
                                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                            Ends {expiryLabel}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <div>
                              <h4 style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery Address</h4>
                              <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                                {order.shippingAddressSnapshot ? (
                                  <>
                                    <p style={{ fontWeight: 600 }}>{order.user?.name}</p>
                                    <p>{order.shippingAddressSnapshot.street}</p>
                                    <p>{order.shippingAddressSnapshot.city}, {order.shippingAddressSnapshot.state} {order.shippingAddressSnapshot.zipCode}</p>
                                    <p>{order.shippingAddressSnapshot.country}</p>
                                  </>
                                ) : (
                                  <p>Address details unavailable</p>
                                )}
                              </div>
                            </div>
                            {order.trackingNumber && (
                              <div>
                                <h4 style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tracking</h4>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 600, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.625rem 0.875rem' }}>
                                  {order.trackingNumber}
                                </div>
                              </div>
                            )}
                            <div>
                              <h4 style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Summary</h4>
                              <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                                  <span>Subtotal</span>
                                  <span>{formatCurrency(Number(order.totalAmount) - Number(order.shippingFee) + Number(order.discountAmount), brandCurrency)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem', color: '#ef4444' }}>
                                  <span>Discount</span>
                                  <span>-{formatCurrency(order.discountAmount, brandCurrency)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                                  <span>Shipping</span>
                                  <span>{formatCurrency(order.shippingFee, brandCurrency)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700, paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', marginTop: '0.5rem' }}>
                                  <span>Total</span>
                                  <span>{formatCurrency(order.totalAmount, brandCurrency)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
        <PaginationControls currentPage={pagination.currentPage || page} totalPages={pagination.pages || 1} onChange={(target) => setPage(target)} />
      </div>
    </div>
  );
}
