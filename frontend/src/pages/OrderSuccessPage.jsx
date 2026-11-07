import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle2, Download, Truck, ShoppingBag } from 'lucide-react';
import { generateInvoicePDF } from '../services/pdfService';

const OrderSuccessPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await API.get(`/orders/${id}`);
        setOrder(res.data);
      } catch (err) {
        console.error('Error fetching order success detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <LoadingSpinner message="..." />;

  if (!order) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Order Not Found</h2>
        <Link to="/vegetables" className="btn btn-primary" style={{ marginTop: '16px' }}>{t('orderSuccess.continueShopping')}</Link>
      </div>
    );
  }

  // Estimated Delivery: Next day
  const estimatedDate = new Date(new Date(order.order_date).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isCod = order.payment_method === 'COD';

  return (
    <div className="container" style={{ padding: '50px 20px', maxWidth: '680px' }}>
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ background: isCod ? '#fffbe6' : '#e6f4ea', width: '76px', height: '76px', borderRadius: '50%', color: isCod ? '#b45309' : '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
          <CheckCircle2 size={46} />
        </div>

        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px', fontFamily: 'Poppins' }}>
          {t('orderSuccess.title')}
        </h1>
        
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px', maxWidth: '520px', margin: '0 auto 24px auto' }}>
          {t('orderSuccess.subtitle')}
        </p>

        {/* Details Box */}
        <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.92rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>{t('orderSuccess.orderId')}:</span>
            <span style={{ fontWeight: '800', color: '#0f172a' }}>#ORD-{order.order_id}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>{t('orderHistory.status')}:</span>
            <span style={{
              fontWeight: '800',
              fontSize: '0.85rem',
              padding: '4px 12px',
              borderRadius: '20px',
              background: isCod ? '#fef3c7' : '#dcfce7',
              color: isCod ? '#b45309' : '#0B6B3A'
            }}>
              {order.payment_status || (isCod ? 'COD - Payment Pending' : 'Payment Successful')}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>{t('delivery.trackTitle')}:</span>
            <span style={{ fontWeight: '700', color: '#0B6B3A' }}>{estimatedDate}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>{t('checkout.paymentMethod')}:</span>
            <span style={{ fontWeight: '700', color: '#0f172a' }}>{order.payment_method}</span>
          </div>

          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>{t('cart.total')}:</span>
            <span style={{ fontWeight: '900', color: '#0B6B3A', fontSize: '1.25rem' }}>₹{parseFloat(order.total_amount).toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => generateInvoicePDF(order)} className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Invoice (PDF)
          </button>

          <Link to={`/delivery-tracking/${order.order_id}`} className="btn btn-outline" style={{ padding: '12px 24px', borderRadius: '12px', borderColor: '#0B6B3A', color: '#0B6B3A', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={18} /> {t('orderSuccess.trackOrder')}
          </Link>
        </div>

        <div style={{ marginTop: '24px' }}>
          <Link to="/vegetables" style={{ color: '#64748b', fontSize: '0.88rem', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ShoppingBag size={14} /> {t('orderSuccess.continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
