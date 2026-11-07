import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const FarmerManagement = () => {
  const { t } = useTranslation();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/farmers');
      setFarmers(res.data);
    } catch (err) {
      console.error('Error loading farmers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('freshfarm_lang') || i18n.language || 'en';
    if (i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
    fetchFarmers();
  }, [i18n]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this farmer account?')) {
      try {
        await API.delete(`/admin/farmers/${id}`);
        setFarmers(farmers.filter(f => f.farmer_id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete farmer.');
      }
    }
  };

  if (loading) return <LoadingSpinner message={t('common.loading')} />;

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <Link to="/admin/dashboard" className="btn btn-outline btn-sm" style={{ marginBottom: '20px' }}>
        <ArrowLeft size={16} /> {t('adminDashboard.title')}
      </Link>

      <div className="card">
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '20px', color: '#1e293b' }}>
          {t('adminDashboard.manageFarmers', { count: farmers.length })}
        </h2>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('checkout.name')}</th>
                <th>{t('checkout.email')}</th>
                <th>{t('checkout.phone')}</th>
                <th>{t('farmerDashboard.village')} / {t('farmerDashboard.district')}</th>
                <th>{t('orderHistory.date')}</th>
                <th>{t('orderHistory.status')}</th>
                <th>{t('cart.remove')}</th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((farmer) => (
                <tr key={farmer.farmer_id}>
                  <td style={{ fontWeight: '700', color: '#1e293b' }}>{farmer.full_name}</td>
                  <td>{farmer.email}</td>
                  <td>{farmer.phone}</td>
                  <td>{farmer.village}{farmer.district ? `, ${farmer.district}` : ''}</td>
                  <td>{farmer.created_at ? new Date(farmer.created_at).toLocaleDateString('en-IN') : 'Recent'}</td>
                  <td><span className="badge badge-green">{t('adminDashboard.active')}</span></td>
                  <td>
                    <button onClick={() => handleDelete(farmer.farmer_id)} className="btn btn-danger btn-sm">
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

export default FarmerManagement;
