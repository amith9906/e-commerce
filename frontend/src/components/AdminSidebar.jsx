import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Database, 
  ShoppingBag, 
  Users, 
  Palette, 
  Ticket, 
  Percent,
  RotateCcw,
  MapPin
} from 'lucide-react';

export default function AdminSidebar() {
  const location = useLocation();

  const menuItems = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Stock', path: '/admin/stock', icon: Database },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Coupons', path: '/admin/coupons', icon: Ticket },
    { name: 'Promotions', path: '/admin/promotions', icon: Percent },
    { name: 'Returns', path: '/admin/returns', icon: RotateCcw },
    { name: 'Branding', path: '/admin/brand', icon: Palette },
    { name: 'Store Operations', path: '/admin/store-operations', icon: MapPin },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside style={{
      width: '240px',
      background: 'white',
      borderRight: '1px solid var(--border-color)',
      height: 'calc(100vh - 64px)',
      position: 'sticky',
      top: '64px',
      padding: '1.5rem 0'
    }}>
      <nav style={{ display: 'flex', flexDirection: 'column' }}>
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1.5rem',
              color: isActive(item.path) ? 'var(--primary-color)' : 'var(--text-muted)',
              backgroundColor: isActive(item.path) ? '#f0f7ff' : 'transparent',
              borderRight: isActive(item.path) ? '3px solid var(--primary-color)' : 'none',
              fontWeight: isActive(item.path) ? 600 : 500,
              fontSize: '0.925rem',
              transition: 'all 0.2s'
            }}
          >
            <item.icon size={20} />
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
