import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, Truck, Calendar, CreditCard, MapPin, Star, CheckCircle } from 'lucide-react';
import { generateInvoicePDF } from '../services/pdfService';
import { tVegName } from '../utils/i18nHelpers';
import { AuthContext } from '../context/AuthContext';
import ReviewModal from './ReviewModal';
import API from '../services/api';
import { getImageUrl } from '../utils/imageUrl';

const OrderCard = ({ order, isFarmer = false }) => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  // Track which (vegetable_id, order_id) pairs this customer has already reviewed
  const [submittedReviews, setSubmittedReviews] = useState([]); // [{vegetable_id, order_id}]
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // {vegetable_id, order_id, vegetable_name}

  // Fetch submitted reviews for this customer (only if logged-in customer, not farmer)
  useEffect(() => {
    if (user?.role === 'customer' && order.status === 'Delivered') {
      API.get('/reviews/customer/submitted')
        .then(res => setSubmittedReviews(res.data))
        .catch(err => console.error('Error fetching submitted reviews:', err));
    }
  }, [user, order.status]);

  const isAlreadyReviewed = (vegetable_id, order_id) =>
    submittedReviews.some(
      r => r.vegetable_id === vegetable_id && r.order_id === order_id
    );

  const handleOpenReview = (item) => {
    setSelectedItem({
      vegetable_id: item.vegetable_id,
      order_id: order.order_id,
      vegetable_name: tVegName(t, item.vegetable_name),
    });
    setModalOpen(true);
  };

  const handleReviewSuccess = (vegetable_id, order_id) => {
    setSubmittedReviews(prev => [...prev, { vegetable_id, order_id }]);
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case 'Order Placed': return 'badge-blue';
      case 'Packed': return 'badge-orange';
      case 'Shipped': return 'badge-orange';
      case 'Out for Delivery': return 'badge-orange';
      case 'Delivered': return 'badge-green';
      case 'Cancelled': return 'badge-red';
      default: return 'badge-green';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Order Placed': return t('status.placed');
      case 'Packed': return t('status.packed');
      case 'Shipped': return t('status.shipped');
      case 'Out for Delivery': return t('status.outForDelivery');
      case 'Delivered': return t('status.delivered');
      case 'Cancelled': return t('status.cancelled');
      default: return status;
    }
  };

  return (
    <>
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        {/* Top Bar: Order ID, Date & Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>
              {t('orderSuccess.orderId')} #{order.order_id}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> {new Date(order.order_date).toLocaleDateString('en-IN')}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CreditCard size={14} /> {order.payment_method}
              </span>
            </div>
          </div>

          <span className={`badge ${getBadgeClass(order.status)}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            {getStatusText(order.status)}
          </span>
        </div>

        {/* Item Thumbnails & Summary */}
        <div style={{ marginBottom: '16px' }}>
          <h5 style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>{t('orderHistory.items')}</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(order.items || []).map((item, idx) => {
              const reviewed = isAlreadyReviewed(item.vegetable_id, order.order_id);
              const isDelivered = order.status === 'Delivered';
              const unit = item.quantity_unit || (item.sold_by === 'piece' ? 'piece' : 'kg');
              const val = item.quantity_value !== undefined ? item.quantity_value : item.quantity;
              const lineTotal = item.quantity_unit === 'g'
                ? (parseFloat(item.price) * parseFloat(val)) / 1000
                : parseFloat(item.price) * parseFloat(val);

              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.vegetable_name}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=60'; }}
                      style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                    <div>
                      <span style={{ fontWeight: '600', color: '#1e293b' }}>{tVegName(t, item.vegetable_name)}</span>
                      {item.surplus_listing_id && <span style={{ display: 'inline-block', marginLeft: 6, background: '#fff2cf', color: '#8a4b00', fontWeight: 800, fontSize: '0.68rem', padding: '2px 7px', borderRadius: 12 }}>Rescue Deal</span>}
                      <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>
                        {val} {unit === 'piece' ? (val > 1 ? 'pcs' : 'pc') : unit} x ₹{parseFloat(item.price).toFixed(2)} / {unit === 'piece' ? 'pc' : 'kg'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: '700', color: '#1e293b' }}>
                      ₹{lineTotal.toFixed(2)}
                    </span>

                    {/* Write a Review button — only for customers on Delivered orders */}
                    {!isFarmer && user?.role === 'customer' && isDelivered && (
                      reviewed ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          fontSize: '0.78rem', fontWeight: '700',
                          color: '#16A34A', background: '#dcfce7',
                          padding: '5px 10px', borderRadius: '20px',
                        }}>
                          <CheckCircle size={13} /> Reviewed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenReview(item)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '0.78rem', fontWeight: '700',
                            color: '#92400e', background: '#fef9c3',
                            border: '1px solid #fde68a',
                            padding: '5px 10px', borderRadius: '20px',
                            cursor: 'pointer', transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fef08a'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fef9c3'; }}
                          title="Write a review for this product"
                        >
                          <Star size={13} fill="#F59E0B" color="#F59E0B" /> Rate & Review
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Address & Total Row */}
        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.85rem', color: '#475569', maxWidth: '350px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: '#1e293b' }}>
              <MapPin size={14} color="#ff9800" /> {t('checkout.address')}:
            </span>
            {order.delivery_address}
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', textAlign: 'right' }}>{t('orderHistory.total')}</span>
            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#2e7d32' }}>
              ₹{isFarmer && order.farmer_total ? parseFloat(order.farmer_total).toFixed(2) : parseFloat(order.total_amount).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={() => generateInvoicePDF(order)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Download size={14} /> PDF Bill
          </button>

          <Link
            to={`/delivery-tracking/${order.order_id}`}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Truck size={14} /> {t('orderHistory.track')}
          </Link>
        </div>
      </div>

      {/* Review Modal */}
      {selectedItem && (
        <ReviewModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          vegetableId={selectedItem.vegetable_id}
          orderId={selectedItem.order_id}
          productName={selectedItem.vegetable_name}
          onSuccess={handleReviewSuccess}
        />
      )}
    </>
  );
};

export default OrderCard;
