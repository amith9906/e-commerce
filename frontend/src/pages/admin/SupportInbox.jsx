import { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { MessageSquare, RefreshCw } from 'lucide-react';
import api from '../../api/client';
import PaginationControls from '../../components/PaginationControls';

const statusLabels = {
  new: 'New',
  read: 'Read',
  resolved: 'Resolved',
};

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'New', value: 'new' },
  { label: 'Read', value: 'read' },
  { label: 'Resolved', value: 'resolved' },
];

export default function SupportInbox() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState({});
  const [error, setError] = useState('');

  const limit = 12;

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit };
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/support', { params });
      setMessages(res.data || []);
      setPagination(res.pagination || {});
    } catch (err) {
      const message = err.message || 'Unable to load inquiries.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleStatusChange = useCallback(async (id, newStatus) => {
    try {
      await api.patch(`/support/${id}/status`, {
        status: newStatus,
        adminNotes: notes[id] || null,
      });
      toast.success('Inquiry status updated.');
      loadMessages();
    } catch (err) {
      toast.error(err.message || 'Failed to update status.');
    }
  }, [notes, loadMessages]);

  const currentPage = pagination.currentPage || pagination.page || page;
  const totalPages = Math.max(1, pagination.pages || 1);

  const addNote = (id, value) => {
    setNotes((prev) => ({ ...prev, [id]: value }));
  };

  const supportRows = useMemo(() => messages.map((record) => (
    <tr key={record.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
      <td style={{ padding: '0.75rem 1rem' }}>{record.name}</td>
      <td style={{ padding: '0.75rem 1rem' }}>{record.email}</td>
      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{record.subject}</td>
      <td
        style={{ padding: '0.75rem 1rem' }}
        title={record.message}
      >
        {record.message.length > 80 ? `${record.message.slice(0, 80)}...` : record.message}
      </td>
      <td style={{ padding: '0.75rem 1rem' }}>
        <span
          style={{
            padding: '0.25rem 0.65rem',
            borderRadius: '999px',
            background: '#eef2ff',
            color: '#4338ca',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          {statusLabels[record.status] || record.status}
        </span>
      </td>
      <td style={{ padding: '0.5rem 1rem' }}>
        <textarea
          value={notes[record.id] ?? record.adminNotes ?? ''}
          onChange={(event) => addNote(record.id, event.target.value)}
          placeholder="Add a note"
          style={{
            width: '100%',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '0.5rem',
            minHeight: '48px',
            fontSize: '0.85rem',
          }}
        />
      </td>
      <td style={{ padding: '0.75rem 1rem' }}>{new Date(record.createdAt).toLocaleString()}</td>
      <td style={{ padding: '0.75rem 1rem' }}>
        <select
          value={record.status}
          onChange={(event) => handleStatusChange(record.id, event.target.value)}
          style={{
            padding: '0.4rem 0.6rem',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
          }}
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </td>
    </tr>
  )), [messages, notes, handleStatusChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MessageSquare size={20} color="#4338ca" />
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Support Inbox</h2>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value || 'all'}
              type="button"
              onClick={() => {
                setPage(1);
                setStatusFilter(option.value);
              }}
              style={{
                border: '1px solid #d1d5db',
                background: statusFilter === option.value ? '#eef2ff' : 'white',
                color: statusFilter === option.value ? '#4338ca' : '#4b5563',
                padding: '0.4rem 1rem',
                borderRadius: '999px',
                cursor: 'pointer',
                fontWeight: statusFilter === option.value ? 600 : 500,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} />
          <button
            type="button"
            onClick={loadMessages}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#111827',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'underline',
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Name', 'Email', 'Subject', 'Message', 'Status', 'Admin Notes', 'Created', 'Actions'].map((title) => (
                  <th
                    key={title}
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: '0.85rem',
                      color: '#6b7280',
                    }}
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} style={{ padding: '1rem', textAlign: 'center' }}>
                    Loading...
                  </td>
                </tr>
              )}
        {!loading && messages.length === 0 && (
          <tr>
            <td colSpan={8} style={{ padding: '1rem', textAlign: 'center' }}>
              No inquiries found.
            </td>
          </tr>
        )}
        {!loading && supportRows}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: '#fee2e2',
            color: '#b91c1c',
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}
      <PaginationControls currentPage={currentPage} totalPages={totalPages} onChange={(target) => setPage(target)} />
    </div>
  );
}
