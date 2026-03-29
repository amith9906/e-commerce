import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/client';
import dayjs from 'dayjs';
import { Shield, ShieldAlert, User as UserIcon, ShoppingBag, ChevronDown, ChevronUp, MapPin, Phone, Mail, Calendar } from 'lucide-react';

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = () => {
    setLoading(true);
    api.get(`/users?page=${page}&limit=${limit}`)
      .then(res => { 
        if (res.success) {
            setUsers(res.data);
            if (res.pagination) setTotalPages(res.pagination.pages);
        }
      })
      .catch(err => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  const toggleExpand = (userId) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>User Management</h1>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Users: {users.length}</div>
      </div>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '1.25rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
              <th style={{ padding: '1.25rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</th>
              <th style={{ padding: '1.25rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
              <th style={{ padding: '1.25rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ padding: '1.25rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>No users found.</td></tr>
            ) : (
              users.map(user => (
                <>
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary-color)' }}>
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{user.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Joined {dayjs(user.createdAt).format('MMM D, YYYY')}</div>
                            </div>
                        </div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Mail size={14} color="var(--text-muted)" /> {user.email}
                            </div>
                            {user.phone && (
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Phone size={14} /> {user.phone}
                                </div>
                            )}
                        </div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                        {user.role === 'customer' && <UserIcon size={16} color="#64748b" />}
                        {user.role === 'admin' && <Shield size={16} color="#3b82f6" />}
                        {user.role === 'superadmin' && <ShieldAlert size={16} color="#8b5cf6" />}
                        <span style={{ textTransform: 'uppercase', color: user.role === 'customer' ? 'var(--text-main)' : 'var(--primary-color)', fontWeight: 800, fontSize: '0.7rem' }}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <span style={{ 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: '6px', 
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        backgroundColor: user.isVerified ? '#d1fae5' : '#fee2e2',
                        color: user.isVerified ? '#065f46' : '#991b1b'
                      }}>
                        {user.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            {user.role === 'customer' && (
                                <button 
                                    onClick={() => navigate(`/admin/orders?userId=${user.id}`)}
                                    title="View Purchase History"
                                    style={{ 
                                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
                                        border: '1px solid var(--border-color)', padding: '0.5rem 0.75rem', 
                                        borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                                        backgroundColor: 'white', cursor: 'pointer', transition: '0.2s'
                                    }}
                                >
                                    <ShoppingBag size={14} /> Orders
                                </button>
                            )}
                            <button 
                                onClick={() => toggleExpand(user.id)}
                                style={{ 
                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
                                    border: '1px solid var(--border-color)', padding: '0.5rem 0.75rem', 
                                    borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                                    backgroundColor: 'white', cursor: 'pointer', transition: '0.2s'
                                }}
                            >
                                {expandedUserId === user.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                Details
                            </button>
                        </div>
                    </td>
                  </tr>
                  
                  {expandedUserId === user.id && (
                    <tr style={{ backgroundColor: '#fcfcfd' }}>
                        <td colSpan="5" style={{ padding: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MapPin size={16} /> Saved Addresses
                                    </h4>
                                    {user.addresses && user.addresses.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {user.addresses.map((addr, i) => (
                                                <div key={i} style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{addr.fullName} <span style={{ fontSize: '0.7rem', color: 'var(--primary-color)', marginLeft: '0.5rem' }}>({addr.label})</span></div>
                                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{addr.addressLine1}, {addr.city}, {addr.state} {addr.postalCode}</div>
                                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{addr.country}</div>
                                                    {addr.phone && <div style={{ fontSize: '0.8125rem', color: 'var(--text-main)', marginTop: '0.5rem', fontWeight: 600 }}>Ph: {addr.phone}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No addresses added yet.</p>
                                    )}
                                </div>
                                
                                <div>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={16} /> Activity Summary
                                    </h4>
                                    <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Account ID</span>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'monospace' }}>{user.id}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Last Profile Update</span>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{dayjs(user.updatedAt).fromNow()}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Marketing Pref</span>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#10b981' }}>Enabled</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => navigate(`/admin/orders?userId=${user.id}`)}
                                        className="btn-primary" 
                                        style={{ width: '100%', marginTop: '1.5rem', height: '3rem', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 700 }}
                                    >
                                        View All Transactions
                                    </button>
                                </div>
                            </div>
                        </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#fcfcfd' }}>
             {[...Array(totalPages)].map((_, i) => (
                <button
                   key={i}
                   onClick={() => setPage(i + 1)}
                   style={{
                      width: '36px', height: '36px', borderRadius: '8px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                      border: page === i + 1 ? 'none' : '1px solid var(--border-color)',
                      backgroundColor: page === i + 1 ? 'var(--primary-color)' : 'white',
                      color: page === i + 1 ? 'white' : 'var(--text-main)',
                      transition: '0.2s'
                   }}
                >
                   {i + 1}
                </button>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
