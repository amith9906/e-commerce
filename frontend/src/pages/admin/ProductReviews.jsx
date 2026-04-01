import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { Star, ChevronRight, X, Image } from 'lucide-react';
import { getProductCover } from '../../utils/productImage';
import PaginationControls from '../../components/PaginationControls';

const renderStars = (count) => (
  Array.from({ length: 5 }, (_, index) => (
    <span
      key={index}
      style={{
        color: index < count ? '#f59e0b' : '#cbd5e1',
        fontSize: '1rem',
        marginRight: index === 4 ? 0 : '0.15rem',
      }}
    >
      ★
    </span>
  ))
);

export default function ProductReviews() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, pages: 1, total: 0 });
  const PAGE_LIMIT = 10;
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const headerStyle = {
    padding: '1rem',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#6b7280',
  };
  const cellStyle = {
    padding: '1rem',
    borderTop: '1px solid #f3f4f6',
    verticalAlign: 'middle',
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const params = { limit: PAGE_LIMIT, sort: 'name_asc', page };
      if (search) params.q = search;
      const res = await api.get('/products', { params });
      if (res.success) {
        setProducts(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
          if (res.pagination.pages && page > res.pagination.pages) {
            setPage(res.pagination.pages);
          }
        }
      }
    } catch (err) {
      toast.error('Unable to load products.');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, page]);

  const openReviewModal = async (product) => {
    setSelectedProduct(product);
    setLoadingReviews(true);
    try {
      const res = await api.get(`/reviews/${product.id}`);
      if (res.success) {
        setReviews(res.data);
      }
    } catch (err) {
      toast.error('Failed to load reviews.');
    } finally {
      setLoadingReviews(false);
    }
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setReviews([]);
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Product Reviews</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
            Monitor customer feedback and ratings per SKU.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="search"
            placeholder="Search product name, brand, SKU"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            style={{
              padding: '0.65rem 0.9rem',
              borderRadius: '999px',
              border: '1px solid #e5e7eb',
              width: '280px',
              fontSize: '0.95rem'
            }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStyle}>Product</th>
              <th style={headerStyle}>SKU</th>
              <th style={headerStyle}>Rating</th>
              <th style={headerStyle}>Reviews</th>
              <th style={headerStyle}>Stock</th>
              <th style={headerStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingProducts ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading products...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No products found.</td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
                    <img src={getProductCover(product.images)} alt={product.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{product.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{product.brand || 'Brand'}</div>
                    </div>
                  </td>
                  <td style={{ ...cellStyle, textTransform: 'uppercase', fontSize: '0.85rem', color: '#4b5563' }}>
                    {product.sku || '-'}
                  </td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {renderStars(Math.round(Number(product.ratingAvg || 0)))}
                      <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{Number(product.ratingAvg || 0).toFixed(1)}</span>
                    </div>
                  </td>
                  <td style={{ ...cellStyle, fontWeight: 600 }}>{product.ratingCount || 0}</td>
                  <td style={cellStyle}>{product.stock?.quantity ?? '-'}</td>
                  <td style={cellStyle}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => openReviewModal(product)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}
                    >
                      View Reviews
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <PaginationControls
          currentPage={pagination.currentPage || page}
          totalPages={pagination.pages || 1}
          onChange={(targetPage) => setPage(targetPage)}
        />
      </div>

      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', zIndex: 60 }}>
          <div className="card" style={{ width: 'min(600px, 100%)', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', position: 'relative' }}>
            <button
              type="button"
              onClick={closeModal}
              style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ marginTop: 0 }}>{selectedProduct.name}</h3>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              {selectedProduct.ratingCount || 0} reviews · {selectedProduct.stock?.quantity ?? 0} units in stock
            </p>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {renderStars(Math.round(Number(selectedProduct.ratingAvg || 0)))}
              <span style={{ fontWeight: 600 }}>{Number(selectedProduct.ratingAvg || 0).toFixed(1)}</span>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              {loadingReviews ? (
                <p style={{ textAlign: 'center' }}>Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280' }}>No reviews yet.</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} style={{ borderBottom: '1px solid #e5e7eb', padding: '1rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>{review.user?.name || 'Anonymous'}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                          {renderStars(review.rating)}
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                          {review.isVerifiedPurchase && (
                            <span style={{ padding: '0.1rem 0.5rem', background: '#ecfdf5', borderRadius: '999px', color: '#10b981', fontWeight: 600 }}>
                              Verified Purchase
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p style={{ margin: '0.75rem 0', color: '#374151' }}>{review.comment || 'No comment provided.'}</p>
                    {review.images?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {review.images.map((src) => (
                          <img
                            key={src}
                            src={src}
                            alt="Review pic"
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
