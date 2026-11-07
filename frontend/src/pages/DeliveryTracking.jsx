import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle2, Circle, Download, ArrowLeft } from 'lucide-react';
import { generateInvoicePDF } from '../services/pdfService';

const DeliveryTracking = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderTracking = async () => {
      try {
        const res = await API.get(`/orders/${id}`);
        setOrder(res.data);
      } catch (err) {
        console.error('Error loading tracking details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderTracking();
  }, [id]);

  if (loading) return <LoadingSpinner message="..." />;

  if (!order) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Order Tracking Details Not Found</h2>
        <Link to="/customer/orders" className="btn btn-primary" style={{ marginTop: '16px' }}>{t('orderHistory.title')}</Link>
      </div>
    );
  }

  const trackingSteps = [
    { key: 'Order Placed', title: t('delivery.placed'), desc: t('delivery.placed'), time: new Date(order.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    { key: 'Packed', title: t('delivery.packed'), desc: t('delivery.packed'), time: 'Same Day' },
    { key: 'Shipped', title: t('delivery.shipped'), desc: t('delivery.shipped'), time: 'Transit' },
    { key: 'Out for Delivery', title: t('delivery.outForDelivery'), desc: t('delivery.outForDelivery'), time: 'Active' },
    { key: 'Delivered', title: t('delivery.delivered'), desc: t('delivery.delivered'), time: 'Final Step' }
  ];

  const validStatuses = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const activeStepIdx = Math.max(0, validStatuses.indexOf(order.status));

  const estDate = new Date(new Date(order.order_date).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div style={{ width: '100%', padding: '40px 0 60px 0', background: '#e0f2fe' }}>
      <div className="container" style={{ maxWidth: '600px' }}>
        <Link to="/customer/orders" className="btn btn-outline btn-sm" style={{ marginBottom: '20px', background: 'white', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> {t('nav.myOrders')}
        </Link>

        <div className="card" style={{ padding: '36px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
              {t('orderSuccess.orderId')} #ORD-{order.order_id}
            </h1>
            <div style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '16px' }}>
              {new Date(order.order_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 16px', borderRadius: '14px', fontSize: '0.88rem', fontWeight: '700' }}>
                {t('orderHistory.status')}: {order.status}
              </div>
              <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '10px 16px', borderRadius: '14px', fontSize: '0.88rem', fontWeight: '700' }}>
                {t('delivery.trackTitle')}: {estDate}
              </div>
            </div>
          </div>

          <div style={{ margin: '30px 0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>
              {t('delivery.trackTitle')}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
              {trackingSteps.map((step, idx) => {
                const isPassed = idx <= activeStepIdx;

                return (
                  <div key={step.key} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                    {idx < trackingSteps.length - 1 && (
                      <div style={{
                        position: 'absolute',
                        left: '12px',
                        top: '24px',
                        bottom: '-24px',
                        width: '3px',
                        background: idx < activeStepIdx ? '#22c55e' : '#cbd5e1'
                      }} />
                    )}

                    <div style={{ zIndex: 2, marginTop: '2px' }}>
                      {isPassed ? (
                        <CheckCircle2 size={26} color="#22c55e" fill="#dcfce7" />
                      ) : (
                        <Circle size={26} color="#cbd5e1" />
                      )}
                    </div>

                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.98rem', color: isPassed ? '#0f172a' : '#94a3b8' }}>
                          {step.title}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                          {step.desc}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>
                        {step.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'center' }}>
            <button onClick={() => generateInvoicePDF(order)} className="btn btn-primary" style={{ width: '100%', padding: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Download size={18} /> Tax Invoice (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTracking;
