import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

let activeApiRequests = 0;
const emitLoadingEvent = () => {
  window.dispatchEvent(new CustomEvent('api-loading', {
    detail: {
      isLoading: activeApiRequests > 0,
      pending: activeApiRequests
    }
  }));
};

const incrementRequests = () => {
  activeApiRequests += 1;
  emitLoadingEvent();
};

const decrementRequests = () => {
  activeApiRequests = Math.max(0, activeApiRequests - 1);
  emitLoadingEvent();
};

// Request interceptor: attach token and tenant slug
api.interceptors.request.use((config) => {
  incrementRequests();
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Multi-tenant resolution in dev: Add X-Tenant-Slug header
  const slug = localStorage.getItem('tenantSlug') || 'demo';
  config.headers['X-Tenant-Slug'] = slug;

  return config;
}, (error) => {
  decrementRequests();
  return Promise.reject(error);
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    decrementRequests();
    return response.data;
  },
  (error) => {
    decrementRequests();
    const data = error.response?.data || error;
    const status = error.response?.status;

    // 402 Payment Required â€” plan gate triggered
    if (status === 402) {
      // Dispatch a custom event so any component can react
      window.dispatchEvent(new CustomEvent('plan-gate-error', { detail: data }));
      // Return a structured error so components can also handle locally
      return Promise.reject({
        ...data,
        statusCode: 402,
      });
    }

    // 401 Unauthorized â€” token expired/invalid
    if (status === 401) {
      localStorage.removeItem('token');
      // Don't redirect here â€” let AuthContext handle it
    }

    // 429 Tenant rate limit exceeded
    if (status === 429 && data?.code === 'TENANT_RATE_LIMIT_EXCEEDED') {
      window.dispatchEvent(new CustomEvent('rate-limit-error', { detail: data }));
    }

  return Promise.reject(data);
}
);

const cache = new Map();
const buildCacheKey = (url, params) => `${url}?${JSON.stringify(params || {})}`;

export const cachedGet = async (url, config = {}) => {
  if (axios.isCancel(config.signal)) {
    // not a supported scenario
  }
  const key = buildCacheKey(url, config.params);
  const now = Date.now();
  const entry = cache.get(key);
  const ttl = config.cacheTTL ?? 60_000;
  if (entry && entry.expiresAt > now) {
    return entry.response;
  }
  const response = await api.get(url, config);
  cache.set(key, { response, expiresAt: now + ttl });
  return response;
};

export const invalidateCache = (url, params) => {
  const key = buildCacheKey(url, params);
  cache.delete(key);
};

export default api;
