import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/client';
import dayjs from 'dayjs';
import { Search, Filter, Calendar, ChevronDown, ChevronUp, User, Mail, DollarSign, CreditCard, X } from 'lucide-react';

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  
  const userIdFilter = searchParams.get('userId');
  const [filters, setFilters] = useState({ 
    status: '', 
    startDate: '', 
    endDate: '', 
    q: '',
    userId: userIdFilter || ''
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders', { ...filters, page, limit });
      if (res.success) {
        setOrders(res.data);
        if (res.pagination) setTotalPages(res.pagination.pages);
      }
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters, page]);

  // Sync if URL param changes
  useEffect(() => {
    if (userIdFilter !== filters.userId) {
        setFilters(f => ({ ...f, userId: userIdFilter || '' }));
    }
  }, [userIdFilter]);

  const handleStatusChange = async (orderId, newStatus) => {
    let delayReason = '';
    if (newStatus === 'delayed') {
      delayReason = window.prompt("Please enter the reason for the delay. This will be emailed to the customer.");
      if (delayReason === null) return;
    }
    
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: newStatus, delayReason });
      if (res.success) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrders();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handlePaymentStatusChange = async (orderId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this payment as ${newStatus}?`)) return;
    try {
      const res = await api.patch(`/orders/admin/payments/${orderId}`, { status: newStatus });
      if (res.success) {
        toast.success('Payment status updated');
        fetchOrders();
      }
    } catch (err) {
      toast.error('Failed to update payment status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return { bg: '#fef3c7', text: '#d97706' };
      case 'confirmed': return { bg: '#dbeafe', text: '#2563eb' };
      case 'shipped': return { bg: '#e0e7ff', text: '#4f46e5' };
      case 'delivered': return { bg: '#d1fae5', text: '#10b981' };
      case 'cancelled': return { bg: '#fee2e2', text: '#ef4444' };
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  const getPaymentColor = (status) => {
    switch (status) {
      case 'completed': return { bg: '#d1fae5', text: '#10b981' };
      case 'pending': return { bg: '#fef3c7', text: '#d97706' };
      case 'failed': return { bg: '#fee2e2', text: '#ef4444' };
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Order Management</h1>
        {filters.userId && (
            <button 
                onClick={() => {
                    setSearchParams({});
                    setFilters({ ...filters, userId: '' });
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.875rem', fontWeight: 600, border: '1px solid currentColor', padding: '0.4rem 1rem', borderRadius: '4px' }}
            >
                <X size={16} /> Viewing specific customer orders (Clear)
            </button>
        )}
      </div>
      
      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', minWidth: '300px', flex: 1 }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search Order ID or Customer Email..." 
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem' }}
            value={filters.q}
            onChange={(e) => setFilters({...filters, q: e.target.value})}
          />
        </div>
        <select 
          className="input-field" 
          style={{ width: 'auto', marginBottom: 0 }}
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
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
            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '1rem' }}></th>
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
              <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>No orders found.</td></tr>
            ) : (
              orders.map(order => {
                const colors = getStatusColor(order.status);
                const payColors = getPaymentColor(order.payment?.status);
                const isExpanded = expandedOrder === order.id;
                return (
                  <React.Fragment key={order.id}>
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
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <span style={{ 
                             padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800,
                             backgroundColor: payColors.bg, color: payColors.text, textTransform: 'uppercase'
                           }}>
                             {order.payment?.status || 'N/A'}
                           </span>
                           <select 
                             style={{ opacity: 0.5, border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.7rem' }}
                             value={order.payment?.status}
                             onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                           >
                             <option value="" disabled>Update</option>
                             <option value="pending">Mark Pending</option>
                             <option value="completed">Mark Completed</option>
                             <option value="failed">Mark Failed</option>
                           </select>
                         </div>
                         <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Method: {order.payment?.paymentMethod || 'Online'}</div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>${Number(order.totalAmount).toFixed(2)}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                          backgroundColor: colors.bg, color: colors.text, textTransform: 'uppercase'
                        }}>
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
                                 {order.items?.map(item => (
                                   <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                      <div style={{ width: '48px', height: '48px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                        {item.product?.images?.[0] && <img src={item.product.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.product?.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.quantity} x ${Number(item.unitPrice).toFixed(2)}</div>
                                      </div>
                                   </div>
                                 ))}
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
                                  ) : <p>Address details unavailable</p>}
                               </div>
                            </div>
                            <div>
                               <h4 style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Summary</h4>
                               <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                                     <span>Subtotal</span>
                                     <span>${(Number(order.totalAmount) - Number(order.shippingFee) + Number(order.discountAmount)).toFixed(2)}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem', color: '#ef4444' }}>
                                     <span>Discount</span>
                                     <span>-${Number(order.discountAmount).toFixed(2)}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                                     <span>Shipping</span>
                                     <span>${Number(order.shippingFee).toFixed(2)}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700, paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', marginTop: '0.5rem' }}>
                                     <span>Total</span>
                                     <span>${Number(order.totalAmount).toFixed(2)}</span>
                                  </div>
                               </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#fcfcfd' }}>
             {[...Array(totalPages)].map((_, i) => (
                <button
                   key={i}
                   onClick={() => setPage(i + 1)}
                   style={{
                      width: '36px', height: '36px', borderRadius: '8px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                      border: page === i + 1 ? 'none' : '1px solid var(--border-color)',
                      backgroundColor: page === i + 1 ? 'var(--primary-color)' : 'white',
                      color: page === i + 1 ? 'white' : 'var(--text-main)',
                      transition: '0.2s'
                   }}
                >
                   {i + 1}
                </button>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
import React from 'react';
