import { createContext, useContext, useState, useEffect } from 'react';
import api, { cachedGet } from '../api/client';
import FullPageLoader from '../components/FullPageLoader';

const BrandContext = createContext();

export const BrandProvider = ({ children }) => {
  const [brand, setBrand] = useState({
    storeName: 'E-Commerce Store',
    primaryColor: '#3b82f6',
    logoUrl: null,
    currency: 'INR',
    settings: {},
    socialLinks: {
      facebookUrl: '',
      instagramUrl: '',
      youtubeUrl: '',
      showFacebook: false,
      showInstagram: false,
      showYoutube: false,
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await cachedGet('/brand', { cacheTTL: 120_000 });
        if (res.data) {
          setBrand((prev) => {
            const fetchedSettings = res.data.settings || prev.settings || {};
            const resolvedCurrency = fetchedSettings.currency || res.data.currency || prev.currency || 'INR';
            return {
              ...prev,
              ...res.data,
              settings: fetchedSettings,
              currency: resolvedCurrency,
            };
          });

          // Inject CSS variables
          if (res.data.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', res.data.primaryColor);
          }
          if (res.data.storeName) {
            document.title = res.data.storeName;
          }
        }
      } catch (err) {
        console.error('Failed to load brand config', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <FullPageLoader message="Loading store configuration…" />;

  return (
    <BrandContext.Provider value={brand}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => useContext(BrandContext);
