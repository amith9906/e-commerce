import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { LogOut, Truck, MapPin, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';
import { formatCurrency } from '../../utils/formatCurrency';

export default function SalespersonDashboard() {
  const { user, logout } = useAuth();
  const { currency = 'INR' } = useBrand();
  const [assignments, setAssignments] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [kpi, setKpi] = useState(null);
  const [busyTransfer, setBusyTransfer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'salesperson') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchAssignments(), fetchPending(), fetchKpi()]);
  };

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/salespersons/assignments');
      if (res.success) setAssignments(res.data || []);
    } catch (err) {
      console.error('Failed to load assignments', err);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await api.get('/salespersons/pending-transfers');
      if (res.success) setPendingTransfers(res.data || []);
    } catch (err) {
      console.error('Failed to load pending transfers', err);
    }
  };

  const fetchKpi = async () => {
    try {
      const res = await api.get('/salespersons/kpi');
      if (res.success) setKpi(res.data);
    } catch (err) {
      console.error('Failed to load KPIs', err);
    }
  };

  const handleDeliver = async (transferId) => {
    if (busyTransfer) return;
    const location = prompt('Location or shop delivered to (optional):');
    const notes = prompt('Delivery notes (optional):');
    setBusyTransfer(transferId);
    try {
      const res = await api.post(`/salespersons/transfers/${transferId}/deliver`, { location, notes });
      if (res.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to log delivery', err);
    } finally {
      setBusyTransfer(null);
    }
  };

  const assignmentsList = useMemo(() => assignments.map((item) => ({
    ...item.store,
    assignedAt: item.createdAt
  })), [assignments]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
        <div>
          <h1>Salesperson Dashboard</h1>
          <p style={{ color: '#6b7280' }}>Hello {user?.name}, manage your store routes and deliveries here.</p>
        </div>
        <button onClick={logout} style={{ border: 'none', background: '#ef4444', color: 'white', borderRadius: '10px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={16} /> Logout
        </button>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <article style={{ padding: '1rem 1.25rem', borderRadius: '16px', background: '#fff', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', marginBottom: '0.5rem' }}>
            <Truck size={18} /> Pending Transfers
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{kpi ? kpi.totalTransfers : '--'}</div>
        </article>
        <article style={{ padding: '1rem 1.25rem', borderRadius: '16px', background: '#fff', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', marginBottom: '0.5rem' }}>
            <MapPin size={18} /> Total Units Moved
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{kpi ? kpi.totalUnits : '--'}</div>
        </article>
        <article style={{ padding: '1rem 1.25rem', borderRadius: '16px', background: '#fff', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', marginBottom: '0.5rem' }}>
            <FileText size={18} /> Pending Invoices
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{kpi ? kpi.pendingInvoices : '--'}</div>
        </article>
        <article style={{ padding: '1rem 1.25rem', borderRadius: '16px', background: '#fff', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', marginBottom: '0.5rem' }}>
            <Truck size={18} /> Total Revenue
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{kpi ? formatCurrency(kpi.totalRevenue, currency) : '--'}</div>
        </article>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Assigned Stores</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          {assignmentsList.map((store) => (
            <div key={store.id} style={{ flex: '1 1 240px', background: '#fff', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(15,23,42,0.08)' }}>
              <strong>{store.name}</strong>
              <p style={{ margin: '0.5rem 0', color: '#6b7280' }}>{store.contact_phone || 'No phone'}</p>
              <small style={{ color: '#94a3b8' }}>Status: {store.status}</small>
            </div>
          ))}
          {!assignmentsList.length && <p style={{ color: '#6b7280' }}>Awaiting assignments from admin.</p>}
        </div>
      </section>

      <section>
        <h2>Pending Transfers</h2>
        <div style={{ marginTop: '1rem', background: '#fff', borderRadius: '16px', border: '1px solid rgba(15,23,42,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr auto', padding: '1rem', borderBottom: '1px solid rgba(15,23,42,0.08)', fontWeight: 600 }}>
            <span>Product</span>
            <span>Destination</span>
            <span>Quantity</span>
            <span />
          </div>
          {pendingTransfers.map((transfer) => (
            <div key={transfer.id} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr auto', padding: '1rem', borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
              <span>{transfer.product?.name || 'SKU'}</span>
              <span>{transfer.destinationStore?.name || 'Store'}</span>
              <span>{transfer.quantity}</span>
              <button
                onClick={() => handleDeliver(transfer.id)}
                disabled={busyTransfer === transfer.id}
                style={{ border: 'none', background: '#10b981', color: '#fff', borderRadius: '10px', padding: '0.4rem 0.9rem', cursor: 'pointer' }}
              >
                {busyTransfer === transfer.id ? 'Saving…' : 'Mark Delivered'}
              </button>
            </div>
          ))}
          {!pendingTransfers.length && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No pending transfers. Nice work!</div>
          )}
        </div>
      </section>
    </div>
  );
}
