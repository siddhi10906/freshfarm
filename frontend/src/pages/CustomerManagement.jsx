import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const CustomerManagement = () => {
  const { t, i18n } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedLang = localStorage.getItem('freshfarm_lang');
    if (savedLang && i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this customer account?')) {
      try {
        await API.delete(`/admin/customers/${id}`);
        setCustomers(customers.filter(c => c.customer_id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete customer.');
      }
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
          {t('adminDashboard.manageCustomers', { count: customers.length })}
        </h2>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('checkout.name')}</th>
                <th>{t('checkout.email')}</th>
                <th>{t('checkout.phone')}</th>
                <th>{t('checkout.address')}</th>
                <th>{t('orderHistory.date')}</th>
                <th>{t('orderHistory.status')}</th>
                <th>{t('cart.remove')}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.customer_id}>
                  <td style={{ fontWeight: '700', color: '#1e293b' }}>{c.full_name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{c.address ? `${c.address}, ` : ''}{c.city} ({c.pincode})</td>
                  <td>{c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : 'Recent'}</td>
                  <td><span className="badge badge-green">{t('adminDashboard.active')}</span></td>
                  <td>
                    <button onClick={() => handleDelete(c.customer_id)} className="btn btn-danger btn-sm">
                      <Trash2 size={14} /> {t('cart.remove')}
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

export default CustomerManagement;
