import { useState } from 'react';
import { toast } from 'react-toastify';
import { Download, Calendar } from 'lucide-react';
import api from '../../api/client';

export default function Commissions() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await api.get(`/commissions/export?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `commission-report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Commission report downloaded');
    } catch {
      toast.error('Failed to export commission report');
    } finally {
      setExporting(false);
    }
  };

  // Quick date range presets
  const setPreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          Commission Reports
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
          Export salesperson commission data as CSV
        </p>
      </div>

      <div className="card" style={{ padding: '1.5rem', maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
          <Calendar size={18} color="var(--primary)" />
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Select Date Range</h2>
        </div>

        {/* Presets */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Last 7 days', days: 7 },
            { label: 'Last 30 days', days: 30 },
            { label: 'Last 90 days', days: 90 },
            { label: 'Last year', days: 365 }
          ].map(preset => (
            <button
              key={preset.days}
              className="btn-secondary"
              onClick={() => setPreset(preset.days)}
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div style={{ padding: '0.875rem 1rem', background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          The CSV report includes: Transfer ID, Salesperson name & email, Revenue, Commission earned, and Status.
          Commission rates are based on per-salesperson settings or the default rate configured in your system.
          Leave dates empty to export all records.
        </div>

        <button
          className="btn-primary"
          onClick={handleExport}
          disabled={exporting}
          style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}
        >
          <Download size={15} />
          {exporting ? 'Generating report…' : 'Export CSV Report'}
        </button>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        {[
          {
            title: 'How commissions work',
            body: 'Each salesperson can have a custom commission rate (percentage + flat amount). If no custom rate is set, the default commission setting is used.'
          },
          {
            title: 'Report contents',
            body: 'The report covers all inventory transfers linked to a salesperson within the selected date range, with calculated commission per transfer.'
          },
          {
            title: 'Configuring rates',
            body: 'Commission rates are stored in the CommissionSetting model. Contact your system administrator to configure rates per salesperson.'
          }
        ].map(card => (
          <div key={card.title} className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 8, fontSize: '0.9375rem' }}>
              {card.title}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {card.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
