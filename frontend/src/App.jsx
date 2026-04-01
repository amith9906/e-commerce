import { lazy, Suspense } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './routes/ProtectedRoute';

import Navbar from './components/Navbar';
import GlobalApiLoader from './components/GlobalApiLoader';
import FullPageLoader from './components/FullPageLoader';
import Home from './pages/Home';
import Landing from './pages/Landing';
import TenantSignup from './pages/TenantSignup';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOtp from './pages/auth/VerifyOtp';
import ForgotPassword from './pages/auth/ForgotPassword';

import ProductListing from './pages/customer/ProductListing';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import OrderHistory from './pages/customer/OrderHistory';
import OrderTracking from './pages/customer/OrderTracking';
import Profile from './pages/customer/Profile';
import CompareProducts from './pages/customer/CompareProducts';
import Wishlist from './pages/customer/Wishlist';
import ContactUs from './pages/customer/ContactUs';
import Tickets from './pages/customer/Tickets';

import AdminLayout from './components/AdminLayout';
import SalespersonDashboard from './pages/salesperson/Dashboard';

const AdminSuspense = ({ children, message = 'Loading admin panel…' }) => (
  <Suspense fallback={<FullPageLoader message={message} />}>
    {children}
  </Suspense>
);

const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const BrandSettings = lazy(() => import('./pages/admin/BrandSettings'));
const Products = lazy(() => import('./pages/admin/Products'));
const GiftCards = lazy(() => import('./pages/admin/GiftCards'));
const Stock = lazy(() => import('./pages/admin/Stock'));
const Orders = lazy(() => import('./pages/admin/Orders'));
const Users = lazy(() => import('./pages/admin/Users'));
const Coupons = lazy(() => import('./pages/admin/Coupons'));
const Promotions = lazy(() => import('./pages/admin/Promotions'));
const Returns = lazy(() => import('./pages/admin/Returns'));
const DeliveryRegions = lazy(() => import('./pages/admin/DeliveryRegions'));
const PaymentSettings = lazy(() => import('./pages/admin/PaymentSettings'));
const Billing = lazy(() => import('./pages/admin/Billing'));
const UsageDashboard = lazy(() => import('./pages/admin/UsageDashboard'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const StoreOperations = lazy(() => import('./pages/admin/StoreOperations'));
const SupportInbox = lazy(() => import('./pages/admin/SupportInbox'));
const TicketCenter = lazy(() => import('./pages/admin/TicketCenter'));
const ProductReviews = lazy(() => import('./pages/admin/ProductReviews'));
const NotificationsPage = lazy(() => import('./pages/admin/Notifications'));
const Suppliers = lazy(() => import('./pages/admin/Suppliers'));
const PurchaseOrders = lazy(() => import('./pages/admin/PurchaseOrders'));
const POS = lazy(() => import('./pages/admin/POS'));
const Webhooks = lazy(() => import('./pages/admin/Webhooks'));
const ApiKeys = lazy(() => import('./pages/admin/ApiKeys'));
const EmailTemplates = lazy(() => import('./pages/admin/EmailTemplates'));
const SSO = lazy(() => import('./pages/admin/SSO'));
const Loyalty = lazy(() => import('./pages/admin/Loyalty'));
const InventoryTransfers = lazy(() => import('./pages/admin/InventoryTransfers'));
const Commissions = lazy(() => import('./pages/admin/Commissions'));
const Pickups = lazy(() => import('./pages/admin/Pickups'));
const PricingRules = lazy(() => import('./pages/admin/PricingRules'));
const SalespersonPerformance = lazy(() => import('./pages/admin/SalespersonPerformance'));
const PlatformDashboard = lazy(() => import('./pages/superadmin/PlatformDashboard'));
const TenantManagement = lazy(() => import('./pages/superadmin/TenantManagement'));

function App() {
  return (
    <div className="app-container">
      <GlobalApiLoader />
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public SaaS pages (full-width, no container padding) */}
          <Route path="/landing" element={<Landing />} />
          <Route path="/get-started" element={<TenantSignup />} />

          {/* Public & Customer Routes */}
          <Route element={<div className="page-wrapper"><Outlet /></div>}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/products" element={<ProductListing />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/compare" element={<CompareProducts />} />
            <Route path="/contact" element={<ContactUs />} />

            {/* Customer */}
            <Route element={<ProtectedRoute />}>
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<OrderHistory />} />
              <Route path="/orders/:id" element={<OrderTracking />} />
            </Route>
          </Route>

          <Route path="/salesperson" element={<ProtectedRoute />}>
            <Route element={<SalespersonDashboard />} path="" />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
            <Route index element={<AdminSuspense><Dashboard /></AdminSuspense>} />
              <Route path="products" element={<AdminSuspense><Products /></AdminSuspense>} />
              <Route path="stock" element={<AdminSuspense><Stock /></AdminSuspense>} />
              <Route path="orders" element={<AdminSuspense><Orders /></AdminSuspense>} />
              <Route path="users" element={<AdminSuspense><Users /></AdminSuspense>} />
              <Route path="brand" element={<AdminSuspense><BrandSettings /></AdminSuspense>} />
              <Route path="coupons" element={<AdminSuspense><Coupons /></AdminSuspense>} />
              <Route path="promotions" element={<AdminSuspense><Promotions /></AdminSuspense>} />
              <Route path="gift-cards" element={<AdminSuspense><GiftCards /></AdminSuspense>} />
              <Route path="returns" element={<AdminSuspense><Returns /></AdminSuspense>} />
              <Route path="delivery" element={<AdminSuspense><DeliveryRegions /></AdminSuspense>} />
              <Route path="reviews" element={<AdminSuspense><ProductReviews /></AdminSuspense>} />
              <Route path="store-operations" element={<AdminSuspense><StoreOperations /></AdminSuspense>} />
              <Route path="support" element={<AdminSuspense><SupportInbox /></AdminSuspense>} />
              <Route path="tickets" element={<AdminSuspense><TicketCenter /></AdminSuspense>} />
              <Route path="notifications" element={<AdminSuspense><NotificationsPage /></AdminSuspense>} />
              <Route path="suppliers" element={<AdminSuspense><Suppliers /></AdminSuspense>} />
              <Route path="purchase-orders" element={<AdminSuspense><PurchaseOrders /></AdminSuspense>} />
              <Route path="pos" element={<AdminSuspense><POS /></AdminSuspense>} />
              <Route path="webhooks" element={<AdminSuspense><Webhooks /></AdminSuspense>} />
              <Route path="api-keys" element={<AdminSuspense><ApiKeys /></AdminSuspense>} />
              <Route path="email-templates" element={<AdminSuspense><EmailTemplates /></AdminSuspense>} />
              <Route path="sso" element={<AdminSuspense><SSO /></AdminSuspense>} />
              <Route path="payments" element={<AdminSuspense><PaymentSettings /></AdminSuspense>} />
              {/* Loyalty & Pricing */}
              <Route path="loyalty" element={<AdminSuspense><Loyalty /></AdminSuspense>} />
              <Route path="pricing-rules" element={<AdminSuspense><PricingRules /></AdminSuspense>} />
              {/* Operations */}
              <Route path="transfers" element={<AdminSuspense><InventoryTransfers /></AdminSuspense>} />
              <Route path="commissions" element={<AdminSuspense><Commissions /></AdminSuspense>} />
              <Route path="pickups" element={<AdminSuspense><Pickups /></AdminSuspense>} />
              <Route path="salesperson-performance" element={<AdminSuspense><SalespersonPerformance /></AdminSuspense>} />
              {/* SaaS pages */}
              <Route path="billing" element={<AdminSuspense><Billing /></AdminSuspense>} />
              <Route path="usage" element={<AdminSuspense><UsageDashboard /></AdminSuspense>} />
              <Route path="audit-logs" element={<AdminSuspense><AuditLogs /></AdminSuspense>} />
              {/* Superadmin only */}
              <Route path="platform" element={<AdminSuspense><PlatformDashboard /></AdminSuspense>} />
              <Route path="tenants" element={<AdminSuspense><TenantManagement /></AdminSuspense>} />
            </Route>
          </Route>

        </Routes>
      </main>
    </div>
  );
}

export default App;
