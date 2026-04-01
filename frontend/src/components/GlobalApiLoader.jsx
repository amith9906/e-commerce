'use strict';
import { useEffect, useState } from 'react';

export default function GlobalApiLoader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleLoading = (event) => {
      const isLoading = event?.detail?.isLoading;
      setVisible(Boolean(isLoading));
    };
    window.addEventListener('api-loading', handleLoading);
    return () => window.removeEventListener('api-loading', handleLoading);
  }, []);

  if (!visible) return null;

  return (
    <div className="global-api-loader" role="status" aria-live="polite">
      <div className="global-api-loader__spinner" />
    </div>
  );
}
