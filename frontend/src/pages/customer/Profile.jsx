import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { User as UserIcon, MapPin, Mail, Phone, Shield, RefreshCw, Star } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';
import { formatCurrency } from '../../utils/formatCurrency';

const DEFAULT_GENDER = 'other';

export default function Profile() {
  const { user, login } = useAuth();
  const { settings: brandSettings = {} } = useBrand();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyHistory, setLoyaltyHistory] = useState([]);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setValue,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      gender: DEFAULT_GENDER,
    },
  });

  const {
    register: registerAddress,
    handleSubmit: handleAddressSubmit,
    reset: resetAddressForm,
    formState: { errors: addressErrors },
  } = useForm({
    defaultValues: {
      label: 'Home',
      isDefault: false,
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
  });

  const {
    register: registerChangePassword,
    handleSubmit: handleChangePassword,
    watch: watchChangePassword,
    reset: resetChangePassword,
    formState: { errors: changePasswordErrors },
  } = useForm();

  const refreshProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/me');
      if (res.success) {
        const profile = res.data;
        setAddresses(profile.addresses || []);
        setValue('name', profile.name || '');
        setValue('phone', profile.phone || '');
        setValue('age', profile.age || '');
        setValue('gender', profile.gender || DEFAULT_GENDER);
        setValue('email', profile.email || '');
      }
    } catch (err) {
      toast.error('Unable to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const loadLoyaltyInfo = async () => {
    try {
      setLoyaltyLoading(true);
      const balanceRes = await api.get('/loyalty/balance');
      if (balanceRes?.data) {
        setLoyaltyBalance(Number(balanceRes.data.balance || 0));
      }
      const historyRes = await api.get('/loyalty/history?limit=5');
      if (historyRes?.data?.history) {
        setLoyaltyHistory(historyRes.data.history);
      }
    } catch (err) {
      console.error('Unable to load loyalty info', err);
    } finally {
      setLoyaltyLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshProfile();
      loadLoyaltyInfo();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onUpdateProfile = async (data) => {
    try {
      setProfileSaving(true);
      const payload = {
        name: data.name,
        phone: data.phone,
        age: data.age || null,
        gender: data.gender,
      };
      const res = await api.put('/users/me', payload);
      if (res.success) {
        toast.success('Profile updated.');
        login(localStorage.getItem('token'), res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const onAddAddress = async (data) => {
    try {
      setAddressSaving(true);
      const payload = {
        ...data,
        isDefault: !!data.isDefault,
      };
      if (editingAddressId) {
        const res = await api.patch(`/users/addresses/${editingAddressId}`, payload);
        if (res.success) {
          toast.success('Address updated.');
          setEditingAddressId(null);
          resetAddressForm({
            label: 'Home',
            isDefault: false,
            fullName: '',
            phone: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
          });
          refreshProfile();
        }
      } else {
        const res = await api.post('/users/addresses', payload);
        if (res.success) {
          toast.success('Address added.');
          resetAddressForm({
            label: 'Home',
            isDefault: false,
            fullName: '',
            phone: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
          });
          refreshProfile();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save address');
    } finally {
      setAddressSaving(false);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await api.patch(`/users/addresses/${addressId}`, { isDefault: true });
      toast.success('Default address updated.');
      refreshProfile();
    } catch (err) {
      toast.error(err.message || 'Unable to update default address');
    }
  };

  const handleRemoveAddress = async (addressId) => {
    if (!window.confirm('Remove this address?')) return;
    try {
      await api.delete(`/users/addresses/${addressId}`);
      toast.success('Address removed.');
      refreshProfile();
    } catch (err) {
      toast.error(err.message || 'Unable to delete address');
    }
  };

  const startEditingAddress = (address) => {
    setEditingAddressId(address.id);
    resetAddressForm({
      label: address.label || 'Home',
      isDefault: !!address.isDefault,
      fullName: address.fullName || '',
      phone: address.phone || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditAddress = () => {
    setEditingAddressId(null);
    resetAddressForm({
      label: 'Home',
      isDefault: false,
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    });
  };

  const onChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    try {
      setChangePasswordLoading(true);
      const res = await api.post('/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (res.success) {
        toast.success(res.message || 'Password updated.');
        resetChangePassword();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <RefreshCw size={32} className="spin" />
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <UserIcon size={20} /> Personal Information
        </h2>
        <form onSubmit={handleProfileSubmit(onUpdateProfile)} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label className="form-label">Full Name</label>
            <input
              {...registerProfile('name', { required: 'Name is required' })}
              className="input-field"
              placeholder="Jane Doe"
            />
            {profileErrors.name && <small className="input-error">{profileErrors.name.message}</small>}
          </div>
          <div>
            <label className="form-label">Email Address</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={16} />
              <input {...registerProfile('email')} className="input-field" disabled />
            </div>
          </div>
          <div>
            <label className="form-label">Mobile Number</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={16} />
              <input {...registerProfile('phone')} className="input-field" placeholder="+91 98765 43210" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="form-label">Age</label>
              <input type="number" {...registerProfile('age')} className="input-field" placeholder="32" min="1" />
            </div>
            <div>
              <label className="form-label">Gender</label>
              <select {...registerProfile('gender')} className="input-field">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={profileSaving}>
            {profileSaving ? 'Saving changes…' : 'Save personal info'}
          </button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <MapPin size={20} /> Saved Shipping Addresses
        </div>
        {addresses.length === 0 && <p className="muted-text">No saved addresses yet.</p>}
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
          {addresses.map((address) => (
            <div key={address.id} className="address-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                <strong>{address.fullName}</strong>
                {address.isDefault && <span className="pill">Default</span>}
              </div>
              <div className="muted-text">
                {address.addressLine1}
                {address.addressLine2 && `, ${address.addressLine2}`}
                <br />
                {address.city}, {address.state || address.country} {address.postalCode}
                <br />
                {address.phone && `Phone: ${address.phone}`}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(address.id)}
                    className="text-button"
                  >
                    Set as default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveAddress(address.id)}
                  className="text-button muted"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => startEditingAddress(address)}
                  className="text-button"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddressSubmit(onAddAddress)} style={{ display: 'grid', gap: '1rem' }}>
          <p className="muted-text">
            {editingAddressId ? 'Edit address details or save to keep shipping options current.' : 'Add a shipping address to prefill checkout faster.'}
          </p>
          <div>
            <label className="form-label">Label</label>
            <input {...registerAddress('label')} className="input-field" placeholder="Home, Office, etc." />
          </div>
          <div>
            <label className="form-label">Full Name</label>
            <input
              {...registerAddress('fullName', { required: 'Recipient name is required' })}
              className="input-field"
              placeholder="Primary recipient"
            />
            {addressErrors.fullName && <small className="input-error">{addressErrors.fullName.message}</small>}
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input {...registerAddress('phone')} className="input-field" placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="form-label">Address Line 1</label>
            <input
              {...registerAddress('addressLine1', { required: 'Address is required' })}
              className="input-field"
            />
            {addressErrors.addressLine1 && (
              <small className="input-error">{addressErrors.addressLine1.message}</small>
            )}
          </div>
          <div>
            <label className="form-label">Address Line 2</label>
            <input {...registerAddress('addressLine2')} className="input-field" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="form-label">City</label>
              <input
                {...registerAddress('city', { required: 'City is required' })}
                className="input-field"
              />
              {addressErrors.city && <small className="input-error">{addressErrors.city.message}</small>}
            </div>
            <div>
              <label className="form-label">State</label>
              <input {...registerAddress('state')} className="input-field" />
            </div>
            <div>
              <label className="form-label">Postal Code</label>
              <input {...registerAddress('postalCode')} className="input-field" />
            </div>
            <div>
              <label className="form-label">Country</label>
              <input
                {...registerAddress('country', { required: 'Country is required' })}
                className="input-field"
              />
              {addressErrors.country && <small className="input-error">{addressErrors.country.message}</small>}
            </div>
          </div>
          <label className="flex-center">
            <input type="checkbox" {...registerAddress('isDefault')} />
            Set as default shipping address
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn-secondary" disabled={addressSaving}>
              {addressSaving ? 'Saving address…' : editingAddressId ? 'Save address' : 'Add address'}
            </button>
            {editingAddressId && (
              <button type="button" className="btn-secondary muted" onClick={cancelEditAddress}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Star size={20} /> Loyalty Points
        </div>
        {loyaltyLoading ? (
          <p className="muted-text">Loading loyalty data…</p>
        ) : (
          <>
            <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Balance: {formatCurrency(loyaltyBalance * (brandSettings?.loyalty?.valuePerPoint || 1), brandSettings?.currency || 'INR')}
              <br />
              <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>
                {loyaltyBalance} point{loyaltyBalance === 1 ? '' : 's'}
              </span>
            </p>
            {loyaltyHistory.length === 0 && (
              <p className="muted-text">No loyalty activity yet.</p>
            )}
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {loyaltyHistory.map((entry) => (
                <div key={entry.id} className="muted-text" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>
                    {entry.type === 'earned' ? '+' : '-'}
                    {entry.points} pts {entry.reason ? `(${entry.reason})` : ''}
                  </span>
                  <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Shield size={20} /> Account Security
        </div>
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
          <form onSubmit={handleChangePassword(onChangePassword)} style={{ display: 'grid', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Change Password</h3>
            <div>
              <label className="form-label">Current Password</label>
              <input
                type="password"
                {...registerChangePassword('currentPassword', { required: 'Current password is required' })}
                className="input-field"
              />
              {changePasswordErrors.currentPassword && (
                <small className="input-error">{changePasswordErrors.currentPassword.message}</small>
              )}
            </div>
            <div>
              <label className="form-label">New Password</label>
              <input
                type="password"
                {...registerChangePassword('newPassword', { required: 'New password is required' })}
                className="input-field"
              />
              {changePasswordErrors.newPassword && (
                <small className="input-error">{changePasswordErrors.newPassword.message}</small>
              )}
            </div>
            <div>
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                {...registerChangePassword('confirmPassword', {
                  required: 'Please confirm the new password',
                  validate: (value) => value === watchChangePassword('newPassword') || 'Passwords must match',
                })}
                className="input-field"
              />
              {changePasswordErrors.confirmPassword && (
                <small className="input-error">{changePasswordErrors.confirmPassword.message}</small>
              )}
            </div>
            <button type="submit" className="btn-primary" disabled={changePasswordLoading}>
              {changePasswordLoading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
