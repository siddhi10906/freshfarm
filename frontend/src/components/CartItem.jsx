import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Minus, Trash2, User } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { getImageUrl } from '../utils/imageUrl';

const CartItem = ({ item }) => {
  const { t } = useTranslation();
  const { updateQuantity, removeFromCart } = useContext(CartContext);

  const unit = item.quantity_unit || (item.sold_by === 'piece' ? 'piece' : item.sold_by === 'dozen' ? 'dozen' : 'kg');
  const val = parseFloat(item.quantity_value) || parseFloat(item.quantity) || 1;
  const availableStock = parseFloat(item.available_stock) || 100;

  const handleIncrease = () => {
    let nextVal = val;
    let nextUnit = unit;
    if (unit === 'g') {
      nextVal = val + 250;
    } else {
      nextVal = val + 1;
    }

    const kgNeeded = nextUnit === 'g' ? nextVal / 1000 : nextVal;
    if (kgNeeded > availableStock) {
      const stockMsg = unit === 'piece' ? `${availableStock} pieces` : unit === 'dozen' ? `${availableStock} dozen` : `${availableStock} kg`;
      alert(`Cannot exceed available stock of ${stockMsg}.`);
      return;
    }

    updateQuantity(item.cart_id, kgNeeded, nextUnit, nextVal);
  };

  const handleDecrease = () => {
    let nextVal = val;
    let nextUnit = unit;
    if (unit === 'g') {
      nextVal = val - 250;
    } else {
      nextVal = val - 1;
    }

    if (nextVal <= 0) {
      removeFromCart(item.cart_id);
    } else {
      const kgNeeded = nextUnit === 'g' ? nextVal / 1000 : nextVal;
      updateQuantity(item.cart_id, kgNeeded, nextUnit, nextVal);
    }
  };

  const imageUrl = getImageUrl(item.image);

  const lineTotal = item.item_total !== undefined
    ? item.item_total
    : (unit === 'g' ? (item.price * val) / 1000 : item.price * val);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px',
      background: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      marginBottom: '12px',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      {/* Left: Image & Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '220px' }}>
        <img
          src={imageUrl}
          alt={item.vegetable_name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=60';
          }}
          style={{
            width: '70px',
            height: '70px',
            objectFit: 'cover',
            borderRadius: '8px',
            background: '#e8f5e9'
          }}
        />
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>
            {t(`vegNames.${item.vegetable_name}`, { defaultValue: item.vegetable_name })}
          </h4>
          {item.is_rescue_deal && <span style={{ display: 'inline-block', background: '#fff2cf', color: '#8a4b00', fontWeight: 800, fontSize: '0.72rem', padding: '3px 8px', borderRadius: 12 }}>Rescue Deal</span>}
          <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={12} color="#2e7d32" /> {t('product.farmer')}: {item.farmer_name || 'Farmer'}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#2e7d32', marginTop: '2px', display: 'block' }}>
            ₹{parseFloat(item.price).toFixed(2)} / {unit === 'piece' ? 'pc' : unit === 'dozen' ? 'dozen' : 'kg'}
          </span>
          {item.is_rescue_deal && <small style={{ color: '#64748b' }}>Usual price ₹{Number(item.original_price).toFixed(2)}</small>}
        </div>
      </div>

      {/* Middle: Quantity Controller */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={handleDecrease}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Minus size={14} color="#1e293b" />
        </button>

        <span style={{ fontWeight: '700', fontSize: '0.95rem', minWidth: '68px', textAlign: 'center' }}>
          {val} {unit === 'piece' ? (val > 1 ? 'pcs' : 'pc') : unit === 'dozen' ? (val > 1 ? 'dozens' : 'dozen') : unit}
        </span>

        <button
          onClick={handleIncrease}
          disabled={(unit === 'g' ? (val + 250) / 1000 : val + 1) > availableStock}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: (unit === 'g' ? (val + 250) / 1000 : val + 1) > availableStock ? '#f1f5f9' : '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (unit === 'g' ? (val + 250) / 1000 : val + 1) > availableStock ? 'not-allowed' : 'pointer'
          }}
        >
          <Plus size={14} color="#1e293b" />
        </button>
      </div>

      {/* Right: Total & Remove */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', minWidth: '80px', textAlign: 'right' }}>
          ₹{lineTotal.toFixed(2)}
        </span>
        <button
          onClick={() => removeFromCart(item.cart_id)}
          style={{
            background: '#fef2f2',
            color: '#ef4444',
            border: 'none',
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          title={t('cart.remove')}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
