import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, MapPin, ShoppingBag, Sparkles } from 'lucide-react';
import API from '../services/api';
import { CartContext } from '../context/CartContext';
import { getImageUrl } from '../utils/imageUrl';

const RescueDeals = () => {
  const [deals, setDeals] = useState([]);
  const [message, setMessage] = useState('');
  const { fetchCart } = useContext(CartContext);

  useEffect(() => {
    API.get('/rescue/deals')
      .then(response => setDeals(response.data || []))
      .catch(error => setMessage(error.response?.data?.message || 'Sign in as a customer to see nearby deals.'));
  }, []);

  const add = async deal => {
    try {
      await API.post(`/cart/rescue/${deal.listing_id}`, {
        quantity: deal.sold_by === 'dozen' ? 0.5 : 1,
        quantity_unit: deal.sold_by === 'piece' || deal.sold_by === 'dozen' ? deal.sold_by : 'kg',
        quantity_value: deal.sold_by === 'dozen' ? 0.5 : 1
      });
      await fetchCart();
      setMessage(`${deal.vegetable_name} added to your cart.`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not add this deal.');
    }
  };

  return (
    <main style={{ minHeight: '55vh', background: '#f7fbf8', padding: '28px 18px 52px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#8a4b00', background: '#fff2cf', padding: '6px 11px', borderRadius: 999, fontWeight: 800, fontSize: '.82rem' }}>
            <Sparkles size={15} /> Save produce from going to waste
          </span>
          <h1 style={{ margin: '12px 0 5px', color: '#173626', fontSize: 'clamp(1.65rem, 4vw, 2.2rem)' }}>Fresh Produce Rescue Deals</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Discounted surplus produce from farmers near your delivery locality.</p>
        </div>

        {message && <p role="status" style={{ background: '#eef7f1', color: '#176b45', borderRadius: 10, padding: '11px 14px', margin: '0 0 18px' }}>{message}</p>}
        {!deals.length && !message && <p style={{ color: '#64748b', background: '#fff', border: '1px solid #e1ebe5', borderRadius: 14, padding: 20 }}>No active Rescue Deals are available near you right now.</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 360px))', justifyContent: 'start', gap: 20 }}>
          {deals.map(deal => {
            const unit = deal.sold_by === 'piece' || deal.sold_by === 'dozen' ? deal.sold_by : 'kg';
            return (
              <article key={deal.listing_id} style={{ overflow: 'hidden', border: '1px solid #dce9e1', borderRadius: 18, background: '#fff', boxShadow: '0 8px 22px rgba(23,54,38,.06)' }}>
                <div style={{ position: 'relative', height: 220, background: '#f3f7f3', padding: 12 }}>
                  <img
                    src={getImageUrl(deal.image)}
                    alt={deal.vegetable_name}
                    onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/assets/images/produce/bhindi_exact.png'; }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12 }}
                  />
                  <span style={{ position: 'absolute', left: 22, top: 22, background: '#fff2cf', color: '#8a4b00', fontWeight: 850, padding: '6px 11px', borderRadius: 999, boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>Rescue Deal</span>
                </div>
                <div style={{ padding: '16px 18px 18px' }}>
                  <h2 style={{ margin: 0, color: '#173626', fontSize: '1.2rem' }}>{deal.vegetable_name}</h2>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0 12px', color: '#64748b' }}><MapPin size={15} />{deal.farmer_name} · {deal.locality}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                    <s style={{ color: '#84928a' }}>₹{deal.original_price}/{unit}</s>
                    <strong style={{ color: '#087443', fontSize: '1.15rem' }}>₹{deal.discounted_price}/{unit}</strong>
                  </div>
                  <p style={{ margin: '5px 0', color: '#475569' }}>Available: <b>{Number(deal.quantity_remaining)} {unit === 'piece' ? 'pieces' : unit === 'dozen' ? 'dozens' : 'kg'}</b></p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '5px 0 15px', color: '#64748b', fontSize: '.88rem' }}><Clock3 size={15} />{new Date(deal.deadline).toLocaleString()}</p>
                  <button type="button" className="btn btn-primary" style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 8, width: '100%', background: '#0B6B3A', borderRadius: 10 }} onClick={() => add(deal)}>
                    <ShoppingBag size={17} /> Add 1 {unit} to cart
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <p style={{ marginTop: 22, color: '#52665b' }}>Continue to your existing <Link to="/cart" style={{ color: '#0b6b3a', fontWeight: 700 }}>shopping cart and checkout</Link>.</p>
      </div>
    </main>
  );
};

export default RescueDeals;
