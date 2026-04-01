import { useState, useEffect } from 'react';
import api from '../../api/client';
import dayjs from 'dayjs';
import { Filter, Calendar, RotateCcw, Package, ChevronRight, Download, Mail, Star, X, Camera, Paperclip, RefreshCcw, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

import { useBrand } from '../../context/BrandContext';
import { getProductCover } from '../../utils/productImage';
import { formatCurrency } from '../../utils/formatCurrency';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });
  const navigate = useNavigate();
  const { currency = 'INR' } = useBrand();
  const [reviewModal, setReviewModal] = useState({ isOpen: false, orderId: null, item: null });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [returnModal, setReturnModal] = useState({
    isOpen: false,
    orderId: null,
    type: 'return',
    reason: '',
    comment: '',
    files: []
  });
  const [returnSubmitting, setReturnSubmitting] = useState(false);

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

  const handleRequestReturn = (orderId, type) => {
    setReturnModal({
      isOpen: true,
      orderId,
      type,
      reason: '',
      comment: '',
      files: []
    });
  };

  const closeReturnModal = () => {
    setReturnModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleReturnFiles = (event) => {
    if (!event.target.files) return;
    setReturnModal((prev) => ({ ...prev, files: Array.from(event.target.files) }));
  };

  const handleReturnSubmit = async (event) => {
    event.preventDefault();
    if (!returnModal.orderId) return;
    setReturnSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', returnModal.type);
      formData.append('reason', returnModal.reason);
      if (returnModal.comment) formData.append('comment', returnModal.comment);
      returnModal.files.forEach((file) => formData.append('attachments', file));

      const res = await api.post(`/orders/${returnModal.orderId}/returns`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.success) {
        toast.success(`${returnModal.type === 'return' ? 'Return' : 'Replacement'} request submitted!`);
        closeReturnModal();
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit request');
    } finally {
      setReturnSubmitting(false);
    }
  };

  const handleOpenReview = (orderId, item) => {
    setReviewModal({ isOpen: true, orderId, item });
    setReviewRating(5);
    setReviewComment('');
    setReviewImages([]);
  };

  const handleCloseReview = () => {
    setReviewModal({ isOpen: false, orderId: null, item: null });
    setReviewImages([]);
  };

  const handleReviewFiles = (event) => {
    if (!event.target.files) return;
    setReviewImages(Array.from(event.target.files));
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    if (!reviewModal.item) return;
    setReviewSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('productId', reviewModal.item.productId);
      formData.append('rating', reviewRating);
      formData.append('comment', reviewComment);
      reviewImages.forEach((file) => formData.append('images', file));

      await api.post('/reviews', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Review submitted, thank you!');
      handleCloseReview();
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const blob = await api.get(`/orders/${orderId}/invoice/pdf`, { responseType: 'blob' });
      const fileBlob = blob instanceof Blob ? blob : new Blob([blob]);
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${orderId.substring(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message || 'Unable to download invoice');
    }
  };

  const handleContactSupport = (order) => {
    const formattedDate = dayjs(order.createdAt).format('MMM D, YYYY');
    const subject = `Support Request for Order ${order.id.substring(0, 8)}`;
    const message = `I need help with order ${order.id.substring(0, 8)} placed on ${formattedDate}. Total: ${formatCurrency(order.totalAmount, currency)}.`;
    navigate(`/contact?orderId=${order.id}&subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}`);
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
                  <div style={{ fontWeight: 600, fontSize: '0.925rem' }}>{formatCurrency(Number(order.totalAmount), currency)}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.025em', marginBottom: '0.25rem' }}>Order ID</div>
                      <div style={{ fontWeight: 600, fontSize: '0.925rem', fontFamily: 'monospace' }}>#{order.id.split('-')[0]}</div>
                    </div>
                    </div>
                    {order.deliveryRegion && (
                      <div style={{ fontSize: '0.8rem', color: '#0f766e', marginTop: '0.35rem' }}>
                        Delivery region: <strong>{order.deliveryRegion.name}</strong> · Lead time {order.deliveryRegion.leadTimeDays ?? 'N/A'} day(s)
                      </div>
                    )}
                  
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', padding: '0.35rem 0.875rem' }}
                    >
                      <MapPin size={14} /> Track Order
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(order.id)}
                      className="btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    >
                      <Download size={14} /> Download Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => handleContactSupport(order)}
                      className="btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    >
                      <Mail size={14} /> Contact Support
                    </button>
                  </div>
                </div>

                <div style={{ padding: '1.5rem' }}>
                  {order.items?.map((item, idx) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: idx !== order.items.length - 1 ? '1.25rem' : 0 }}>
                        <div style={{ width: '70px', height: '70px', backgroundColor: '#f1f5f9', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                          <img src={getProductCover(item.product?.images)} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{item.product?.name || 'Product Details Not Available'}</div>
                        <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                          <span>Quantity: <strong style={{ color: 'var(--text-main)' }}>{item.quantity}</strong></span>
                          <span>Price: <strong style={{ color: 'var(--text-main)' }}>{formatCurrency(Number(item.unitPrice), currency)}</strong></span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.65rem' }}>
                          {order.status === 'delivered' && !item.reviewed && (
                            <button
                              type="button"
                              onClick={() => handleOpenReview(order.id, item)}
                              className="btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Star size={14} /> Add Review
                            </button>
                          )}
                          {order.status === 'delivered' && item.reviewed && (
                            <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>Review submitted</span>
                          )}
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
        {reviewModal.isOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', zIndex: 50 }}>
            <div className="card" style={{ width: 'min(480px, 100%)', padding: '1.5rem', position: 'relative' }}>
              <button
                type="button"
              onClick={handleCloseReview}
              style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '0.25rem' }}>Review {reviewModal.item?.product?.name}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Share your honest experience and attach up to 4 photos.</p>
            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Rating</p>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReviewRating(value)}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '999px',
                        width: '36px',
                        height: '36px',
                        backgroundColor: reviewRating >= value ? '#fbbf24' : 'white',
                        color: reviewRating >= value ? '#1f2937' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Star size={16} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>Tell us more</label>
                <textarea
                  rows="4"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="input-field"
                  placeholder="How was the product? Anything we should know?"
                  style={{ width: '100%', resize: 'vertical', minHeight: '120px' }}
                />
              </div>
              <div>
                <label style={{ fontWeight: 600, marginBottom: '0.35rem', display: 'block', color: '#475569' }}>Attach photos (optional)</label>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleReviewFiles}
                    style={{ flex: 1 }}
                  />
                  <Camera size={20} color="#94a3b8" />
                </div>
                {reviewImages.length > 0 && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {reviewImages.map((file) => (
                      <span key={file.name} style={{ padding: '0.35rem 0.75rem', borderRadius: '999px', backgroundColor: '#eef2ff', fontSize: '0.75rem' }}>
                        {file.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={handleCloseReview} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={reviewSubmitting}>
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {returnModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', zIndex: 50 }}>
          <div className="card" style={{ width: 'min(500px, 100%)', padding: '1.5rem', position: 'relative' }}>
            <button
              type="button"
              onClick={closeReturnModal}
              style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <RefreshCcw size={20} color="var(--primary-color)" />
              <h3 style={{ margin: 0 }}>{returnModal.type === 'return' ? 'Return Request' : 'Replacement Request'}</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Upload photos of the item and explain the reason so the team can process your request faster.
            </p>
            <form onSubmit={handleReturnSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label>
                Reason
                <input
                  type="text"
                  className="input-field"
                  value={returnModal.reason}
                  onChange={(event) => setReturnModal((prev) => ({ ...prev, reason: event.target.value }))}
                  placeholder="What went wrong?"
                  required
                />
              </label>
              <label>
                Additional Comments (optional)
                <textarea
                  rows="3"
                  className="input-field"
                  placeholder="Share any supporting detail (damaged part, mismatch, etc.)"
                  value={returnModal.comment}
                  onChange={(event) => setReturnModal((prev) => ({ ...prev, comment: event.target.value }))}
                />
              </label>
              <label>
                Upload Attachments
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleReturnFiles}
                    style={{ flex: 1 }}
                  />
                  <Paperclip size={18} color="#94a3b8" />
                </div>
              </label>
              {returnModal.files.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {returnModal.files.map((file) => (
                    <span key={file.name} style={{ padding: '0.35rem 0.75rem', borderRadius: '999px', backgroundColor: '#ecfeff', fontSize: '0.75rem' }}>
                      {file.name}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={closeReturnModal} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }} disabled={returnSubmitting}>
                  {returnSubmitting ? 'Sending...' : `Submit ${returnModal.type === 'return' ? 'Return' : 'Replacement'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
