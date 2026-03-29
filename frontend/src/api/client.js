import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// Request interceptor: attach token and tenant slug
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Multi-tenant resolution in dev: Add X-Tenant-Slug header
  // In prod, this would normally be handled automatically by the subdomain 
  // e.g. tenant1.domain.com hitting backend. But for dev we pass header:
  const slug = localStorage.getItem('tenantSlug') || 'demo'; 
  config.headers['X-Tenant-Slug'] = slug;

  return config;
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // We handle global 401s (token expired) via AuthContext preferably,
    // but here we can just reject the promise for local component catch blocks
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
