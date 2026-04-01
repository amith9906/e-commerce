import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft, Package, CheckCircle, Truck, Home, Clock,
  XCircle, Download, Mail, Copy, MapPin, CreditCard
} from 'lucide-react';
import dayjs from 'dayjs';
import api from '../../api/client';
import { useBrand } from '../../context/BrandContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { getProductCover } from '../../utils/productImage';

const STEPS = [
  { key: 'pending',   label: 'Order Placed',  icon: Package },
  { key: 'confirmed', label: 'Confirmed',      icon: CheckCircle },
  { key: 'shipped',   label: 'Shipped',        icon: Truck },
  { key: 'delivered', label: 'Delivered',      icon: Home },
];

const STATUS_ORDER = ['pending', 'confirmed', 'shipped', 'delivered'];

const STATUS_META = {
  pending:   { color: '#f59e0b', bg: '#fef3c7', label: 'Order Placed' },
  confirmed: { color: '#3b82f6', bg: '#dbeafe', label: 'Confirmed' },
  shipped:   { color: '#6366f1', bg: '#e0e7ff', label: 'Shipped' },
  delivered: { color: '#10b981', bg: '#d1fae5', label: 'Delivered' },
  cancelled: { color: '#ef4444', bg: '#fee2e2', label: 'Cancelled' },
  delayed:   { color: '#f97316', bg: '#fff7ed', label: 'Delayed' },
};

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currency = 'INR', storeName } = useBrand();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${id}`);
        if (res.success) setOrder(res.data);
        else toast.error('Order not found');
      } catch {
        toast.error('Failed to load order');
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleDownloadInvoice = async () => {
    try {
      const blob = await api.get(`/orders/${id}/invoice/pdf`, { responseType: 'blob' });
      const fileBlob = blob instanceof Blob ? blob : new Blob([blob]);
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${id.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Unable to download invoice');
    }
  };

  const copyTracking = () => {
    if (order?.trackingNumber) {
      navigator.clipboard.writeText(order.trackingNumber);
      toast.success('Tracking number copied');
    }
  };

  const handleContactSupport = () => {
    const subject = `Support for Order #${id.slice(0, 8)}`;
    const message = `I need help with order #${id.slice(0, 8)}.`;
    navigate(`/contact?orderId=${id}&subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}`);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 80, borderRadius: 12, background: 'var(--surface)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!order) return null;

  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const isCancelled = order.status === 'cancelled';
  const currentStepIdx = STATUS_ORDER.indexOf(order.status);
  const addr = order.shippingAddressSnapshot;
  const fmt = (n) => formatCurrency(Number(n || 0), currency);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem' }}>

      {/* Back */}
      <button
        onClick={() => navigate('/orders')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', padding: 0 }}
      >
        <ArrowLeft size={16} /> Back to Orders
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Order #{id.slice(0, 8).toUpperCase()}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Placed {dayjs(order.createdAt).format('MMM D, YYYY [at] h:mm A')}
          </p>
        </div>
        <span style={{
          padding: '0.375rem 1rem', borderRadius: 999, fontSize: '0.8125rem', fontWeight: 700,
          background: meta.bg, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.04em'
        }}>
          {meta.label}
        </span>
      </div>

      {/* Status timeline */}
      {!isCancelled && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
            {/* connector line */}
            <div style={{
              position: 'absolute', top: 18, left: '12.5%', right: '12.5%', height: 3,
              background: 'var(--border)', borderRadius: 2, zIndex: 0
            }} />
            <div style={{
              position: 'absolute', top: 18, left: '12.5%',
              width: `${Math.max(0, (currentStepIdx / (STEPS.length - 1)) * 75)}%`,
              height: 3, background: 'var(--primary)', borderRadius: 2, zIndex: 1,
              transition: 'width 0.4s ease'
            }} />

            {STEPS.map((step, idx) => {
              const done = idx < currentStepIdx;
              const active = idx === currentStepIdx;
              const color = done || active ? 'var(--primary)' : 'var(--border)';
              const Icon = step.icon;
              return (
                <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 2 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done || active ? 'var(--primary)' : 'var(--surface)',
                    border: `3px solid ${color}`,
                    transition: 'all 0.3s'
                  }}>
                    <Icon size={16} color={done || active ? '#fff' : 'var(--text-muted)'} />
                  </div>
                  <span style={{
                    marginTop: 8, fontSize: '0.75rem', fontWeight: active ? 700 : 500,
                    color: active ? 'var(--primary)' : done ? 'var(--text-body)' : 'var(--text-muted)',
                    textAlign: 'center', maxWidth: 80
                  }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Status message */}
          <div style={{ marginTop: '1.5rem', padding: '0.875rem 1rem', background: `${meta.color}10`, borderRadius: 'var(--radius-md)', border: `1px solid ${meta.color}30` }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: meta.color, fontWeight: 600 }}>
              {order.status === 'pending' && 'Your order has been received and is awaiting confirmation.'}
              {order.status === 'confirmed' && 'Your order is confirmed and being prepared for shipment.'}
              {order.status === 'shipped' && `Your order is on the way!${order.trackingNumber ? ' Use the tracking number below to track your shipment.' : ''}`}
              {order.status === 'delivered' && 'Your order has been delivered. Enjoy your purchase!'}
              {order.status === 'delayed' && 'Your order is slightly delayed. We apologize for the inconvenience.'}
            </p>
          </div>
        </div>
      )}

      {/* Cancelled state */}
      {isCancelled && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem', border: '1px solid #fecaca' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <XCircle size={24} color="#ef4444" />
            <div>
              <div style={{ fontWeight: 700, color: '#ef4444' }}>Order Cancelled</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 2 }}>
                This order was cancelled. If you have questions, please contact support.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tracking number */}
      {order.trackingNumber && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Truck size={20} color="#6366f1" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tracking Number</div>
              <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--text-main)', fontFamily: 'monospace', letterSpacing: '0.05em', marginTop: 2 }}>
                {order.trackingNumber}
              </div>
            </div>
          </div>
          <button
            onClick={copyTracking}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-body)' }}
          >
            <Copy size={13} /> Copy
          </button>
        </div>
      )}

      {/* Estimated delivery */}
      {order.deliveryRegion && !isCancelled && (
        <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Clock size={18} color="#f59e0b" />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-body)' }}>
            Delivery region: <strong>{order.deliveryRegion.name}</strong>
            {order.deliveryRegion.leadTimeDays != null && (
              <> · Estimated lead time: <strong>{order.deliveryRegion.leadTimeDays} day{order.deliveryRegion.leadTimeDays !== 1 ? 's' : ''}</strong></>
            )}
          </span>
        </div>
      )}

      {/* Items */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '0.9375rem', fontWeight: 700 }}>Items Ordered</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {order.items?.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg)' }}>
                <img src={getProductCover(item.product?.images)} alt={item.product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.product?.name || 'Product'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 3 }}>
                  Qty: {item.quantity} × {fmt(item.unitPrice)}
                </div>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                {fmt(Number(item.unitPrice) * Number(item.quantity))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          {order.discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Discount</span>
              <span style={{ color: '#10b981' }}>-{fmt(order.discountAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            <span>Shipping</span>
            <span>{Number(order.shippingFee) === 0 ? <span style={{ color: '#10b981' }}>Free</span> : fmt(order.shippingFee)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginTop: 8 }}>
            <span>Total</span>
            <span>{fmt(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Delivery address */}
      {addr && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
            <MapPin size={16} color="var(--primary)" />
            <h2 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>Delivery Address</h2>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-body)', lineHeight: 1.7 }}>
            {addr.fullName && <div style={{ fontWeight: 600 }}>{addr.fullName}</div>}
            <div>{addr.street || addr.addressLine1}</div>
            {addr.addressLine2 && <div>{addr.addressLine2}</div>}
            <div>{[addr.city, addr.state, addr.zipCode || addr.postalCode].filter(Boolean).join(', ')}</div>
            {addr.country && <div>{addr.country}</div>}
            {addr.phone && <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>{addr.phone}</div>}
          </div>
        </div>
      )}

      {/* Payment info */}
      {order.payment && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
            <CreditCard size={16} color="var(--primary)" />
            <h2 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>Payment</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 3 }}>Method</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                {order.payment.paymentMethod === 'cod'
                  ? 'Cash on Delivery'
                  : order.payment.paymentMethod === 'stripe'
                  ? 'Credit / Debit Card'
                  : order.payment.paymentMethod === 'upi'
                  ? 'UPI'
                  : order.payment.paymentMethod || '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 3 }}>Status</div>
              <span style={{
                display: 'inline-block',
                padding: '2px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700,
                background: order.payment.status === 'completed' || order.payment.status === 'success'
                  ? '#d1fae5' : order.payment.status === 'pending' ? '#fef3c7' : '#fee2e2',
                color: order.payment.status === 'completed' || order.payment.status === 'success'
                  ? '#10b981' : order.payment.status === 'pending' ? '#d97706' : '#ef4444',
                textTransform: 'capitalize'
              }}>
                {order.payment.status || '—'}
              </span>
            </div>
            {order.payment.transactionRef && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 3 }}>Transaction Ref</div>
                <div style={{ fontWeight: 500, color: 'var(--text-body)', fontSize: '0.8125rem', fontFamily: 'monospace' }}>
                  {order.payment.transactionRef}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={handleDownloadInvoice}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}
        >
          <Download size={15} /> Download Invoice
        </button>
        <button
          onClick={handleContactSupport}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}
        >
          <Mail size={15} /> Contact Support
        </button>
      </div>
    </div>
  );
}
