import React from 'react';

export default function PaginationControls({ currentPage = 1, totalPages = 1, onChange }) {
  if (!onChange || totalPages <= 1) return null;

  const windowSize = 5;
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + windowSize - 1);
  if (end - start < windowSize - 1) {
    start = Math.max(1, end - windowSize + 1);
  }
  const buttons = [];
  for (let i = start; i <= end; i += 1) {
    buttons.push(i);
  }

  const wrapperStyle = {
    padding: '1.25rem',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    backgroundColor: '#fcfcfd',
    flexWrap: 'wrap'
  };

  const pageButton = (pageNumber) => ({
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: currentPage === pageNumber ? 'none' : '1px solid var(--border-color)',
    backgroundColor: currentPage === pageNumber ? 'var(--primary-color)' : 'white',
    color: currentPage === pageNumber ? 'white' : 'var(--text-main)',
    fontWeight: 700,
    cursor: 'pointer'
  });

  const edgeButton = {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'white',
    cursor: 'pointer'
  };

  return (
    <div style={wrapperStyle}>
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onChange(currentPage - 1)}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'white',
          cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
        }}
      >
        Previous
      </button>
      {start > 1 && (
        <>
          <button type="button" style={edgeButton} onClick={() => onChange(1)}>1</button>
          {start > 2 && <span style={{ color: 'var(--text-muted)' }}>...</span>}
        </>
      )}
      {buttons.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          onClick={() => onChange(pageNumber)}
          style={pageButton(pageNumber)}
        >
          {pageNumber}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ color: 'var(--text-muted)' }}>...</span>}
          <button type="button" style={edgeButton} onClick={() => onChange(totalPages)}>
            {totalPages}
          </button>
        </>
      )}
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onChange(currentPage + 1)}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'white',
          cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
        }}
      >
        Next
      </button>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
}
