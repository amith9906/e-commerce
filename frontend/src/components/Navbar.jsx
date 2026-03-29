import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, User as UserIcon, LogOut, Settings, Bell, CheckCircle, Search, Heart } from 'lucide-react';
import dayjs from 'dayjs';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { storeName, logoUrl } = useBrand();
  const { cartCount, wishlistItems } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      api.get('/notifications?limit=5').then(res => {
        if (res.success) setNotifications(res.data);
      }).catch(err => console.error('Failed to load notifications'));
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {}
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <nav style={{
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1rem 2rem', 
      background: 'white',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {logoUrl ? (
          <img src={logoUrl} alt={storeName} style={{ height: '32px', objectFit: 'contain' }} />
        ) : (
          <div style={{
            width: '32px', height: '32px', borderRadius: '4px',
            background: 'var(--primary-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold'
          }}>
            {storeName.charAt(0)}
          </div>
        )}
        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
          {storeName}
        </span>
      </Link>

      <form onSubmit={handleSearch} style={{ flex: '0 1 450px', margin: '0 2rem', position: 'relative' }}>
        <input 
          type="text" 
          placeholder="Search for products, brands..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.625rem 1rem 0.625rem 2.75rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            backgroundColor: '#f8fafc',
            fontSize: '0.875rem',
            outline: 'none',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = 'var(--primary-color)';
              e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
          }}
          onBlur={(e) => {
              e.target.style.backgroundColor = '#f8fafc';
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = 'none';
          }}
        />
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
      </form>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link to="/products" style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.875rem' }}>Shop</Link>
        
        {/* Wishlist Icon - Always Visible */}
        <Link to="/wishlist" style={{ color: 'var(--text-main)', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Heart size={22} color={wishlistItems.length > 0 ? '#ef4444' : 'currentColor'} fill={wishlistItems.length > 0 ? '#ef4444' : 'none'} />
          {wishlistItems.length > 0 && (
            <span style={{
              position: 'absolute', top: '-8px', right: '-8px',
              backgroundColor: '#ef4444', color: 'white',
              fontSize: '0.65rem', fontWeight: 700,
              width: '18px', height: '18px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid white'
            }}>
              {wishlistItems.length}
            </span>
          )}
        </Link>

        {/* Cart Icon - Always Visible */}
        <Link to="/cart" style={{ color: 'var(--text-main)', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <ShoppingCart size={22} />
          {cartCount > 0 && (
            <span style={{
              position: 'absolute', top: '-8px', right: '-8px',
              backgroundColor: 'var(--primary-color)', color: 'white',
              fontSize: '0.65rem', fontWeight: 700,
              width: '18px', height: '18px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid white'
            }}>
              {cartCount}
            </span>
          )}
        </Link>
        
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Notifications */}
            <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button onClick={() => setShowDropdown(!showDropdown)} style={{ color: 'var(--text-main)', position: 'relative', display: 'flex' }}>
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    backgroundColor: '#ef4444', color: 'white',
                    fontSize: '0.6rem', fontWeight: 700,
                    width: '14px', height: '14px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1.5px solid white'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showDropdown && (
                <div className="card" style={{ 
                  position: 'absolute', top: '100%', right: 0, marginTop: '1rem', 
                  width: '320px', padding: 0, zIndex: 1100, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' 
                }}>
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: '0.875rem' }}>Notifications</div>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No new notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} onClick={() => !n.isRead && markAsRead(n.id)} style={{ 
                          padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', 
                          backgroundColor: n.isRead ? 'transparent' : '#f0f9ff',
                          cursor: n.isRead ? 'default' : 'pointer',
                          transition: 'background-color 0.2s'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', alignItems: 'center' }}>
                            <strong style={{ fontSize: '0.8125rem', color: 'var(--text-main)' }}>{n.title}</strong>
                            {n.isRead && <CheckCircle size={14} color="#10b981" />}
                          </div>
                          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{n.message}</p>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>
                            {dayjs(n.createdAt).format('MMM D, h:mm A')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {(user.role === 'admin' || user.role === 'superadmin') ? (
              <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 600 }}>
                <Settings size={20} />
                <span>Admin</span>
              </Link>
            ) : (
               <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 600 }}>
                <UserIcon size={20} />
                <span>{user.name.split(' ')[0]}</span>
              </Link>
            )}

            <button onClick={handleLogout} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: '8px', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/login" style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.875rem', padding: '0.5rem 1rem' }}>Log in</Link>
            <Link to="/register" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', borderRadius: '10px' }}>Sign up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
