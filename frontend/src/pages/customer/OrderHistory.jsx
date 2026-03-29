import { useState, useEffect } from 'react';
import api from '../../api/client';
import dayjs from 'dayjs';
import { Filter, Calendar, RotateCcw, Package, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders', filters);
      if (res.success) setOrders(res.data);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

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

  const handleRequestReturn = async (orderId, type) => {
    const reason = window.prompt(`Please enter the reason for your ${type}:`);
    if (!reason) return;

    try {
      const res = await api.post(`/orders/${orderId}/returns`, { type, reason });
      if (res.success) {
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} request submitted!`);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit request');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>My Orders</h1>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', padding: '0.25rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select 
              style={{ border: 'none', outline: 'none', fontSize: '0.875rem', backgroundColor: 'transparent' }}
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
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', padding: '0.25rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
             <Calendar size={16} color="var(--text-muted)" />
             <input 
              type="date" 
              style={{ border: 'none', outline: 'none', fontSize: '0.875rem' }}
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading Orders...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', background: 'white', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <Package size={48} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map(order => {
            const colors = getStatusColor(order.status);
            return (
              <div key={order.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                  
                  <div style={{ display: 'flex', gap: '2rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.025em', marginBottom: '0.25rem' }}>Order Placed</div>
                      <div style={{ fontWeight: 600, fontSize: '0.925rem' }}>{dayjs(order.createdAt).format('MMM D, YYYY')}</div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.025em', marginBottom: '0.25rem' }}>Total</div>
                      <div style={{ fontWeight: 600, fontSize: '0.925rem' }}>${Number(order.totalAmount).toFixed(2)}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.025em', marginBottom: '0.25rem' }}>Order ID</div>
                      <div style={{ fontWeight: 600, fontSize: '0.925rem', fontFamily: 'monospace' }}>#{order.id.split('-')[0]}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ 
                      padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.75rem',
                      backgroundColor: colors.bg, color: colors.text, textTransform: 'uppercase', fontWeight: 700
                    }}>
                      {order.status}
                    </span>
                    {order.status === 'delivered' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleRequestReturn(order.id, 'return')}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <RotateCcw size={14} /> Return
                        </button>
                        <button 
                          onClick={() => handleRequestReturn(order.id, 'replacement')}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          Replace
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ padding: '1.5rem' }}>
                  {order.items?.map((item, idx) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: idx !== order.items.length - 1 ? '1.25rem' : 0 }}>
                      <div style={{ width: '70px', height: '70px', backgroundColor: '#f1f5f9', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        {item.product?.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : <Package size={24} color="#94a3b8" style={{ margin: '23px' }} />}
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{item.product?.name || 'Product Details Not Available'}</div>
                        <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                          <span>Quantity: <strong style={{ color: 'var(--text-main)' }}>{item.quantity}</strong></span>
                          <span>Price: <strong style={{ color: 'var(--text-main)' }}>${Number(item.unitPrice).toFixed(2)}</strong></span>
                        </div>
                      </div>
                      <ChevronRight size={20} color="#cbd5e1" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
