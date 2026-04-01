import { useRef, useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { Bell } from 'lucide-react';

const STATUS_BADGES = {
  open: '#10b981',
  in_progress: '#f59e0b',
  resolved: '#3b82f6',
  closed: '#6b7280'
};

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responseLoading, setResponseLoading] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replyFiles, setReplyFiles] = useState([]);
  const [replyLoading, setReplyLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const seenNotifications = useRef(new Set());
  const notificationsInitialized = useRef(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/tickets', { params });
      if (res.success) setTickets(res.data);
    } catch (err) {
      toast.error('Unable to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = useCallback(async () => {
    try {
      setNotificationLoading(true);
      const res = await api.get('/notifications', { params: { page: 1, limit: 5 } });
      if (res.success) {
        const filtered = Array.isArray(res.data) ? res.data.filter((note) => ['info', 'warning'].includes(note.type || 'info')) : [];
        setNotifications(filtered);
        setUnreadCount(filtered.filter((note) => !note.isRead).length);
        const newItems = filtered.filter((note) => !note.isRead && !seenNotifications.current.has(note.id));
        if (notificationsInitialized.current) {
          newItems.forEach((note) => {
            toast.info(note.message || note.title || 'New update from support.');
            seenNotifications.current.add(note.id);
          });
        } else {
          filtered.forEach((note) => seenNotifications.current.add(note.id));
          notificationsInitialized.current = true;
        }
      }
    } catch (err) {
      console.warn('Notification poll error', err);
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await api.post('/tickets', data);
      if (res.success) {
        toast.success('Ticket submitted.');
        reset();
        setStatusFilter('');
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const openTicket = async (id) => {
    setResponseLoading(true);
    try {
      const res = await api.get(`/tickets/${id}`);
      if (res.success) {
        setSelectedTicket(res.data);
        setReplyBody('');
        setReplyFiles([]);
      }
    } catch (err) {
      toast.error('Unable to load ticket history.');
    } finally {
      setResponseLoading(false);
    }
  };

  const markNotificationsRead = useCallback(async () => {
    const unread = notifications.filter((note) => !note.isRead && ['info', 'warning'].includes(note.type || 'info'));
    if (!unread.length) return;
    try {
      await Promise.all(unread.map((note) => api.patch(`/notifications/${note.id}/read`)));
      loadNotifications();
    } catch (err) {
      console.warn('Failed to mark notifications read', err);
    }
  }, [loadNotifications, notifications]);

  useEffect(() => {
    if (selectedTicket) {
      markNotificationsRead();
    }
  }, [selectedTicket, markNotificationsRead]);

  const handleReplyFiles = (event) => {
    if (!event.target.files) return;
    setReplyFiles(Array.from(event.target.files));
  };

  const handleSendReply = async () => {
    if (!selectedTicket || (!replyBody && !replyFiles.length)) return;
    setReplyLoading(true);
    try {
      const formData = new FormData();
      formData.append('body', replyBody);
      formData.append('senderType', 'customer');
      replyFiles.forEach((file) => formData.append('attachments', file));
      await api.post(`/tickets/${selectedTicket.id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Response saved.');
      setReplyBody('');
      setReplyFiles([]);
      openTicket(selectedTicket.id);
      fetchTickets();
    } catch (err) {
      toast.error(err.message || 'Failed to send response.');
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '2rem', padding: '2rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Support center</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>We send notifications about ticket replies and status changes here.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ borderRadius: '999px', border: '1px solid #d1d5db', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            disabled={notificationLoading}
          >
            <Bell size={18} />
            {notificationLoading ? 'Checking…' : `${unreadCount} unread`}
          </button>
          {notifications[0] && (
            <span style={{ fontSize: '0.9rem', color: '#374151' }}>
              Latest: {notifications[0].title} — {notifications[0].message}
            </span>
          )}
        </div>
      </div>
      <div className="card" style={{ padding: '2rem' }}>
        <h2>Raise a support ticket</h2>
        <p style={{ color: 'var(--text-muted)' }}>Share any issues or questions with our support team.</p>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <label className="form-label">Subject</label>
            <input {...register('title', { required: 'Subject is required' })} className="input-field" placeholder="Brief summary" />
            {errors.title && <small className="input-error">{errors.title.message}</small>}
          </div>
          <div>
            <label className="form-label">Message</label>
            <textarea {...register('body', { required: 'Let us know what happened' })} className="input-field" rows="4" />
            {errors.body && <small className="input-error">{errors.body.message}</small>}
          </div>
          <div>
            <label className="form-label">Priority</label>
            <select {...register('priority')} className="input-field">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Submitting ticket�' : 'Submit ticket'}
          </button>
        </form>
      </div>
      <div className="card" style={{ padding: '2rem' }}>
        <h2>My tickets</h2>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {['', 'open', 'in_progress', 'resolved', 'closed'].map((key) => (
            <button
              key={key || 'all'}
              type="button"
              className="btn-secondary"
              style={{ fontWeight: statusFilter === key ? 700 : 500 }}
              onClick={() => setStatusFilter(key)}
            >
              {key === '' ? 'All' : key.replace('_', ' ')}
            </button>
          ))}
        </div>
        {loading ? (
          <p>Loading tickets�</p>
        ) : tickets.length === 0 ? (
          <p className="muted-text">No tickets yet. Submit one above whenever needed.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tickets.map((ticket) => (
              <div key={ticket.id} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{ticket.title}</strong>
                  <span style={{ fontSize: '0.85rem', color: STATUS_BADGES[ticket.status] || '#2563eb' }}>{ticket.status.replace('_', ' ')}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Updated {new Date(ticket.updatedAt).toLocaleString()}
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
                  <p style={{ margin: 0 }}>Priority: {ticket.priority}</p>
                  <p style={{ margin: 0 }}>
                    Latest: {ticket.messages?.[0]?.body || 'Awaiting reply'}
                  </p>
                </div>
                <button className="btn-secondary" style={{ marginTop: '0.75rem', alignSelf: 'flex-start' }} onClick={() => openTicket(ticket.id)}>
                  View history
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTicket && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 60 }}>
          <div className="card" style={{ width: 'min(600px, 100%)', maxHeight: '80vh', overflowY: 'auto', padding: '1.5rem', position: 'relative' }}>
            <button type="button" onClick={() => setSelectedTicket(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'transparent' }}>
              �
            </button>
            <h3 style={{ marginTop: 0 }}>{selectedTicket.title}</h3>
            <p style={{ color: '#6b7280', marginTop: '0' }}>Tickets history</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {responseLoading ? (
                <p style={{ margin: 0 }}>Loading history�</p>
              ) : (
                (selectedTicket.messages || []).map((message) => (
                  <div key={message.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem', background: message.senderType === 'customer' ? '#fdf2f8' : '#ecfdf5' }}>
                    <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{message.senderType === 'admin' ? 'Tenant admin' : 'You'}</span>
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
                ))
              )}
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Add a note or clarification for the admin..."
              />
              <input type="file" multiple onChange={handleReplyFiles} />
              <button
                type="button"
                disabled={replyLoading}
                className="btn-primary"
                onClick={handleSendReply}
              >
                {replyLoading ? 'Saving response�' : 'Send reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
