import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { Plus, Trash2, Edit, X } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  
  // New states for dynamic fields
  const [highlights, setHighlights] = useState([]);
  const [currentHighlight, setCurrentHighlight] = useState('');
  const [specifications, setSpecifications] = useState({});
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchProducts = () => {
    setLoading(true);
    api.get(`/products?page=${page}&limit=${limit}`)
      .then(res => { 
        if (res.success) {
            setProducts(res.data);
            if (res.pagination) setTotalPages(res.pagination.pages);
        }
      })
      .catch(err => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const addHighlight = () => {
    if (!currentHighlight.trim()) return;
    setHighlights([...highlights, currentHighlight.trim()]);
    setCurrentHighlight('');
  };

  const removeHighlight = (index) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const addSpec = () => {
    if (!specKey.trim() || !specValue.trim()) return;
    setSpecifications({ ...specifications, [specKey.trim()]: specValue.trim() });
    setSpecKey('');
    setSpecValue('');
  };

  const removeSpec = (key) => {
    const newSpecs = { ...specifications };
    delete newSpecs[key];
    setSpecifications(newSpecs);
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('price', data.price);
      formData.append('category', data.category);
      formData.append('description', data.description || '');
      formData.append('brand', data.brand || '');
      formData.append('sku', data.sku || '');
      
      // Send complex fields as JSON strings
      formData.append('highlights', JSON.stringify(highlights));
      formData.append('specifications', JSON.stringify(specifications));

      if (data.stockQuantity) formData.append('stockQuantity', data.stockQuantity);
      if (data.images && data.images.length > 0) {
        Array.from(data.images).forEach(file => {
          formData.append('images', file);
        });
      }

      const res = await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.success) {
        toast.success('Product created');
        setModalOpen(false);
        reset();
        setHighlights([]);
        setSpecifications({});
        fetchProducts();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.success) {
        toast.success('Product deleted');
        fetchProducts();
      }
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Products</h1>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => {
            setModalOpen(true);
            setHighlights([]);
            setSpecifications({});
        }}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Product</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Category</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Price</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Stock</th>
              <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>No products found.</td></tr>
            ) : (
              products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      {p.images && p.images.length > 0 && <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>{p.category}</td>
                  <td style={{ padding: '1rem' }}>${Number(p.price).toFixed(2)}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '999px', 
                      fontSize: '0.875rem',
                      backgroundColor: p.stock?.quantity <= (p.stock?.lowStockThreshold || 5) ? '#fee2e2' : '#d1fae5',
                      color: p.stock?.quantity <= (p.stock?.lowStockThreshold || 5) ? '#ef4444' : '#10b981'
                    }}>
                      {p.stock?.quantity || 0}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button style={{ color: 'var(--text-muted)', marginRight: '1rem' }}><Edit size={18} /></button>
                    <button style={{ color: '#ef4444' }} onClick={() => handleDelete(p.id)}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
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

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1, padding: '0.5rem 0' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Add New Product</h2>
              <button onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Name</label>
                    <input {...register('name', { required: 'Required' })} className="input-field" placeholder="Quantum X-15 Pro" />
                    {errors.name && <p className="error-text">{errors.name.message}</p>}
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Price</label>
                  <input {...register('price', { required: 'Required' })} type="number" step="0.01" className="input-field" placeholder="0.00" />
                  {errors.price && <p className="error-text">{errors.price.message}</p>}
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Category</label>
                  <input {...register('category', { required: 'Required' })} className="input-field" placeholder="Electronics" />
                  {errors.category && <p className="error-text">{errors.category.message}</p>}
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Brand</label>
                  <input {...register('brand')} className="input-field" placeholder="Quantum" />
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>SKU</label>
                  <input {...register('sku')} className="input-field" placeholder="QX-15-PRO" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Description</label>
                <textarea {...register('description')} className="input-field" rows="3" placeholder="Detailed product description..."></textarea>
              </div>

              {/* Highlights Section */}
              <div className="card" style={{ padding: '1rem', backgroundColor: '#f8fafc' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Product Highlights</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input 
                    value={currentHighlight} 
                    onChange={e => setCurrentHighlight(e.target.value)}
                    className="input-field" 
                    placeholder="e.g. 5000mAh Battery" 
                  />
                  <button type="button" onClick={addHighlight} className="btn-primary" style={{ padding: '0 1rem' }}>Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {highlights.map((h, i) => (
                    <span key={i} style={{ 
                      backgroundColor: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', 
                      fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border-color)' 
                    }}>
                      {h} <X size={14} style={{ cursor: 'pointer' }} onClick={() => removeHighlight(i)} />
                    </span>
                  ))}
                </div>
              </div>

              {/* Specifications Section */}
              <div className="card" style={{ padding: '1rem', backgroundColor: '#f8fafc' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Technical Specifications</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <input 
                    value={specKey} 
                    onChange={e => setSpecKey(e.target.value)}
                    className="input-field" 
                    placeholder="Key (e.g. RAM)" 
                  />
                  <input 
                    value={specValue} 
                    onChange={e => setSpecValue(e.target.value)}
                    className="input-field" 
                    placeholder="Value (e.g. 12GB)" 
                  />
                  <button type="button" onClick={addSpec} className="btn-primary" style={{ padding: '0 1rem' }}>Add</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {Object.entries(specifications).map(([k, v]) => (
                    <div key={k} style={{ 
                      backgroundColor: 'white', padding: '0.5rem', borderRadius: '4px', 
                      fontSize: '0.875rem', border: '1px solid var(--border-color)', position: 'relative'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{k}</div>
                      <div>{v}</div>
                      <X 
                        size={14} 
                        style={{ position: 'absolute', top: '5px', right: '5px', cursor: 'pointer', color: '#ef4444' }} 
                        onClick={() => removeSpec(k)} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Initial Stock Quantity</label>
                  <input {...register('stockQuantity')} type="number" className="input-field" placeholder="0" />
                </div>
                <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Images</label>
                    <input {...register('images')} type="file" accept="image/*" multiple className="input-field" style={{ padding: '0.25rem' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', position: 'sticky', bottom: 0, backgroundColor: 'white', padding: '1rem 0' }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'none' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 2 }}>Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
