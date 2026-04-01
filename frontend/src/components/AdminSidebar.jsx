import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, Database, ShoppingBag, Users, Palette,
  Ticket, Percent, RotateCcw, MapPin, CreditCard, BarChart3,
  Shield, Zap, Activity, Building2, X, Star, Truck, MessageSquare,
  ChevronRight, Gift, KeyRound, ClipboardList, Box, ArrowLeftRight,
  Tag, Award, FileText, TrendingUp
} from 'lucide-react';

export default function AdminSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const isActive = (path) => location.pathname === path;

  const groups = [
    {
      label: 'Store',
      items: [
        { label: 'Overview', path: '/admin', icon: LayoutDashboard },
        { label: 'Products', path: '/admin/products', icon: Package },
        { label: 'Stock', path: '/admin/stock', icon: Database },
        { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
        { label: 'Returns', path: '/admin/returns', icon: RotateCcw },
        { label: 'Users', path: '/admin/users', icon: Users },
      ],
    },
    {
      label: 'Marketing',
      items: [
        { label: 'Coupons', path: '/admin/coupons', icon: Ticket },
        { label: 'Promotions', path: '/admin/promotions', icon: Percent },
        { label: 'Reviews', path: '/admin/reviews', icon: Star },
      ],
    },
    {
      label: 'Loyalty & Pricing',
      items: [
        { label: 'Gift Cards', path: '/admin/gift-cards', icon: Gift },
        { label: 'Loyalty Program', path: '/admin/loyalty', icon: Award },
        { label: 'Volume Pricing', path: '/admin/pricing-rules', icon: Tag },
      ],
    },
    {
      label: 'Operations',
      items: [
        { label: 'Store Operations', path: '/admin/store-operations', icon: MapPin },
        { label: 'Inv. Transfers', path: '/admin/transfers', icon: ArrowLeftRight },
        { label: 'Pickups', path: '/admin/pickups', icon: MapPin },
        { label: 'Commissions', path: '/admin/commissions', icon: FileText },
        { label: 'SP Performance', path: '/admin/salesperson-performance', icon: TrendingUp },
        { label: 'Delivery Zones', path: '/admin/delivery', icon: Truck },
        { label: 'Payment Settings', path: '/admin/payments', icon: CreditCard },
        { label: 'Branding', path: '/admin/brand', icon: Palette },
        { label: 'Webhooks', path: '/admin/webhooks', icon: Activity },
        { label: 'Suppliers', path: '/admin/suppliers', icon: ClipboardList },
        { label: 'POS', path: '/admin/pos', icon: Box },
        { label: 'API Keys', path: '/admin/api-keys', icon: KeyRound },
      ],
    },
    {
      label: 'Support',
      items: [
        { label: 'Tickets', path: '/admin/tickets', icon: MessageSquare },
        { label: 'Support Inbox', path: '/admin/support', icon: MessageSquare },
      ],
    },
    {
      label: 'Subscription',
      items: [
        { label: 'Billing & Plan', path: '/admin/billing', icon: Zap },
        { label: 'Usage & Settings', path: '/admin/usage', icon: BarChart3 },
        { label: 'Audit Logs', path: '/admin/audit-logs', icon: Shield },
      ],
    },
    ...(isSuperAdmin ? [{
      label: 'Super Admin',
      items: [
        { label: 'Platform Analytics', path: '/admin/platform', icon: Activity },
        { label: 'Manage Tenants', path: '/admin/tenants', icon: Building2 },
      ],
    }] : []),
  ];

  return (
    <aside className={`admin-sidebar${isOpen ? ' open' : ''}`}>
      {/* Mobile header */}
      <div className="show-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Menu</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
          <X size={18} />
        </button>
      </div>

      {groups.map((group, gi) => (
        <div key={group.label}>
          {gi > 0 && <div className="sidebar-divider" />}
          <div className="sidebar-section-label">{group.label}</div>
          {group.items.map(item => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item${active ? ' active' : ''}`}
                onClick={onClose}
              >
                <item.icon size={16} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
                {active && <ChevronRight size={13} style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.5 }} />}
              </Link>
            );
          })}
        </div>
      ))}

      <div style={{ height: '2rem' }} />
    </aside>
  );
}
