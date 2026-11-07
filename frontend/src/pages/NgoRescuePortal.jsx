import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

const initialForm = {
  organization_name: '', organization_type: 'NGO', service_city: '',
  contact_phone: '', email: '', password: ''
};

const NgoRescuePortal = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [deals, setDeals] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const loadOrganization = async () => {
    const response = await API.get('/rescue/ngo/me');
    setProfile(response.data);
    if (response.data?.status === 'approved') {
      const donationResponse = await API.get('/rescue/donations');
      setDeals(donationResponse.data || []);
    }
  };

  useEffect(() => {
    if (user && ['customer', 'ngo'].includes(user.role)) {
      loadOrganization().catch(error => setMessage(error.response?.data?.message || 'Unable to load organization details.'));
    }
  }, [user]);

  const submit = async event => {
    event.preventDefault();
    setMessage('');
    try {
      const response = await API.post('/rescue/ngo/apply', form);
      setMessage(response.data.message || 'Application submitted successfully.');
      setSubmitted(true);
      setProfile(null);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  const requestDonation = async listing => {
    const quantity = window.prompt(`Request quantity (up to ${listing.quantity_remaining}):`);
    if (!quantity) return;
    try {
      await API.post(`/rescue/donations/${listing.listing_id}/request`, { quantity: Number(quantity) });
      setMessage('Donation request sent to the farmer.');
      await loadOrganization();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Request failed.');
    }
  };

  const showApplication = !submitted && (!profile || profile.status === 'rejected');
  const organizationAccount = user?.role === 'ngo';

  return (
    <div className="container" style={{ maxWidth: 950, width: '100%', padding: '32px 16px' }}>
      <h1>NGO &amp; Community Kitchen Rescue Network</h1>
      <p style={{ color: '#475569' }}>Register your organization to receive nearby surplus produce donation listings after approval.</p>

      {message && <div role="status" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 10, padding: 12, margin: '16px 0' }}>{message}</div>}

      {submitted && (
        <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20 }}>
          <h2>Application received</h2>
          <p>Your application is pending admin approval. Once approved, sign in through the existing Customer Login using the email and password you submitted to open the donation dashboard.</p>
          <Link className="btn btn-primary" style={{ background: '#0B6B3A' }} to="/login/customer">Go to login</Link>
        </section>
      )}

      {showApplication && (
        <form onSubmit={submit} style={{ maxWidth: 600, width: '100%', boxSizing: 'border-box', display: 'grid', gap: 14, background: '#fff', padding: 20, border: '1px solid #e2e8f0', borderRadius: 14 }}>
          <h2 style={{ margin: 0 }}>Organization registration</h2>
          <label>Organization Name<input className="form-control" required maxLength={150} value={form.organization_name} onChange={e => setForm({ ...form, organization_name: e.target.value })} /></label>
          <label>Organization Type<select className="form-control" value={form.organization_type} onChange={e => setForm({ ...form, organization_type: e.target.value })}><option value="NGO">NGO</option><option value="Community Kitchen">Community Kitchen</option></select></label>
          <label>Service City / Locality<input className="form-control" required maxLength={100} value={form.service_city} onChange={e => setForm({ ...form, service_city: e.target.value })} /></label>
          <label>Contact Phone<input className="form-control" required type="tel" maxLength={30} value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></label>
          <label>Login Email<input className="form-control" required type="email" autoComplete="email" maxLength={190} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label>Login Password<input className="form-control" required type="password" autoComplete="new-password" minLength={8} maxLength={72} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /><small style={{ color: '#64748b' }}>8–72 characters. Your account can sign in only after admin approval.</small></label>
          <button type="submit" className="btn btn-primary" style={{ background: '#0B6B3A', width: 'fit-content' }}>Submit for Admin Approval</button>
        </form>
      )}

      {profile && (
        <section style={{ background: '#fff', padding: 20, border: '1px solid #e2e8f0', borderRadius: 14 }}>
          <h2>{profile.organization_name}</h2>
          <p>Registration status: <b>{profile.status}</b></p>
          {profile.status === 'pending' && <p>Admin approval is required before donation listings become available.</p>}
          {profile.status === 'rejected' && <p>You can submit an updated application above.</p>}
          {profile.status === 'approved' && <>
            {organizationAccount && <p>Signed in as an approved organization account.</p>}
            <h3>Donation listings</h3>
            {deals.length === 0 ? <p>No donation listings are available for your organization yet.</p> : deals.map(listing => (
              <article key={listing.listing_id} style={{ padding: 14, borderBottom: '1px solid #e2e8f0' }}>
                <b>{listing.vegetable_name}</b> · {listing.locality}
                <p>Available {listing.quantity_remaining} · requests pending {listing.quantity_pending} · deadline {new Date(listing.donation_closes_at).toLocaleString()}</p>
                <button className="btn btn-primary" style={{ background: '#0B6B3A' }} onClick={() => requestDonation(listing)}>Request donation</button>
              </article>
            ))}
          </>}
        </section>
      )}

      {!user && !submitted && <p style={{ marginTop: 16, color: '#64748b' }}>Already approved? <Link to="/login/customer">Sign in here</Link>.</p>}
    </div>
  );
};

export default NgoRescuePortal;
