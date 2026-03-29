import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const BrandContext = createContext();

export const BrandProvider = ({ children }) => {
  const [brand, setBrand] = useState({
    storeName: 'E-Commerce Store',
    primaryColor: '#3b82f6',
    logoUrl: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In dev, tenant slug is usually read from local storage or URL
    // Here we use the axios interceptor which sends the right header based on local storage
    api.get('/brand')
      .then((res) => {
        if (res.data) {
          setBrand((prev) => ({ ...prev, ...res.data }));
          
          // Inject CSS variables
          if (res.data.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', res.data.primaryColor);
          }
          if (res.data.storeName) {
            document.title = res.data.storeName;
          }
        }
      })
      .catch((err) => console.error('Failed to load brand config', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading store configuration...</div>;

  return (
    <BrandContext.Provider value={brand}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => useContext(BrandContext);
