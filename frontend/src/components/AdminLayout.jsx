import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { Menu } from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="admin-layout" style={{ position: 'relative' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="overlay" onClick={() => setSidebarOpen(false)} style={{ zIndex: 199 }} />
      )}

      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="admin-content">
        {/* Mobile top bar */}
        <div className="show-mobile" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' }}
          >
            <Menu size={18} color="var(--text-body)" />
          </button>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>Admin Console</span>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
