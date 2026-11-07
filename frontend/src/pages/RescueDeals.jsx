import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { CartContext } from '../context/CartContext';

const RescueDeals = () => {
  const [deals,setDeals]=useState([]); const [message,setMessage]=useState(''); const {fetchCart}=useContext(CartContext);
  useEffect(()=>{API.get('/rescue/deals').then(r=>setDeals(r.data||[])).catch(e=>setMessage(e.response?.data?.message||'Sign in as a customer to see nearby deals.'));},[]);
  const add = async d => { try { await API.post(`/cart/rescue/${d.listing_id}`,{quantity:1,quantity_unit:d.sold_by==='piece'?'piece':'kg',quantity_value:1}); await fetchCart(); setMessage(`${d.vegetable_name} added to your cart.`); } catch(e) {setMessage(e.response?.data?.message||'Could not add this deal.');} };
  return <div className="container" style={{maxWidth:1100,padding:'32px 16px'}}><h1>Fresh Produce Rescue Deals</h1><p>Discounted surplus produce from farmers near your delivery locality.</p>{message&&<p role="status">{message}</p>}
    {!deals.length&&!message&&<p>No active Rescue Deals are available near you right now.</p>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:18}}>{deals.map(d=><article key={d.listing_id} style={{border:'1px solid #dbe5e9',borderRadius:14,padding:18,background:'#fff'}}>
      <span style={{display:'inline-block',background:'#fff2cf',color:'#8a4b00',fontWeight:800,padding:'5px 10px',borderRadius:20}}>Rescue Deal</span>
      {d.image&&<img src={d.image.startsWith('http')||d.image.startsWith('/')?d.image:`/uploads/${d.image}`} alt="" style={{width:'100%',height:150,objectFit:'cover',borderRadius:10,marginTop:12}}/>}
      <h3>{d.vegetable_name}</h3><p>{d.farmer_name} · {d.locality}</p><p><s>₹{d.original_price}/{d.sold_by==='piece'?'piece':'kg'}</s> <b style={{color:'#087443'}}>₹{d.discounted_price}/{d.sold_by==='piece'?'piece':'kg'}</b></p>
      <p>Available: {Number(d.quantity_remaining)} {d.sold_by==='piece'?'pieces':'kg'}</p><p>Unsold deadline: {new Date(d.deadline).toLocaleString()}</p>
      <button className="btn btn-primary" style={{background:'#0B6B3A'}} onClick={()=>add(d)}>Add 1 {d.sold_by==='piece'?'piece':'kg'} to cart</button>
    </article>)}</div><p style={{marginTop:20}}>Continue to your existing <Link to="/cart">shopping cart and checkout</Link>.</p>
  </div>;
};
export default RescueDeals;
