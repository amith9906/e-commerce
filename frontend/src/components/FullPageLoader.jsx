import React from 'react';

export default function FullPageLoader({ message = 'Loading…' }) {
  return (
    <div className="global-api-loader" role="status" aria-live="polite">
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div className="global-api-loader__spinner" />
        <p className="global-api-loader__message">{message}</p>
      </div>
    </div>
  );
}
