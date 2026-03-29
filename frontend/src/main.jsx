import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { BrandProvider } from './context/BrandContext';
import { CartProvider } from './context/CartContext';
import './index.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <BrandProvider>
        <AuthProvider>
          <CartProvider>
            <App />
            <ToastContainer position="bottom-right" />
          </CartProvider>
        </AuthProvider>
      </BrandProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
