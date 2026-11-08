import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { tVegName } from '../utils/i18nHelpers';
import { CartContext } from '../context/CartContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { ShoppingBag, ArrowRight, Plus, Minus, X } from 'lucide-react';

const ShoppingCart = () => {
  const { t } = useTranslation();
  const { cart, loading, updateQuantity, removeFromCart, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  if (loading) return <LoadingSpinner message="..." />;

  const items = cart.items || [];
  const discountAmount = couponApplied ? 50 : 0;
  const finalGrandTotal = Math.max(0, cart.grandTotal - discountAmount);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === 'FRESH20' || couponCode.toUpperCase() === 'FIRSTFARM') {
      setCouponApplied(true);
      alert('Coupon applied! ₹50 discount deducted.');
    } else {
      alert('Invalid coupon code. Use FRESH20 for ₹50 off.');
    }
  };

  return (
    <div style={{ width: '100%', paddingBottom: '60px' }}>
      {/* Page Header */}
      <div style={{ background: '#f8fafc', padding: '28px 0', borderBottom: '1px solid #e2e8f0', marginBottom: '32px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px', fontFamily: 'Poppins' }}>
            {t('cart.title')}
          </h1>
          <div style={{ fontSize: '0.88rem', color: '#64748b' }}>
            <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>{t('nav.home')}</Link> / <span style={{ color: '#0B6B3A', fontWeight: '700' }}>{t('cart.title')}</span>
          </div>
        </div>
      </div>

      <div className="container">
        {items.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '600px', margin: '0 auto' }}>
            <ShoppingBag size={56} color="#cbd5e1" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.4rem', color: '#0f172a', marginBottom: '8px', fontFamily: 'Poppins' }}>{t('cart.empty')}</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '24px' }}>
              {t('cart.emptySub')}
            </p>
            <Link to="/vegetables" className="btn btn-primary" style={{ padding: '12px 28px' }}>
              {t('cart.continueShopping')}
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '30px' }}>
            
            {/* Left: Product Table */}
            <div>
              <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
                  <thead>
                    <tr style={{ background: '#0B6B3A', color: 'white' }}>
                      <th style={{ padding: '14px 20px', fontWeight: '700', borderTopLeftRadius: '16px' }}>{t('nav.vegetables')}</th>
                      <th style={{ padding: '14px 16px', fontWeight: '700' }}>{t('common.price')}</th>
                      <th style={{ padding: '14px 16px', fontWeight: '700' }}>{t('common.quantity')}</th>
                      <th style={{ padding: '14px 16px', fontWeight: '700' }}>{t('cart.subtotal')}</th>
                      <th style={{ padding: '14px 20px', fontWeight: '700', textAlign: 'center', borderTopRightRadius: '16px' }}>{t('cart.remove')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const unit = item.quantity_unit || (item.sold_by === 'piece' ? 'piece' : item.sold_by === 'dozen' ? 'dozen' : 'kg');
                      const val = item.quantity_value !== undefined ? parseFloat(item.quantity_value) : parseFloat(item.quantity);
                      const lineTotal = item.item_total !== undefined
                        ? item.item_total
                        : (unit === 'g' ? (parseFloat(item.price) * val) / 1000 : parseFloat(item.price) * val);
                      const availableStock = parseFloat(item.available_stock) || 100;

                      const handleRowIncrease = () => {
                        const step = unit === 'g' ? 250 : 1;
                        const nextVal = val + step;
                        const kgNeeded = unit === 'g' ? nextVal / 1000 : nextVal;
                        if (kgNeeded > availableStock) {
                          const stockMsg = unit === 'piece' ? `${availableStock} pieces` : unit === 'dozen' ? `${availableStock} dozen` : `${availableStock} kg`;
                          alert(`Cannot exceed available stock of ${stockMsg}.`);
                          return;
                        }
                        updateQuantity(item.cart_id, kgNeeded, unit, nextVal);
                      };

                      const handleRowDecrease = () => {
                        const step = unit === 'g' ? 250 : 1;
                        const nextVal = val - step;
                        if (nextVal <= 0) {
                          removeFromCart(item.cart_id);
                        } else {
                          const kgNeeded = unit === 'g' ? nextVal / 1000 : nextVal;
                          updateQuantity(item.cart_id, kgNeeded, unit, nextVal);
                        }
                      };

                      return (
                        <tr key={item.cart_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '18px 20px' }}>
                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1rem' }}>
                              {tVegName(t, item.vegetable_name)}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                              👨‍🌾 {t('product.farmer')}: {item.farmer_name}
                            </span>
                          </td>
                          <td style={{ padding: '18px 16px', fontWeight: '700', color: '#0f172a' }}>
                            ₹{parseFloat(item.price).toFixed(2)} / {unit === 'piece' ? 'pc' : unit === 'dozen' ? 'dozen' : 'kg'}
                          </td>
                          <td style={{ padding: '18px 16px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                              <button
                                type="button"
                                onClick={handleRowDecrease}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}
                              >
                                <Minus size={14} />
                              </button>
                              <span style={{ fontWeight: '800', minWidth: '60px', textAlign: 'center', color: '#0f172a', fontSize: '0.9rem' }}>
                                {val} {unit === 'piece' ? (val > 1 ? 'pcs' : 'pc') : unit === 'dozen' ? (val > 1 ? 'dozens' : 'dozen') : unit}
                              </span>
                              <button
                                type="button"
                                onClick={handleRowIncrease}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '18px 16px', fontWeight: '800', color: '#0B6B3A', fontSize: '1rem' }}>
                            ₹{lineTotal.toFixed(2)}
                          </td>
                          <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.cart_id)}
                              style={{ border: 'none', background: '#fef2f2', color: '#ef4444', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              title={t('cart.remove')}
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Coupon Row & Clear Cart Link */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder={t('cart.couponPlaceholder')}
                    className="form-control"
                    style={{ width: '230px' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>
                    {t('cart.applyCoupon')}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={clearCart}
                  style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' }}
                >
                  <u>{t('cart.clearAll')}</u>
                </button>
              </div>
            </div>

            {/* Right: Order Summary Card */}
            <div>
              <div className="card" style={{ padding: '24px', position: 'sticky', top: '120px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px', color: '#0f172a', fontFamily: 'Poppins' }}>
                  {t('checkout.orderSummary')}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.92rem', marginBottom: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>{t('cart.subtotal')}</span>
                    <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{cart.subtotal.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>{t('cart.gst')}</span>
                    <span style={{ fontWeight: '700', color: '#16A34A' }}>₹0.00</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>{t('cart.delivery')}</span>
                    <span style={{ fontWeight: '700', color: cart.deliveryCharge === 0 ? '#0B6B3A' : '#0f172a' }}>
                      {cart.deliveryCharge === 0 ? t('cart.freeDelivery') : `₹${cart.deliveryCharge.toFixed(2)}`}
                    </span>
                  </div>

                  <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem' }}>
                    <span style={{ fontWeight: '800', color: '#0f172a' }}>{t('cart.total')}</span>
                    <span style={{ fontWeight: '800', color: '#0B6B3A' }}>₹{finalGrandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', background: '#0B6B3A', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {t('cart.checkout')} <ArrowRight size={18} />
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;
