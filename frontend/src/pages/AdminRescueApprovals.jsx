import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Check,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';
import API from '../services/api';

const statusStyles = {
  pending: { color: '#9a5b00', background: '#fff5d9', label: 'Pending review' },
  approved: { color: '#087443', background: '#e8f7ef', label: 'Approved' },
  rejected: { color: '#b42318', background: '#fff0ee', label: 'Rejected' }
};

const AdminRescueApprovals = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [notice, setNotice] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadRows = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await API.get('/rescue/admin/ngos');
      setRows(response.data || []);
    } catch (error) {
      setLoadError(error.response?.data?.message || 'Unable to load organization applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const counts = useMemo(() => ({
    all: rows.length,
    pending: rows.filter(row => row.status === 'pending').length,
    approved: rows.filter(row => row.status === 'approved').length,
    rejected: rows.filter(row => row.status === 'rejected').length
  }), [rows]);

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter(row => {
      const matchesStatus = filter === 'all' || row.status === filter;
      const searchable = [row.organization_name, row.organization_type, row.service_city, row.contact_phone, row.email]
        .filter(Boolean).join(' ').toLowerCase();
      return matchesStatus && (!term || searchable.includes(term));
    });
  }, [rows, filter, search]);

  const review = async (id, status) => {
    setSavingId(id);
    setNotice(null);
    try {
      await API.put(`/rescue/admin/ngos/${id}`, { status });
      setNotice({ type: 'success', text: `Organization ${status}.` });
      await loadRows();
    } catch (error) {
      setNotice({
        type: 'error',
        text: error.response?.data?.message || 'Could not update this application.'
      });
    } finally {
      setSavingId(null);
    }
  };

  const tabs = [
    { id: 'all', label: 'All applications', icon: Users },
    { id: 'pending', label: 'Pending', icon: Clock3 },
    { id: 'approved', label: 'Approved', icon: BadgeCheck },
    { id: 'rejected', label: 'Rejected', icon: X }
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#f6fbf8', padding: '28px 16px 56px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => navigate('/admin/dashboard')}
          className="btn btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 10, padding: '10px 15px', fontWeight: 700, marginBottom: 22 }}
        >
          <ArrowLeft size={18} /> Back to Admin Dashboard
        </button>

        <section style={{
          background: 'linear-gradient(120deg, #075f36 0%, #0b6b3a 62%, #15905a 100%)',
          color: '#fff', borderRadius: 20, padding: '28px 30px', marginBottom: 22,
          boxShadow: '0 14px 34px rgba(11,107,58,.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,.15)', display: 'grid', placeItems: 'center' }}>
              <ShieldCheck size={24} />
            </span>
            <span style={{ fontSize: '.8rem', fontWeight: 800, letterSpacing: '.12em', opacity: .85 }}>ADMIN · RESCUE NETWORK</span>
          </div>
          <h1 style={{ color: '#fff', margin: 0, fontSize: 'clamp(1.55rem, 4vw, 2.2rem)' }}>
            Organization approvals
          </h1>
          <p style={{ margin: '8px 0 0', maxWidth: 650, lineHeight: 1.6, color: 'rgba(255,255,255,.88)' }}>
            Review NGO and community kitchen applications before granting access to donation listings.
          </p>
        </section>

        <section aria-label="Application summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total applications', value: counts.all, icon: Users, color: '#176b45' },
            { label: 'Pending review', value: counts.pending, icon: Clock3, color: '#ae6a00' },
            { label: 'Approved', value: counts.approved, icon: BadgeCheck, color: '#087443' },
            { label: 'Rejected', value: counts.rejected, icon: X, color: '#b42318' }
          ].map(item => {
            const Icon = item.icon;
            return (
              <article key={item.label} style={{ background: '#fff', border: '1px solid #e1ebe5', borderRadius: 15, padding: '17px 18px', boxShadow: '0 5px 18px rgba(23,54,38,.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '.82rem', fontWeight: 600 }}>{item.label}</div>
                    <div style={{ color: '#172b22', fontSize: '1.65rem', fontWeight: 800, marginTop: 3 }}>{item.value}</div>
                  </div>
                  <span style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', color: item.color, background: `${item.color}12` }}>
                    <Icon size={20} />
                  </span>
                </div>
              </article>
            );
          })}
        </section>

        {notice && (
          <div role="status" style={{ padding: '12px 15px', marginBottom: 16, borderRadius: 11, color: notice.type === 'success' ? '#087443' : '#b42318', background: notice.type === 'success' ? '#e8f7ef' : '#fff0ee', border: `1px solid ${notice.type === 'success' ? '#b7e5c9' : '#f2c5c0'}`, fontWeight: 650 }}>
            {notice.text}
          </div>
        )}

        <section style={{ background: '#fff', border: '1px solid #e1ebe5', borderRadius: 17, padding: 18, boxShadow: '0 5px 18px rgba(23,54,38,.04)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, color: '#172b22', fontSize: '1.15rem' }}>Applications</h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '.88rem' }}>Approve eligible organizations or reject incomplete applications.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e5de', borderRadius: 10, padding: '9px 12px', minWidth: 'min(100%, 255px)', color: '#64748b' }}>
              <Search size={17} />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search organizations" aria-label="Search organizations" style={{ border: 0, outline: 0, width: '100%', color: '#173626', background: 'transparent' }} />
            </label>
          </div>

          <div role="tablist" aria-label="Filter applications" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid #e7eee9', paddingBottom: 14, marginBottom: 16 }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const selected = filter === tab.id;
              return (
                <button key={tab.id} type="button" role="tab" aria-selected={selected} onClick={() => setFilter(tab.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 11px', borderRadius: 9, border: `1px solid ${selected ? '#0b6b3a' : '#dce7e0'}`, color: selected ? '#fff' : '#53675c', background: selected ? '#0b6b3a' : '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  <Icon size={15} /> {tab.label} <span style={{ opacity: selected ? .86 : .7 }}>({counts[tab.id]})</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div style={{ padding: '42px 16px', textAlign: 'center', color: '#64748b' }}>Loading organization applications…</div>
          ) : loadError ? (
            <div role="alert" style={{ padding: '28px 16px', textAlign: 'center', color: '#b42318', background: '#fff8f7', borderRadius: 12 }}>{loadError}</div>
          ) : visibleRows.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', background: '#f8fbf9', borderRadius: 13 }}>
              <Building2 size={30} color="#8aa697" style={{ marginBottom: 9 }} />
              <h3 style={{ margin: '0 0 5px', color: '#173626' }}>{rows.length ? 'No matching applications' : 'No applications yet'}</h3>
              <p style={{ margin: 0, color: '#64748b' }}>{rows.length ? 'Try a different status or search term.' : 'New NGO and community kitchen applications will appear here.'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 13 }}>
              {visibleRows.map(organization => {
                const badge = statusStyles[organization.status] || statusStyles.pending;
                return (
                  <article key={organization.ngo_id} style={{ border: '1px solid #e1ebe5', borderRadius: 14, padding: '18px 19px', background: '#fff' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <h3 style={{ margin: 0, color: '#173626', fontSize: '1.12rem' }}>{organization.organization_name}</h3>
                        <span style={{ display: 'inline-flex', marginTop: 8, padding: '4px 9px', borderRadius: 999, background: '#eef7f1', color: '#176b45', fontSize: '.78rem', fontWeight: 750 }}>{organization.organization_type}</span>
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: badge.background, color: badge.color, fontSize: '.8rem', fontWeight: 800, textTransform: 'capitalize' }}>
                        {organization.status === 'pending' ? <Clock3 size={15} /> : organization.status === 'approved' ? <BadgeCheck size={15} /> : <X size={15} />}
                        {badge.label}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px 18px', marginTop: 17, color: '#52665b', fontSize: '.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={16} color="#0b6b3a" />{organization.service_city || 'Locality not provided'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={16} color="#0b6b3a" />{organization.contact_phone || 'Phone not provided'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowWrap: 'anywhere' }}><Mail size={16} color="#0b6b3a" />{organization.email || organization.contact_email || 'Email not provided'}</div>
                    </div>

                    {organization.status === 'pending' && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 18, paddingTop: 15, borderTop: '1px solid #edf2ee' }}>
                        <button type="button" disabled={savingId === organization.ngo_id} onClick={() => review(organization.ngo_id, 'approved')} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: 0, borderRadius: 9, padding: '9px 14px', background: '#0b6b3a', color: '#fff', fontWeight: 750, cursor: savingId === organization.ngo_id ? 'wait' : 'pointer', opacity: savingId === organization.ngo_id ? .65 : 1 }}>
                          <Check size={17} /> {savingId === organization.ngo_id ? 'Saving…' : 'Approve organization'}
                        </button>
                        <button type="button" disabled={savingId === organization.ngo_id} onClick={() => review(organization.ngo_id, 'rejected')} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: '1px solid #f0c6c2', borderRadius: 9, padding: '9px 14px', background: '#fff', color: '#b42318', fontWeight: 750, cursor: savingId === organization.ngo_id ? 'wait' : 'pointer', opacity: savingId === organization.ngo_id ? .65 : 1 }}>
                          <X size={17} /> Reject
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default AdminRescueApprovals;
