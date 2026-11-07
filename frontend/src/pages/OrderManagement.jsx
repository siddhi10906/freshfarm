import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateInvoicePDF } from '../services/pdfService';

const OrderManagement = () => {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedLang = localStorage.getItem('freshfarm_lang');
    if (savedLang && i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Error loading admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await API.put(`/orders/status/${id}`, { status });
      setOrders(orders.map(o => o.order_id === id ? { ...o, status } : o));
      alert(`Order #${id} status updated to ${status}`);
    } catch (err) {
      alert('Failed to update order status.');
    }
  };

  if (loading) return <LoadingSpinner message="..." />;

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <Link to="/admin/dashboard" className="btn btn-outline btn-sm" style={{ marginBottom: '20px' }}>
        <ArrowLeft size={16} /> {t('adminDashboard.title')}
      </Link>

      <div className="card">
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '20px', color: '#1e293b' }}>
          {t('adminDashboard.allOrders')} ({orders.length})
        </h2>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('orderSuccess.orderId')}</th>
                <th>{t('roles.customer')}</th>
                <th>{t('checkout.paymentMethod')}</th>
                <th>{t('orderHistory.total')}</th>
                <th>{t('orderHistory.date')}</th>
                <th>{t('orderHistory.status')}</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => (
                <tr key={ord.order_id}>
                  <td style={{ fontWeight: '700' }}>#{ord.order_id}</td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{ord.customer_name}</div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{ord.customer_phone}</span>
                  </td>
                  <td><span className="badge badge-orange">{ord.payment_method}</span></td>
                  <td style={{ fontWeight: '800', color: '#2e7d32' }}>₹{parseFloat(ord.total_amount).toFixed(2)}</td>
                  <td>{new Date(ord.order_date).toLocaleDateString('en-IN')}</td>
                  <td>
                    <select
                      value={ord.status}
                      onChange={(e) => handleUpdateStatus(ord.order_id, e.target.value)}
                      className="form-control"
                      style={{ fontSize: '0.85rem', padding: '6px 10px', width: 'auto' }}
                    >
                      <option value="Order Placed">{t('delivery.placed')}</option>
                      <option value="Packed">{t('delivery.packed')}</option>
                      <option value="Shipped">{t('delivery.shipped')}</option>
                      <option value="Out for Delivery">{t('delivery.outForDelivery')}</option>
                      <option value="Delivered">{t('delivery.delivered')}</option>
                      <option value="Cancelled">{t('farmerDashboard.cancelled')}</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => generateInvoicePDF(ord)} className="btn btn-secondary btn-sm">
                      <Download size={14} /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
