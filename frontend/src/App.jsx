import { Routes, Route, Outlet } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './routes/ProtectedRoute';

// Basic layouts for now (we'll create actual pages next)
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOtp from './pages/auth/VerifyOtp';

import ProductListing from './pages/customer/ProductListing';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import OrderHistory from './pages/customer/OrderHistory';
import Profile from './pages/customer/Profile';
import CompareProducts from './pages/customer/CompareProducts';
import Wishlist from './pages/customer/Wishlist';
import ContactUs from './pages/customer/ContactUs';

import Dashboard from './pages/admin/Dashboard';
import BrandSettings from './pages/admin/BrandSettings';
import Products from './pages/admin/Products';
import Stock from './pages/admin/Stock';
import Orders from './pages/admin/Orders';
import Users from './pages/admin/Users';
import Coupons from './pages/admin/Coupons';
import Promotions from './pages/admin/Promotions';
import Returns from './pages/admin/Returns';
import AdminLayout from './components/AdminLayout';
import SalespersonDashboard from './pages/salesperson/Dashboard';
import StoreOperations from './pages/admin/StoreOperations';
import PaymentSettings from './pages/admin/PaymentSettings';

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <Routes>
          {/* Public & Customer Routes with Padding */}
          <Route element={<div style={{ padding: '2rem' }}><Outlet /></div>}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />

            <Route path="/products" element={<ProductListing />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/compare" element={<CompareProducts />} />
            <Route path="/contact" element={<ContactUs />} />

            {/* Customer */}
          <Route element={<ProtectedRoute />}>
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<OrderHistory />} />
            </Route>
          </Route>

          <Route path="/salesperson" element={<ProtectedRoute />}>
            <Route
              element={<SalespersonDashboard />}
              path=""
            />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="stock" element={<Stock />} />
              <Route path="orders" element={<Orders />} />
              <Route path="users" element={<Users />} />
              <Route path="brand" element={<BrandSettings />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="promotions" element={<Promotions />} />
              <Route path="returns" element={<Returns />} />
              <Route path="store-operations" element={<StoreOperations />} />
              <Route path="payments" element={<PaymentSettings />} />
            </Route>
          </Route>

        </Routes>
      </main>
    </div>
  );
}

export default App;
