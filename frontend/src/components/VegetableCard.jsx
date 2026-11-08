import React, { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Check, Heart, Star, User, MapPin, Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tVegName } from '../utils/i18nHelpers';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUrl';

const VegetableCard = ({ vegetable }) => {
  const { t } = useTranslation();
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // ── Flexible Product Quantity State (− / + Selector) ──
  const soldBy = vegetable.sold_by || 'weight';

  // Weight-based: steps by 250g, minimum 250g, default 500g
  const [weightGrams, setWeightGrams] = useState(500);
  // Piece-based: steps by 1 piece, minimum 1 piece, default 1 piece
  const [pieceCount, setPieceCount] = useState(1);
  const [dozenCount, setDozenCount] = useState(0.5);

  const availableStock = parseFloat(vegetable.quantity) || 100;
  const maxGrams = availableStock * 1000;
  const maxPieces = availableStock;
  const maxDozens = availableStock;

  const isMinDisabled = soldBy === 'piece' ? pieceCount <= 1 : soldBy === 'dozen' ? dozenCount <= 0.5 : weightGrams <= 250;
  const isMaxDisabled = soldBy === 'piece' ? pieceCount >= maxPieces : soldBy === 'dozen' ? dozenCount + 0.5 > maxDozens : (weightGrams + 250 > maxGrams);

  const handleDecrease = (e) => {
    e.stopPropagation();
    if (soldBy === 'piece') {
      if (pieceCount > 1) {
        setPieceCount(prev => prev - 1);
      }
    } else if (soldBy === 'dozen') {
      if (dozenCount > 0.5) setDozenCount(prev => Number((prev - 0.5).toFixed(2)));
    } else {
      if (weightGrams > 250) {
        setWeightGrams(prev => prev - 250);
      }
    }
  };

  const handleIncrease = (e) => {
    e.stopPropagation();
    if (soldBy === 'piece') {
      if (pieceCount < maxPieces) {
        setPieceCount(prev => prev + 1);
      }
    } else if (soldBy === 'dozen') {
      if (dozenCount + 0.5 <= maxDozens) setDozenCount(prev => Number((prev + 0.5).toFixed(2)));
    } else {
      if (weightGrams + 250 <= maxGrams) {
        setWeightGrams(prev => prev + 250);
      }
    }
  };

  // Formatted display label (e.g. "500g", "750g", "1 kg", "2 pieces")
  const getDisplayLabel = () => {
    if (soldBy === 'piece') {
      return `${pieceCount} ${pieceCount > 1 ? 'pieces' : 'piece'}`;
    }
    if (soldBy === 'dozen') return `${dozenCount} ${dozenCount > 1 ? t('product.dozens') : t('product.dozen')}`;
    if (weightGrams < 1000) {
      return `${weightGrams}g`;
    }
    const kg = weightGrams / 1000;
    return Number.isInteger(kg) ? `${kg} kg` : `${kg.toFixed(2).replace(/\.?0+$/, '')} kg`;
  };

  // Multiplier for price & stock calculation
  const mult = soldBy === 'piece' ? pieceCount : soldBy === 'dozen' ? dozenCount : (weightGrams / 1000);

  const price = parseFloat(vegetable.price) || 25;
  const currentPrice = (price * mult).toFixed(2);
  const originalPrice = Math.round(price * 1.25);
  const currentOriginalPrice = Math.round(originalPrice * mult);
  const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login/customer');
      return;
    }
    if (user.role !== 'customer') {
      alert('Only registered customers can place vegetable orders.');
      return;
    }

    try {
      setAdding(true);
      if (soldBy === 'piece') {
        await addToCart(vegetable.vegetable_id, pieceCount, 'piece', pieceCount);
      } else if (soldBy === 'dozen') {
        await addToCart(vegetable.vegetable_id, dozenCount, 'dozen', dozenCount);
      } else {
        const unit = weightGrams < 1000 ? 'g' : 'kg';
        const val = weightGrams < 1000 ? weightGrams : (weightGrams / 1000);
        await addToCart(vegetable.vegetable_id, mult, unit, val);
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      alert(err);
    } finally {
      setAdding(false);
    }
  };

  const getCardImageUrl = (veg) => {
    if (!veg) return '/assets/images/produce/bhindi_exact.png';
    const name = (veg.vegetable_name || '').toLowerCase();
    if (name.includes('bhindi') || name.includes('lady finger') || name.includes('ladyfinger') || name.includes('okra')) {
      return '/assets/images/produce/bhindi_exact.png';
    }
    const img = veg.image || '';
    return getImageUrl(img);
  };

  const imageUrl = getCardImageUrl(vegetable);

  const averageRating = Number(vegetable.avg_rating) || 0;
  const reviewCount = Number(vegetable.review_count) || 0;
  const hasRealRating = reviewCount > 0 && averageRating > 0;
  const rating = hasRealRating ? averageRating.toFixed(1) : '—';

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(11, 107, 58, 0.12)' }}
      transition={{ duration: 0.25 }}
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '16px',
        position: 'relative',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        background: '#ffffff',
        overflow: 'hidden'
      }}
    >
      {/* Top Left Tag & Wishlist Heart */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', zIndex: 2 }}>
        <span style={{
          background: vegetable.category === 'Organic' || vegetable.category === 'Leafy Greens' ? '#0B6B3A' : '#16A34A',
          color: 'white',
          fontSize: '0.72rem',
          fontWeight: '800',
          padding: '3px 10px',
          borderRadius: '12px'
        }}>
          {vegetable.category === 'Organic' ? `🌱 ${t('categories.organic')}` : `🌿 ${t('hero.fresh100')}`}
        </span>

        <button
          onClick={() => setIsWishlisted(!isWishlisted)}
          style={{
            background: isWishlisted ? '#fef2f2' : '#f8fafc',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isWishlisted ? '#ef4444' : '#94a3b8',
            transition: 'all 0.2s'
          }}
          title="Wishlist"
        >
          <Heart size={16} fill={isWishlisted ? '#ef4444' : 'none'} />
        </button>
      </div>

      {/* HD Vegetable Image with Zoom Hover */}
      <div style={{
        height: '160px',
        borderRadius: '14px',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginBottom: '12px',
        position: 'relative'
      }}>
        <motion.img
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.3 }}
          src={imageUrl}
          alt={vegetable.vegetable_name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&auto=format&fit=crop&q=80';
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>

      {/* Product Details */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Poppins' }}>
              {tVegName(t, vegetable.vegetable_name)}
            </h3>
            <Link
              to={`/product/${vegetable.vegetable_id}/reviews`}
              title={hasRealRating ? `${reviewCount} review${reviewCount !== 1 ? 's' : ''}` : 'No reviews yet'}
              style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.78rem', color: '#F59E0B', fontWeight: '800', textDecoration: 'none' }}
            >
              <Star size={12} fill={hasRealRating ? '#F59E0B' : 'none'} color={hasRealRating ? '#F59E0B' : '#94a3b8'} /> {rating}
              {hasRealRating && (
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600' }}>({reviewCount})</span>
              )}
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#475569', marginBottom: '10px' }}>
            <User size={12} color="#0B6B3A" /> {vegetable.farmer_name || 'Ramesh Patil'}
            <span>•</span>
            <MapPin size={12} color="#F59E0B" /> {vegetable.village || 'Manchar'}
          </div>

          {/* ── Minus (−), Quantity & Plus (+) Selector ── */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {soldBy === 'piece' ? t('product.quantity') : soldBy === 'dozen' ? t('product.quantityDozens') : t('product.quantityWeight')}
              </span>
              <span style={{ fontSize: '0.74rem', color: '#0B6B3A', fontWeight: '800' }}>
                ₹{currentPrice}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: '12px',
              padding: '4px 6px',
              transition: 'border-color 0.2s ease'
            }}>
              {/* Minus Button */}
              <button
                type="button"
                onClick={handleDecrease}
                disabled={isMinDisabled}
                aria-label="Decrease quantity"
                title={isMinDisabled ? 'Minimum quantity reached' : (soldBy === 'piece' ? 'Decrease by 1 piece' : soldBy === 'dozen' ? 'Decrease by 1 dozen' : 'Decrease by 250g')}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isMinDisabled ? '#f1f5f9' : '#ffffff',
                  color: isMinDisabled ? '#cbd5e1' : '#0B6B3A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isMinDisabled ? 'not-allowed' : 'pointer',
                  boxShadow: isMinDisabled ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Minus size={15} strokeWidth={2.5} />
              </button>

              {/* Selected Quantity Display */}
              <div style={{ textAlign: 'center', flex: 1 }}>
                <span style={{
                  fontSize: '0.92rem',
                  fontWeight: '800',
                  color: '#0f172a',
                  letterSpacing: '-0.2px'
                }}>
                  {getDisplayLabel()}
                </span>
              </div>

              {/* Plus Button */}
              <button
                type="button"
                onClick={handleIncrease}
                disabled={isMaxDisabled}
                aria-label="Increase quantity"
                title={isMaxDisabled ? 'Maximum stock reached' : (soldBy === 'piece' ? 'Increase by 1 piece' : soldBy === 'dozen' ? 'Increase by 1 dozen' : 'Increase by 250g')}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isMaxDisabled ? '#f1f5f9' : '#0B6B3A',
                  color: isMaxDisabled ? '#cbd5e1' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isMaxDisabled ? 'not-allowed' : 'pointer',
                  boxShadow: isMaxDisabled ? 'none' : '0 1px 3px rgba(11,107,58,0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        <div>
          {/* Price Row: Current Price + Slashed Original Price + Discount Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0B6B3A' }}>
              ₹{currentPrice}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'line-through' }}>
              ₹{currentOriginalPrice}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#16A34A', background: '#dcfce7', padding: '2px 6px', borderRadius: '6px' }}>
              {discountPercent}% OFF
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', marginLeft: 'auto' }}>
              (₹{price}/{soldBy === 'piece' ? 'pc' : soldBy === 'dozen' ? t('product.dozen') : 'kg'})
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddToCart}
            disabled={vegetable.quantity <= 0 || adding}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', fontSize: '0.88rem', background: '#0B6B3A', borderRadius: '12px' }}
          >
            {added ? (
              <span key="added" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} /> {t('product.addedToCart')}
              </span>
            ) : (
              <span key="add" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ShoppingBag size={16} /> {adding ? '...' : t('product.addToCart')}
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default VegetableCard;
