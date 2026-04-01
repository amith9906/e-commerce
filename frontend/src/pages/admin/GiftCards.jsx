import { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Gift, Mail, RefreshCw, ArrowRightLeft, Search } from 'lucide-react';
import api from '../../api/client';
import { formatCurrency } from '../../utils/formatCurrency';
import { useBrand } from '../../context/BrandContext';
import PaginationControls from '../../components/PaginationControls';

const DEFAULT_FORM = {
  code: '',
  value: '',
  initialBalance: '',
  expiresAt: '',
  recipientEmail: '',
  message: '',
  isActive: true,
  sendNotification: true
};

const formatTimestamp = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};

const getLatestNotification = (metadata = {}) => {
  if (!metadata) return null;
  const notifications = Array.isArray(metadata.notifications) ? metadata.notifications : [];
  return notifications[0] || null;
};

export default function GiftCards() {
  const { currency = 'USD' } = useBrand();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [giftCards, setGiftCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [emailSendingId, setEmailSendingId] = useState('');
  const limit = 10;
  const historyLimit = 6;

  const fetchGiftCards = async () => {
    setLoading(true);
    try {
      const res = await api.get('/gift-cards', {
        params: {
          page,
          limit,
          q: filters.search || undefined,
          status: filters.status || undefined
        }
      });
      if (res.success) {
        setGiftCards(res.data || []);
        const meta = res.pagination || { currentPage: page, pages: 1, total: res.data?.length || 0 };
        if (meta.pages && page > meta.pages) {
          setPage(meta.pages);
        }
        setPagination(meta);
      }
    } catch (err) {
      toast.error(err.message || 'Unable to load gift cards.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/gift-cards/redemptions', {
        params: {
          page: historyPage,
          limit: historyLimit
        }
      });
      if (res.success) {
        setHistory(res.data?.redemptions || []);
        setHistoryTotal(res.data?.total || 0);
      }
    } catch (err) {
      toast.error(err.message || 'Unable to load redemption history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchGiftCards();
  }, [page, filters.search, filters.status]);

  useEffect(() => {
    fetchHistory();
  }, [historyPage]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.code.trim()) {
      toast.error('Code is required.');
      return;
    }
    if (!form.value || Number(form.value) <= 0) {
      toast.error('Value must be greater than zero.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/gift-cards', {
        code: form.code.trim(),
        value: Number(form.value),
        initialBalance: form.initialBalance ? Number(form.initialBalance) : undefined,
        expiresAt: form.expiresAt || undefined,
        isActive: form.isActive,
        recipientEmail: form.recipientEmail.trim() || undefined,
        message: form.message.trim() || undefined,
        sendNotification: form.sendNotification
      });
      toast.success('Gift card created.');
      setForm(DEFAULT_FORM);
      setPage(1);
      fetchGiftCards();
      fetchHistory();
    } catch (err) {
      toast.error(err.message || 'Unable to create gift card.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = useCallback(async (card) => {
    try {
      await api.patch(`/gift-cards/${card.id}`, { isActive: !card.isActive });
      toast.success(`Card ${card.code} is now ${card.isActive ? 'inactive' : 'active'}.`);
      fetchGiftCards();
    } catch (err) {
      toast.error(err.message || 'Unable to update card status.');
    }
  };

  const handleSendEmail = useCallback(async (card) => {
    const defaultEmail = card.metadata?.recipientEmail || '';
    const recipientEmail = window.prompt('Recipient email', defaultEmail);
    if (!recipientEmail) return;
    const note = window.prompt('Optional personal message', card.metadata?.note || '');
    setEmailSendingId(card.id);
    try {
      await api.post(`/gift-cards/${card.id}/send-email`, {
        recipientEmail,
        message: note || undefined
      });
      toast.success(`Notification sent to ${recipientEmail}.`);
      fetchGiftCards();
      fetchHistory();
    } catch (err) {
      toast.error(err.message || 'Unable to send email.');
    } finally {
      setEmailSendingId('');
    }
  };

  const giftCardStats = useMemo(() => {
    const total = giftCards.length;
    const active = giftCards.filter((card) => card.isActive).length;
    return { total, active };
  }, [giftCards]);

  const giftCardRows = useMemo(() => giftCards.map((card) => {
    const notification = getLatestNotification(card.metadata);
    const latestRedemption = card.redemptions?.[0];
    return (
      <tr key={card.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
        <td style={{ padding: '0.75rem' }}>
          {card.code}
          {!card.isActive && <div style={{ fontSize: '0.65rem', color: '#dc2626' }}>inactive</div>}
        </td>
        <td style={{ padding: '0.75rem' }}>{formatCurrency(card.value)}</td>
        <td style={{ padding: '0.75rem' }}>{formatCurrency(card.balance)}</td>
        <td style={{ padding: '0.75rem' }}>{card.expiresAt ? new Date(card.expiresAt).toLocaleDateString() : 'No expiry'}</td>
        <td style={{ padding: '0.75rem' }}>{card.metadata?.recipientEmail || <span style={{ color: 'var(--text-muted)' }}>Not assigned</span>}</td>
        <td style={{ padding: '0.75rem' }}>
          {notification ? (
            <div style={{ fontSize: '0.75rem' }}>
              <strong>{notification.status === 'sent' ? 'Delivered' : 'Failed'}</strong>
              <div>{notification.email}</div>
              <div style={{ color: 'var(--text-muted)' }}>{new Date(notification.sentAt).toLocaleString()}</div>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>None</span>
          )}
        </td>
        <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
          {latestRedemption ? (
            <div>
              <div>
                {card.redemptions.length} redemption{card.redemptions.length > 1 ? 's' : ''}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                {formatCurrency(latestRedemption.amount)} · {formatTimestamp(latestRedemption.created_at || latestRedemption.createdAt)}
              </div>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>No activity</span>
          )}
        </td>
        <td style={{ padding: '0.75rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={() => handleSendEmail(card)}
            disabled={Boolean(emailSendingId)}
          >
            <Mail size={14} /> Send email
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
            onClick={() => handleToggleActive(card)}
          >
            {card.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </td>
      </tr>
    );
  }), [giftCards, emailSendingId, handleSendEmail, handleToggleActive]);

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Gift Cards</h1>
        <button className="btn-secondary" onClick={() => fetchGiftCards()}>
          <RefreshCw size={16} /> Refresh list
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Create gift card</h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label>
              Code
              <input
                className="input-field"
                value={form.code}
                onChange={(event) => handleFormChange('code', event.target.value)}
                placeholder="GIFT-2026"
              />
            </label>
            <label>
              Value
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field"
                value={form.value}
                onChange={(event) => handleFormChange('value', event.target.value)}
                placeholder="99.99"
              />
            </label>
            <label>
              Initial balance (optional)
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field"
                value={form.initialBalance}
                onChange={(event) => handleFormChange('initialBalance', event.target.value)}
                placeholder="99.99"
              />
            </label>
            <label>
              Recipient email (optional)
              <input
                className="input-field"
                value={form.recipientEmail}
                onChange={(event) => handleFormChange('recipientEmail', event.target.value)}
                placeholder="john@domain.com"
              />
            </label>
            <label>
              Expiry date
              <input
                type="date"
                className="input-field"
                value={form.expiresAt}
                onChange={(event) => handleFormChange('expiresAt', event.target.value)}
              />
            </label>
            <label>
              Message (optional)
              <textarea
                rows={3}
                className="input-field"
                value={form.message}
                onChange={(event) => handleFormChange('message', event.target.value)}
                placeholder="Personalize the notification..."
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="checkbox"
                checked={form.sendNotification}
                onChange={(event) => handleFormChange('sendNotification', event.target.checked)}
              />
              Send email notification if recipient email is provided
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => handleFormChange('isActive', event.target.checked)}
              />
              Activate the gift card immediately
            </label>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create gift card'}
            </button>
          </form>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Gift size={18} /> <h2 style={{ margin: 0 }}>Stats</h2>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{giftCardStats.total}</div>
              <small style={{ color: 'var(--text-muted)' }}>Cards visible</small>
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{giftCardStats.active}</div>
              <small style={{ color: 'var(--text-muted)' }}>Active</small>
            </div>
          </div>
          <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>
            Notifications are recorded with timestamps so you can see who was emailed last.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h2 style={{ margin: 0 }}>Issued gift cards</h2>
            <small style={{ color: 'var(--text-muted)' }}>Search, filter status, and re-send notifications.</small>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.25rem 0.75rem', background: 'white' }}>
              <Search size={16} color="#94a3b8" />
              <input
                className="input-field"
                placeholder="Search by code"
                style={{ width: '220px', border: 'none', padding: 0 }}
                value={filters.search}
                onChange={(event) => handleFilterChange('search', event.target.value)}
              />
            </div>
            <select
              className="input-field"
              value={filters.status}
              onChange={(event) => handleFilterChange('status', event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                {['Code', 'Value', 'Balance', 'Expiry', 'Recipient', 'Notifications', 'Redemptions', 'Actions'].map((heading) => (
                  <th key={heading} style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '1.25rem' }}>Loading...</td>
                </tr>
              ) : giftCards.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '1.25rem' }}>No gift cards yet.</td>
                </tr>
              ) : (
                giftCards.map((card) => {
                  const notification = getLatestNotification(card.metadata);
                  const latestRedemption = card.redemptions?.[0];
                  return (
                    <tr key={card.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                        {card.code}
                        {!card.isActive && <div style={{ fontSize: '0.65rem', color: '#dc2626' }}>inactive</div>}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{formatCurrency(card.value, currency)}</td>
                      <td style={{ padding: '0.75rem' }}>{formatCurrency(card.balance, currency)}</td>
                      <td style={{ padding: '0.75rem' }}>{card.expiresAt ? new Date(card.expiresAt).toLocaleDateString() : 'No expiry'}</td>
                      <td style={{ padding: '0.75rem' }}>{card.metadata?.recipientEmail || <span style={{ color: 'var(--text-muted)' }}>Not assigned</span>}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {notification ? (
                          <div style={{ fontSize: '0.75rem' }}>
                            <strong>{notification.status === 'sent' ? 'Delivered' : 'Failed'}</strong>
                            <div>{notification.email}</div>
                            <div style={{ color: 'var(--text-muted)' }}>{new Date(notification.sentAt).toLocaleString()}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>None</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                        {latestRedemption ? (
                          <div>
                            <div>
                              {card.redemptions.length} redemption{card.redemptions.length > 1 ? 's' : ''}
                            </div>
                            <div style={{ color: 'var(--text-muted)' }}>
                              {formatCurrency(latestRedemption.amount, currency)} · {formatTimestamp(latestRedemption.created_at || latestRedemption.createdAt)}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>No activity</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          onClick={() => handleSendEmail(card)}
                          disabled={Boolean(emailSendingId)}
                        >
                          <Mail size={14} /> Send email
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => handleToggleActive(card)}
                        >
                          {card.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {pagination.pages > 1 && (
          <div style={{ padding: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[...Array(pagination.pages)].map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPage(index + 1)}
                className="btn-secondary"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  backgroundColor: page === index + 1 ? 'var(--primary-color)' : 'transparent',
                  color: page === index + 1 ? '#fff' : 'var(--text-main)'
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: '0 0 0.35rem' }}>Redemption history</h2>
            <small style={{ color: 'var(--text-muted)' }}>Track which users consumed gift cards and when.</small>
          </div>
          <button type="button" className="btn-secondary" onClick={() => fetchHistory()}>
            <ArrowRightLeft size={16} /> Refresh history
          </button>
        </div>
        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                {['Redeemed at', 'Gift card', 'Amount', 'Order', 'Customer'].map((heading) => (
                  <th key={heading} style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '1.25rem' }}>Loading history…</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '1.25rem' }}>No redemptions yet.</td>
                </tr>
              ) : (
                history.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem' }}>{formatTimestamp(entry.created_at || entry.createdAt)}</td>
                    <td style={{ padding: '0.75rem' }}>{entry.giftCard?.code}</td>
                    <td style={{ padding: '0.75rem' }}>{formatCurrency(entry.amount, currency)}</td>
                    <td style={{ padding: '0.75rem' }}>{entry.order?.id || '—'}</td>
                    <td style={{ padding: '0.75rem' }}>{entry.user?.name || entry.user?.email || 'Guest'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {Math.ceil(historyTotal / historyLimit) > 1 && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[...Array(Math.ceil(historyTotal / historyLimit))].map((_, idx) => (
              <button
                key={idx}
                type="button"
                className="btn-secondary"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  backgroundColor: historyPage === idx + 1 ? 'var(--primary-color)' : 'transparent',
                  color: historyPage === idx + 1 ? '#fff' : 'var(--text-main)'
                }}
                onClick={() => setHistoryPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        )}
        </div>
        <PaginationControls
          currentPage={pagination.currentPage || page}
          totalPages={Math.max(1, pagination.pages || 1)}
          onChange={(targetPage) => setPage(targetPage)}
        />
      </div>
  );
}
