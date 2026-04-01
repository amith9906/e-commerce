'use strict';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/client';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const navigate = useNavigate();

  const fetchNotifications = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await api.get('/notifications', { params: { page: targetPage, limit: 12 } });
      if (res.success) {
        setNotifications(res.data);
        setPagination(res.pagination || {});
        setPage(targetPage);
      }
    } catch (err) {
      toast.error(err.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = useMemo(() => pagination.pages || 1, [pagination]);
  const markAsRead = async (notification) => {
    if (notification.isRead) return;
    try {
      await api.patch(`/notifications/${notification.id}/read`);
      fetchNotifications(page);
    } catch (err) {
      toast.error('Failed to mark notification as read.');
    }
  };

  const handleViewTicket = async (notification) => {
    await markAsRead(notification);
    if (notification.referenceId) {
      navigate(`/admin/tickets?ticketId=${notification.referenceId}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h1 style={{ margin: 0 }}>Notifications</h1>
        <p style={{ color: '#6b7280' }}>Tenant updates, ticket replies, and broadcast alerts land here.</p>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Title', 'Message', 'Type', 'Created', 'Actions'].map((title) => (
                  <th key={title} style={{ textAlign: 'left', padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.85rem', color: '#6b7280' }}>
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} style={{ padding: '1rem', textAlign: 'center' }}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && notifications.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '1rem', textAlign: 'center' }}>
                    No notifications yet.
                  </td>
                </tr>
              )}
              {!loading &&
                notifications.map((notification) => (
                  <tr
                    key={notification.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      fontWeight: notification.isRead ? 500 : 700,
                      background: notification.isRead ? 'white' : '#f0f9ff'
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>{notification.title}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{notification.message}</td>
                    <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize' }}>{notification.type || 'info'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{new Date(notification.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '0.85rem' }}
                        onClick={() => handleViewTicket(notification)}
                      >
                        View ticket
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#6b7280' }}>Page {page} of {totalPages}</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => fetchNotifications(Math.max(1, page - 1))}
          >
            Prev
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={page >= totalPages}
            onClick={() => fetchNotifications(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
