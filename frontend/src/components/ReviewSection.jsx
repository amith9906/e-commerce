import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api/client';
import { Star, User, MessageCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ReviewSection({ productId, productRating, productCount }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReviews();
  }, [productId, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reviews/${productId}?page=${page}&limit=5`);
      if (res.success) {
        setReviews(res.data);
        setTotalPages(res.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.post('/reviews', { productId, rating, comment });
      if (res.success) {
        toast.success('Review submitted successfully!');
        setComment('');
        setRating(5);
        setPage(1);
        fetchReviews();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count, size = 16) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        size={size} 
        fill={i < count ? '#f59e0b' : 'none'} 
        color={i < count ? '#f59e0b' : '#d1d5db'} 
        style={{ marginRight: '1px' }}
      />
    ));
  };

  return (
    <div style={{ marginTop: '5rem', borderTop: '1px solid var(--border-color)', paddingTop: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '3rem' }}>
        
        {/* Ratings Summary */}
        <div style={{ flex: '0 0 300px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Customer Reviews</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-main)' }}>{Number(productRating || 0).toFixed(1)}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', marginBottom: '0.25rem' }}>
                {renderStars(Math.round(productRating || 0), 20)}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Based on {productCount || 0} reviews
              </div>
            </div>
          </div>
          
          {/* Submit Review Form (if logged in) */}
          {user ? (
            <div style={{ marginTop: '3rem', padding: '2rem', backgroundColor: '#fcfcfd', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Write a Review</h3>
              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Select Rating</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button 
                        key={num} 
                        type="button" 
                        onClick={() => setRating(num)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Star size={24} fill={num <= rating ? '#f59e0b' : 'none'} color={num <= rating ? '#f59e0b' : '#d1d5db'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Your Comment</label>
                  <textarea 
                    className="input-field" 
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)} 
                    placeholder="Share your thoughts about this product..." 
                    rows="3"
                    style={{ resize: 'none' }}
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={submitting}
                  style={{ width: '100%', height: '3rem', borderRadius: '10px', fontWeight: 700 }}
                >
                  {submitting ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            </div>
          ) : (
            <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Only registered buyers can post reviews.</p>
            </div>
          )}
        </div>

        {/* Review List */}
        <div style={{ flex: 1, minWidth: '350px' }}>
          {loading ? (
             <div style={{ textAlign: 'center', padding: '3rem' }}>Loading reviews...</div>
          ) : reviews.length === 0 ? (
             <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                <div style={{ width: '64px', height: '64px', backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <MessageCircle size={32} color="#e2e8f0" />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)' }}>No reviews yet</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Be the first to share your experience with this item!</p>
             </div>
          ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {reviews.map(review => (
                   <div key={review.id} style={{ paddingBottom: '2.5rem', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', fontWeight: 700, fontSize: '0.875rem' }}>
                               {review.user?.name.charAt(0)}
                            </div>
                            <div>
                               <div style={{ fontWeight: 700, fontSize: '0.925rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                 {review.user?.name}
                                 {review.isVerifiedPurchase && (
                                   <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                      <CheckCircle size={12} fill="#10b981" color="white" /> Verified Purchase
                                   </span>
                                 )}
                               </div>
                               <div style={{ display: 'flex', marginTop: '0.2rem' }}>
                                 {renderStars(review.rating)}
                               </div>
                            </div>
                         </div>
                         <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(review.createdAt).toLocaleDateString()}
                         </div>
                      </div>
                      <p style={{ color: 'var(--text-main)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                         {review.comment}
                      </p>
                   </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                    {[...Array(totalPages)].map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => setPage(i + 1)}
                        style={{
                          width: '32px', height: '32px', borderRadius: '6px',
                          border: page === i + 1 ? 'none' : '1px solid var(--border-color)',
                          backgroundColor: page === i + 1 ? 'var(--primary-color)' : 'white',
                          color: page === i + 1 ? 'white' : 'var(--text-main)',
                          cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem'
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
