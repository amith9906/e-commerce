import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { MapPin, Layers, Plus, X, ShieldCheck, Search } from 'lucide-react';
import PaginationControls from '../../components/PaginationControls';

const initialRegionForm = {
  name: '',
  slug: '',
  leadTimeDays: '',
  notes: '',
  taxRate: '',
  taxLabel: '',
  isActive: true
};

const initialLocationInput = { country: '', state: '', city: '', postalCode: '' };

export default function DeliveryRegions() {
  const [regions, setRegions] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, pages: 1 });
  const [regionForm, setRegionForm] = useState(initialRegionForm);
  const [locationInput, setLocationInput] = useState(initialLocationInput);
  const [regionLocations, setRegionLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [restrictionForm, setRestrictionForm] = useState({
    regionId: '',
    productId: '',
    isAllowed: true,
    minOrderValue: '',
    maxWeightKg: '',
    allowReturn: true,
    allowReplacement: true,
    notes: ''
  });
  const [savingRegion, setSavingRegion] = useState(false);
  const [savingRestriction, setSavingRestriction] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [page, setPage] = useState(1);
  const PAGE_LIMIT = 6;
  const [fetchError, setFetchError] = useState('');

  const fetchRegions = async () => {
    setLoadingRegions(true);
    setFetchError('');
    try {
      const params = {
        includeRestrictions: true,
        page,
        limit: PAGE_LIMIT,
        search: filters.search || undefined,
        status: filters.status || undefined
      };
      const res = await api.get('/delivery', { params });
      if (res.success) {
        setRegions(res.data || []);
        setPagination(res.pagination || { currentPage: page, pages: 1 });
        if (!selectedRegionId && res.data?.length) {
          setSelectedRegionId(res.data[0].id);
          setRestrictionForm((prev) => ({ ...prev, regionId: res.data[0].id }));
        } else if (selectedRegionId && !res.data?.find((region) => region.id === selectedRegionId)) {
          const first = res.data?.[0];
          if (first) {
            setSelectedRegionId(first.id);
            setRestrictionForm((prev) => ({ ...prev, regionId: first.id }));
          } else {
            setSelectedRegionId('');
            setRestrictionForm((prev) => ({ ...prev, regionId: '' }));
          }
        }
      }
    } catch (err) {
      const message = err.message || 'Unable to load delivery regions.';
      setFetchError(message);
      toast.error(message);
    } finally {
      setLoadingRegions(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { limit: 100, sort: 'name_asc' } });
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err) {
      toast.error('Unable to load products for restrictions.');
    }
  };

  useEffect(() => {
    fetchRegions();
  }, [filters, page]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const selectedRegion = useMemo(() => regions.find((region) => region.id === selectedRegionId), [regions, selectedRegionId]);
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };
  const clearFilters = () => {
    setFilters({ search: '', status: '' });
    setPage(1);
  };

  const handleAddLocation = () => {
    if (!locationInput.country && !locationInput.state && !locationInput.city && !locationInput.postalCode) return;
    setRegionLocations((prev) => [...prev, locationInput]);
    setLocationInput(initialLocationInput);
  };

  const handleRegionSubmit = async (event) => {
    event.preventDefault();
    if (!regionForm.name) {
      return toast.error('Region name is required.');
    }
    const parsedTaxRate = regionForm.taxRate === '' ? undefined : Number(regionForm.taxRate);
    const payload = {
      ...regionForm,
      leadTimeDays: regionForm.leadTimeDays ? Number(regionForm.leadTimeDays) : null,
      locations: regionLocations,
      taxRate: parsedTaxRate,
      taxLabel: regionForm.taxLabel?.trim() || ''
    };
    try {
      setSavingRegion(true);
      await api.post('/delivery', payload);
      toast.success('Delivery region saved.');
      setRegionForm(initialRegionForm);
      setRegionLocations([]);
      fetchRegions();
    } catch (err) {
      toast.error(err.message || 'Unable to save region.');
    } finally {
      setSavingRegion(false);
    }
  };

  const handleRestrictionSubmit = async (event) => {
    event.preventDefault();
    if (!restrictionForm.regionId || !restrictionForm.productId) {
      return toast.error('Region and product are required.');
    }
    try {
      setSavingRestriction(true);
    await api.post('/delivery/restrictions', {
      ...restrictionForm,
      regionId: restrictionForm.regionId,
      isAllowed: restrictionForm.isAllowed,
      minOrderValue: restrictionForm.minOrderValue ? Number(restrictionForm.minOrderValue) : null,
      maxWeightKg: restrictionForm.maxWeightKg ? Number(restrictionForm.maxWeightKg) : null
    });
      toast.success('Restriction saved.');
      setRestrictionForm((prev) => ({
        ...prev,
        minOrderValue: '',
        maxWeightKg: '',
        allowReturn: true,
        allowReplacement: true,
        notes: ''
      }));
      fetchRegions();
    } catch (err) {
      toast.error(err.message || 'Unable to save restriction.');
    } finally {
      setSavingRestriction(false);
    }
  };

  const removeLocation = (index) => {
    setRegionLocations((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Delivery Regions</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Control which geographies your store delivers to and what SKUs are blocked.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={20} /> Regions</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.25rem 0.75rem', background: 'white' }}>
              <Search size={16} color="#94a3b8" />
              <input
                className="input-field"
                placeholder="Search regions"
                style={{ border: 'none', padding: 0, minWidth: '200px' }}
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
            <button type="button" className="btn-secondary" onClick={clearFilters} style={{ padding: '0.35rem 0.75rem' }}>
              Clear filters
            </button>
          </div>
          {loadingRegions && <p>Loading regions...</p>}
          {!loadingRegions && !regions.length && <p style={{ color: '#6b7280' }}>No regions defined yet.</p>}
          {fetchError && (
            <div style={{ padding: '0.75rem', borderRadius: 8, background: '#fee2e2', color: '#b91c1c', marginBottom: '0.75rem' }}>
              {fetchError}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {regions.map((region) => {
              const taxRateValue = Number(region.taxRate ?? 0);
              const taxLabelDisplay = region.taxLabel || 'Tax';
              return (
                <div
                  key={region.id}
                  style={{
                    border: selectedRegionId === region.id ? '2px solid var(--primary-color)' : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    backgroundColor: selectedRegionId === region.id ? '#eff6ff' : 'white'
                  }}
                  onClick={() => {
                    setSelectedRegionId(region.id);
                    setRestrictionForm((prev) => ({ ...prev, regionId: region.id }));
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{region.name}</span>
                    <span style={{ fontSize: '0.8rem', color: '#475569' }}>{region.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <p style={{ margin: '0.25rem 0', color: '#4b5563', fontSize: '0.85rem' }}>Lead time: {region.leadTimeDays ?? 'Auto' } day(s)</p>
                  <p style={{ margin: '0', color: '#475569', fontSize: '0.8rem' }}>Tax: {taxLabelDisplay} · {taxRateValue.toFixed(2)}%</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
                    {(region.locations || []).map((loc, idx) => (
                      <span key={`${region.id}-${idx}`} style={{ padding: '0.2rem 0.65rem', background: '#f8fafc', borderRadius: '999px', fontSize: '0.75rem' }}>
                        {loc.country}{loc.state ? ` · ${loc.state}` : ''}{loc.city ? ` · ${loc.city}` : ''}{loc.postalCode ? ` · ${loc.postalCode}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <PaginationControls
            currentPage={pagination.currentPage || page}
            totalPages={Math.max(1, pagination.pages || 1)}
            onChange={(targetPage) => setPage(targetPage)}
          />
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Layers size={20} /> Create / Update Region</h2>
          <form onSubmit={handleRegionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              value={regionForm.name}
              onChange={(e) => setRegionForm((prev) => ({ ...prev, name: e.target.value }))}
              className="input-field"
              placeholder="Region name (e.g., North India)"
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                value={regionForm.leadTimeDays}
                onChange={(e) => setRegionForm((prev) => ({ ...prev, leadTimeDays: e.target.value }))}
                className="input-field"
                type="number"
                min="0"
                placeholder="Lead time (days)"
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input
                  type="checkbox"
                  checked={regionForm.isActive}
                  onChange={(e) => setRegionForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Active
              </label>
            </div>
            <textarea
              value={regionForm.notes}
              onChange={(e) => setRegionForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="input-field"
              rows="3"
              placeholder="Notes for the team (optional)"
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Tax Label</label>
                <input
                  value={regionForm.taxLabel}
                  onChange={(e) => setRegionForm((prev) => ({ ...prev, taxLabel: e.target.value }))}
                  className="input-field"
                  placeholder="GST / VAT / Tax"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={regionForm.taxRate}
                  onChange={(e) => setRegionForm((prev) => ({ ...prev, taxRate: e.target.value }))}
                  className="input-field"
                  placeholder="0.00"
                />
                <p style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: '#475569' }}>Applied to every order shipping to this region.</p>
              </div>
            </div>
            <div>
              <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>Add Delivery Location</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <input
                  value={locationInput.country}
                  onChange={(e) => setLocationInput((prev) => ({ ...prev, country: e.target.value }))}
                  className="input-field"
                  placeholder="Country"
                />
                <input
                  value={locationInput.state}
                  onChange={(e) => setLocationInput((prev) => ({ ...prev, state: e.target.value }))}
                  className="input-field"
                  placeholder="State"
                />
                <input
                  value={locationInput.city}
                  onChange={(e) => setLocationInput((prev) => ({ ...prev, city: e.target.value }))}
                  className="input-field"
                  placeholder="City"
                />
                <input
                  value={locationInput.postalCode}
                  onChange={(e) => setLocationInput((prev) => ({ ...prev, postalCode: e.target.value }))}
                  className="input-field"
                  placeholder="Postal Code"
                />
              </div>
              <button type="button" onClick={handleAddLocation} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Plus size={16} /> Add Location
              </button>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                {regionLocations.map((loc, idx) => (
                  <span key={`${loc.country}-${idx}`} style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                    {loc.country || 'Any country'}
                    {(loc.state || loc.city || loc.postalCode) && <span>·</span>}
                    {loc.state && <span>{loc.state}</span>}
                    {loc.city && <span>{loc.city}</span>}
                    {loc.postalCode && <span>{loc.postalCode}</span>}
                    <button type="button" onClick={() => removeLocation(idx)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={savingRegion}>
              {savingRegion ? 'Saving...' : <><Plus size={16} /> Save Region</>}
            </button>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShieldCheck size={20} /> Product Restrictions</h2>
        <form onSubmit={handleRestrictionSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <select
            className="input-field"
            value={restrictionForm.regionId}
            onChange={(event) => setRestrictionForm((prev) => ({ ...prev, regionId: event.target.value }))}
          >
            <option value="">Select region</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>
          <select
            className="input-field"
            value={restrictionForm.productId}
            onChange={(event) => setRestrictionForm((prev) => ({ ...prev, productId: event.target.value }))}
          >
            <option value="">Select product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
            <select
              className="input-field"
              value={restrictionForm.isAllowed ? 'allow' : 'block'}
              onChange={(event) => setRestrictionForm((prev) => ({ ...prev, isAllowed: event.target.value === 'allow' }))}
            >
              <option value="allow">Allow delivery</option>
              <option value="block">Block delivery</option>
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input
                type="number"
                className="input-field"
                placeholder="Min order value"
                value={restrictionForm.minOrderValue}
                onChange={(event) => setRestrictionForm((prev) => ({ ...prev, minOrderValue: event.target.value }))}
                min="0"
              />
              <input
                type="number"
                className="input-field"
                placeholder="Max weight (kg)"
                value={restrictionForm.maxWeightKg}
                onChange={(event) => setRestrictionForm((prev) => ({ ...prev, maxWeightKg: event.target.value }))}
                min="0"
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input
                  type="checkbox"
                  checked={restrictionForm.allowReturn}
                  onChange={(event) => setRestrictionForm((prev) => ({ ...prev, allowReturn: event.target.checked }))}
                />
                Allow returns
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input
                  type="checkbox"
                  checked={restrictionForm.allowReplacement}
                  onChange={(event) => setRestrictionForm((prev) => ({ ...prev, allowReplacement: event.target.checked }))}
                />
                Allow replacements
              </label>
            </div>
            <input
              className="input-field"
              value={restrictionForm.notes}
            onChange={(event) => setRestrictionForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Notes (optional)"
          />
        </form>
        <button className="btn-primary" onClick={handleRestrictionSubmit} disabled={savingRestriction}>
          {savingRestriction ? 'Saving...' : 'Save Restriction'}
        </button>
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Current restrictions</h3>
          {!selectedRegion && <p>Select a region to see restrictions.</p>}
          {selectedRegion && selectedRegion.restrictions?.length === 0 && <p>No restrictions defined for this region.</p>}
          {selectedRegion && selectedRegion.restrictions?.map((restriction) => (
            <div key={restriction.id} style={{ borderBottom: '1px solid #e5e7eb', padding: '0.75rem 0' }}>
              <strong>{restriction.product?.name || 'Product'}:</strong> {restriction.isAllowed ? 'Allowed' : 'Blocked'}
              {restriction.notes && <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#4b5563' }}>{restriction.notes}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
