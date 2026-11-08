import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20, marginBottom: 18 };
const FarmerRescue = () => {
  const { user } = useContext(AuthContext);
  const [vegetables, setVegetables] = useState([]); const [listings, setListings] = useState([]); const [requests, setRequests] = useState([]); const [stats, setStats] = useState({});
  const [form, setForm] = useState({ vegetable_id: '', quantity: '', discounted_price: '', deadline: '' }); const [approved, setApproved] = useState(false); const [message, setMessage] = useState('');
  const load = async () => {
    const [v,l,r,s] = await Promise.all([API.get(`/vegetables?farmer_id=${user?.id}`), API.get('/rescue/farmer/listings'), API.get('/rescue/farmer/donations'), API.get('/rescue/tracking')]);
    setVegetables(v.data || []); setListings(l.data || []); setRequests(r.data || []); setStats(s.data || {});
  };
  useEffect(() => { load().catch(e => setMessage(e.response?.data?.message || 'Unable to load rescue data.')); }, []);
  const submit = async e => { e.preventDefault(); setMessage(''); try { await API.post('/rescue/listings', { ...form, approved_discount: approved }); setForm({ vegetable_id: '', quantity: '', discounted_price: '', deadline: '' }); setApproved(false); setMessage('Rescue Deal published.'); await load(); } catch (e) { setMessage(e.response?.data?.message || 'Unable to publish listing.'); } };
  const decide = async (id, status) => { try { await API.put(`/rescue/farmer/donations/${id}`, { status }); setMessage(`Request ${status}.`); await load(); } catch (e) { setMessage(e.response?.data?.message || 'Unable to update request.'); } };
  return <div className="container" style={{ maxWidth: 1100, padding: '32px 16px' }}>
    <h1>Fresh Produce Rescue</h1><p>Offer surplus harvest at a discounted price, then donate eligible leftovers.</p>{message && <p role="status">{message}</p>}
    <section style={card}><h2>Rescue tracking</h2><div style={{ display:'flex', flexWrap:'wrap', gap:22 }}>{[['Listed',stats.listed],['Sold at discount',stats.sold],['Donated',stats.donated],['Expired / discarded',stats.discarded],['Produce rescued',stats.rescued]].map(([k,v])=><div key={k}><b>{k}</b><div>{Number(v || 0).toFixed(3)} kg</div></div>)}</div></section>
    <section style={card}><h2>Publish surplus produce</h2><form onSubmit={submit} style={{ display:'grid', gap:12, maxWidth:600 }}>
      <label>Vegetable<select required className="form-control" value={form.vegetable_id} onChange={e=>{const veg=vegetables.find(x=>String(x.vegetable_id)===e.target.value);setForm({...form,vegetable_id:e.target.value,discounted_price:veg?.price || ''});}}><option value="">Select your vegetable</option>{vegetables.map(v=><option key={v.vegetable_id} value={v.vegetable_id}>{v.vegetable_name} · stock {v.quantity} · ₹{v.price}/{v.sold_by==='piece'?'piece':v.sold_by==='dozen'?'dozen':'kg'}</option>)}</select></label>
      <label>Surplus quantity (kg, pieces or dozens)<input required min="0.001" step="0.001" type="number" className="form-control" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></label>
      <label>Rescue price (₹ per kg, piece or dozen)<input required min="0.01" step="0.01" type="number" className="form-control" value={form.discounted_price} onChange={e=>setForm({...form,discounted_price:e.target.value})}/></label>
      <label>Unsold deadline<input required type="datetime-local" className="form-control" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})}/></label>
      <label><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/> I approve this discounted price and publish it as a Rescue Deal.</label>
      <button className="btn btn-primary" style={{background:'#0B6B3A'}} disabled={!approved}>Publish Rescue Deal</button>
    </form></section>
    <section style={card}><h2>Your listings</h2>{listings.length===0?<p>No rescue listings yet.</p>:listings.map(l=><p key={l.listing_id}><b>Rescue Deal · {l.vegetable_name}</b> — ₹{l.discounted_price} (usual ₹{l.original_price}), remaining {l.quantity_remaining}, status {l.status}, deadline {new Date(l.deadline).toLocaleString()}</p>)}</section>
    <section style={card}><h2>Donation requests</h2>{requests.length===0?<p>No requests yet. NGOs are notified when a deal reaches its deadline.</p>:requests.map(r=><div key={r.request_id} style={{padding:'12px 0',borderBottom:'1px solid #e2e8f0'}}><b>{r.organization_name}</b> ({r.organization_type}) requested {r.quantity} kg/pieces of {r.vegetable_name}. <span>{r.status}</span>{r.status==='pending'&&<span style={{display:'flex',gap:8,marginTop:8}}><button className="btn btn-primary" onClick={()=>decide(r.request_id,'approved')}>Approve</button><button className="btn btn-outline" onClick={()=>decide(r.request_id,'rejected')}>Reject</button></span>}</div>)}</section>
  </div>;
};
export default FarmerRescue;
