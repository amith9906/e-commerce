import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import api from '../../api/client';
import PaginationControls from '../../components/PaginationControls';

const statusColors = {
  open: '#10b981',
  in_progress: '#f59e0b',
  resolved: '#3b82f6',
  closed: '#6b7280',
};

export default function TicketCenter() {
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyFiles, setReplyFiles] = useState([]);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [tickets, setTickets] = useState([]);
  const [responseLoading, setResponseLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, pages: 1, total: 0 });
  const PAGE_LIMIT = 10;

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_LIMIT };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      const res = await api.get('/tickets/admin/all', { params });
      if (res.success) {
        setTickets(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
          if (res.pagination.pages && page > res.pagination.pages) {
            setPage(res.pagination.pages);
          }
        }
      }
    } catch (err) {
      toast.error('Unable to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();

  const loadTicketDetails = useCallback(async (ticketId) => {
    setDetails(null);
    setResponseLoading(true);
    try {
      const res = await api.get(`/tickets/${ticketId}`);
      if (res.success) {
        setDetails(res.data);
        setSelected((prev) => (prev?.id === ticketId ? prev : { id: ticketId, title: res.data.title }));
        setStatus(res.data.status);
      }
    } catch (err) {
      toast.error('Unable to load ticket history.');
    } finally {
      setResponseLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [filters, page]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ticketId = params.get('ticketId');
    if (ticketId) {
      loadTicketDetails(ticketId);
    }
  }, [location.search, loadTicketDetails]);

  useEffect(() => {
    if (selected) {
      setStatus(selected.status);
      setMessage('');
    }
  }, [selected]);

  const handleSelect = async (ticket) => {
    setSelected(ticket);
    setStatus(ticket.status);
    await loadTicketDetails(ticket.id);
  };

  const handleReplyFiles = (event) => {
    if (!event.target.files) return;
    setReplyFiles(Array.from(event.target.files));
  };

  const handleReply = async () => {
    if (!selected || (!message.trim() && !replyFiles.length)) return;
    setReplyLoading(true);
    try {
      const formData = new FormData();
      formData.append('body', message);
      formData.append('senderType', 'admin');
      formData.append('status', status);
      replyFiles.forEach((file) => formData.append('attachments', file));
      await api.post(`/tickets/${selected.id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Update posted.');
      fetchTickets();
      setMessage('');
      setReplyFiles([]);
      handleSelect(selected);
    } catch (err) {
      toast.error(err.message || 'Unable to post update.');
    } finally {
      setReplyLoading(false);
    }
  };

  const visibleTicket = details || selected;
  const messages = visibleTicket?.messages || [];

  return (
    <div className="responsive-stack" style={{ alignItems: 'stretch' }}>
      <section style={{ flex: '0 0 360px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2>Incoming tickets</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['', 'open', 'in_progress', 'resolved', 'closed'].map((key) => (
            <button
              key={key || 'all'}
              type="button"
              className="btn-secondary"
              style={{ fontWeight: filters.status === key ? 700 : 500 }}
              onClick={() => updateFilter('status', key)}
            >
              {key === '' ? 'All statuses' : key.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['', 'low', 'medium', 'high'].map((key) => (
            <button
              key={key || 'all-priority'}
              type="button"
              className="btn-secondary"
              style={{ fontWeight: filters.priority === key ? 700 : 500 }}
              onClick={() => updateFilter('priority', key)}
            >
              {key === '' ? 'All priorities' : key}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          {loading ? (
            <p>Loading…</p>
          ) : tickets.length === 0 ? (
            <p className="muted-text">No tickets yet.</p>
          ) : (
            tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => handleSelect(ticket)}
                style={{
                  border: selected?.id === ticket.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  textAlign: 'left',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{ticket.title}</strong>
                  <span style={{ color: statusColors[ticket.status], textTransform: 'capitalize', fontSize: '0.85rem' }}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {ticket.author?.name} · {ticket.priority}
                </div>
              </button>
            ))
          )}
        </div>
        <PaginationControls
          currentPage={pagination.currentPage || page}
          totalPages={pagination.pages || 1}
          onChange={(targetPage) => setPage(targetPage)}
        />
      </section>

      <section className="card" style={{ flex: 1, padding: '1.5rem', minHeight: '420px' }}>
        {!selected ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Select a ticket to view details.</div>
        ) : (
          <>
            <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0 }}>{selected.title}</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {selected.author?.name} · {selected.author?.email}
                </p>
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input-field"
                style={{ minWidth: '140px' }}
              >
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </header>

            {responseLoading && (
              <p className="muted-text" style={{ marginTop: '-0.75rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                Loading ticket history…
              </p>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <strong>Conversation</strong>
              <p className="muted-text" style={{ marginTop: '0.25rem' }}>
                {messages?.[0]?.body || 'Awaiting response'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    background: message.senderType === 'admin' ? '#ecfdf5' : '#fdf2f8',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{message.senderType === 'admin' ? 'You (admin)' : 'Customer'}</span>
                    <span>{new Date(message.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.95rem' }}>{message.body}</p>
                  {message.attachments?.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {message.attachments.map((att, idx) => (
                        <a key={`${message.id}-${idx}`} href={att.url || att} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#2563eb' }}>
                          {att.label || 'Attachment'}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input-field"
              placeholder="Reply to customer or update the ticket status."
              rows={4}
            />
            <input type="file" multiple onChange={handleReplyFiles} />
            <button onClick={handleReply} className="btn-primary" style={{ marginTop: '0.5rem' }} disabled={replyLoading}>
              {replyLoading ? 'Posting update…' : 'Send update'}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
