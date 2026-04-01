import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatCurrency';
import {
  ShoppingCart, User as UserIcon, LogOut, Bell, CheckCircle,
  Search, Heart, ChevronDown, Menu, X, Settings, Package,
  LayoutDashboard, Ticket, MessageSquare,
} from 'lucide-react';
import dayjs from 'dayjs';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { storeName, logoUrl, currency = 'INR' } = useBrand();
  const { cartCount, wishlistItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);
  const notifRef = useRef(null);
  const accountRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    api.get('/notifications?limit=6').then(res => {
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.isRead).length);
      }
    }).catch(() => {});
  }, [user]);

  // SSE for real-time notifications
  const applyIncomingNotification = useCallback((note) => {
    setNotifications(prev => {
      if (prev.some(n => n.id === note.id)) return prev;
      return [note, ...prev].slice(0, 6);
    });
    if (!note.isRead) setUnreadCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    const slug = localStorage.getItem('tenantSlug') || 'demo';
    const base = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
    const streamUrl = `${base}/api/notifications/stream?access_token=${encodeURIComponent(token)}&tenantSlug=${encodeURIComponent(slug)}`;
    let source;
    try {
      source = new EventSource(streamUrl);
      source.onmessage = (e) => {
        try { applyIncomingNotification(JSON.parse(e.data)); } catch {}
      };
      source.onerror = () => source.close();
    } catch {}
    return () => source?.close();
  }, [user, applyIncomingNotification]);

  // Click-outside handlers
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (accountRef.current && !accountRef.current.contains(e.target)) setShowAccountMenu(false);
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search
  const fetchSuggestions = async (val) => {
    if (!val.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
    try {
      const res = await api.get('/products/autocomplete', { params: { q: val } });
      if (res.success) { setSuggestions(res.data); setShowSuggestions(res.data.length > 0); }
    } catch { setSuggestions([]); setShowSuggestions(false); }
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 250);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
      setMobileSearchOpen(false);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (id) => {
    setSearchQuery(''); setSuggestions([]); setShowSuggestions(false);
    navigate(`/products/${id}`);
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(prev - 1, 0));
    } catch {}
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <>
      <nav className="navbar">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          {logoUrl
            ? <img src={logoUrl} alt={storeName} style={{ height: 32, objectFit: 'contain' }} />
            : <div className="navbar-logo">{storeName?.charAt(0) || 'S'}</div>
          }
          <span className="navbar-name hide-mobile">{storeName}</span>
        </Link>

        {/* Desktop Search */}
        <div className="navbar-search" ref={suggestionsRef} style={{ position: 'relative' }}>
          <form onSubmit={handleSearch}>
            <Search size={16} className="navbar-search-icon" />
            <input
              type="text"
              placeholder="Search products, brands..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            />
          </form>
          {showSuggestions && suggestions.length > 0 && (
            <div className="dropdown" style={{ top: 'calc(100% + 8px)', width: '100%', maxHeight: 320, overflowY: 'auto' }}>
              {suggestions.map(item => (
                <button key={item.id} className="dropdown-item" onClick={() => handleSuggestionClick(item.id)}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.brand || 'Catalog'} · {formatCurrency(item.price, currency)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {/* Mobile: Search toggle */}
          <button className="navbar-icon-btn show-mobile" onClick={() => setMobileSearchOpen(v => !v)} aria-label="Search">
            <Search size={20} />
          </button>

          {/* Wishlist */}
          <Link to="/wishlist" className="navbar-icon-btn" aria-label="Wishlist">
            <Heart size={20} color={wishlistItems?.length > 0 ? '#ef4444' : undefined} fill={wishlistItems?.length > 0 ? '#ef4444' : 'none'} />
            {wishlistItems?.length > 0 && <span className="nav-badge">{wishlistItems.length}</span>}
          </Link>

          {/* Cart */}
          <Link to="/cart" className="navbar-icon-btn" aria-label="Cart">
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
          </Link>

          {user ? (
            <>
              {/* Notifications */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button className="navbar-icon-btn" onClick={() => setShowNotifications(v => !v)} aria-label="Notifications">
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
                </button>
                {showNotifications && (
                  <div className="dropdown" style={{ width: 340, maxHeight: 420, overflowY: 'auto', padding: 0 }}>
                    <div className="dropdown-header" style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Notifications</span>
                      {unreadCount > 0 && <span className="badge badge-danger">{unreadCount} new</span>}
                    </div>
                    {notifications.length === 0
                      ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No notifications yet</div>
                      : notifications.map(n => (
                        <div
                          key={n.id}
                          className="dropdown-item"
                          style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, background: n.isRead ? undefined : 'var(--primary-light)', padding: '0.875rem 1rem' }}
                          onClick={() => !n.isRead && markAsRead(n.id)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{n.title}</span>
                            {n.isRead && <CheckCircle size={13} color="var(--success)" />}
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.message}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: 2 }}>{dayjs(n.createdAt).format('MMM D, h:mm A')}</span>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>

              {/* Account menu */}
              <div ref={accountRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowAccountMenu(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 'var(--radius-md)', transition: 'var(--transition-fast)' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--gray-100)'}
                  onMouseOut={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-full)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hide-mobile" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{user.name?.split(' ')[0]}</span>
                  <ChevronDown size={14} className="hide-mobile" style={{ color: 'var(--text-muted)' }} />
                </button>

                {showAccountMenu && (
                  <div className="dropdown" style={{ width: 220 }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>{user.email}</div>
                    </div>
                    <Link to="/profile" className="dropdown-item" onClick={() => setShowAccountMenu(false)}><UserIcon size={15} /> My Profile</Link>
                    <Link to="/orders" className="dropdown-item" onClick={() => setShowAccountMenu(false)}><Package size={15} /> Order History</Link>
                    <Link to="/tickets" className="dropdown-item" onClick={() => setShowAccountMenu(false)}><Ticket size={15} /> Support Tickets</Link>
                    {isAdmin && (
                      <>
                        <div className="dropdown-divider" />
                        <Link to="/admin" className="dropdown-item" onClick={() => setShowAccountMenu(false)}><LayoutDashboard size={15} /> Admin Console</Link>
                      </>
                    )}
                    <div className="dropdown-divider" />
                    <button className="dropdown-item danger" style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }} onClick={handleLogout}>
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Link to="/login" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-body)', padding: '6px 12px' }}>Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button className="navbar-hamburger" onClick={() => setMobileMenuOpen(v => !v)} aria-label="Menu">
            <span style={{ transform: mobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : undefined }} />
            <span style={{ opacity: mobileMenuOpen ? 0 : 1 }} />
            <span style={{ transform: mobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : undefined }} />
          </button>
        </div>
      </nav>

      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div className="navbar-search mobile-open">
          <form onSubmit={handleSearch} style={{ width: '100%', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              autoFocus
              style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
            />
            <button type="button" onClick={() => setMobileSearchOpen(false)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Mobile drawer menu */}
      {mobileMenuOpen && (
        <>
          <div className="overlay" onClick={() => setMobileMenuOpen(false)} />
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '80vw',
            maxWidth: 320,
            height: '100vh',
            background: 'var(--surface)',
            zIndex: 400,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-2xl)',
            animation: 'slideFromRight 0.25s ease',
          }}>
            <style>{`@keyframes slideFromRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--text-main)' }}>{storeName}</span>
              <button className="navbar-icon-btn" onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0' }}>
              {user && (
                <div style={{ padding: '0.75rem 1.25rem', marginBottom: 4, background: 'var(--gray-50)', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{user.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                </div>
              )}

              {[
                { to: '/', label: 'Home', icon: <LayoutDashboard size={18} /> },
                { to: '/products', label: 'Shop', icon: <Package size={18} /> },
                { to: '/cart', label: `Cart (${cartCount})`, icon: <ShoppingCart size={18} /> },
                { to: '/wishlist', label: 'Wishlist', icon: <Heart size={18} /> },
              ].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1.25rem', color: 'var(--text-body)', fontSize: '0.9375rem', fontWeight: 500, borderBottom: '1px solid var(--gray-50)' }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              {user && (
                <>
                  <Link to="/orders" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1.25rem', color: 'var(--text-body)', fontSize: '0.9375rem', fontWeight: 500 }}>
                    <Package size={18} color="var(--text-muted)" /> My Orders
                  </Link>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1.25rem', color: 'var(--text-body)', fontSize: '0.9375rem', fontWeight: 500 }}>
                    <UserIcon size={18} color="var(--text-muted)" /> My Profile
                  </Link>
                  <Link to="/tickets" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1.25rem', color: 'var(--text-body)', fontSize: '0.9375rem', fontWeight: 500 }}>
                    <Ticket size={18} color="var(--text-muted)" /> Support
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1.25rem', color: 'var(--primary)', fontSize: '0.9375rem', fontWeight: 600 }}>
                      <Settings size={18} /> Admin Console
                    </Link>
                  )}
                </>
              )}
            </div>

            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
              {user
                ? <button className="btn btn-secondary btn-full" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}><LogOut size={16} /> Sign Out</button>
                : <div style={{ display: 'flex', gap: 8 }}>
                    <Link to="/login" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
                    <Link to="/register" className="btn btn-primary" style={{ flex: 1 }} onClick={() => setMobileMenuOpen(false)}>Get started</Link>
                  </div>
              }
            </div>
          </div>
        </>
      )}
    </>
  );
}
