import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { Sprout } from 'lucide-react';

const FarmerRegister = () => {
  const { t } = useTranslation();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    village: '',
    district: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/register/farmer', formData);
      login(res.data.user, res.data.token);
      navigate('/farmer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card-clean">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ background: '#e8f5e9', width: '56px', height: '56px', borderRadius: '50%', color: '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
            <Sprout size={28} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b', fontFamily: 'Poppins' }}>{t('auth.farmerRegister')}</h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '4px' }}>{t('about.transparentPricingDesc')}</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '12px 16px', borderRadius: '12px', fontSize: '0.88rem', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('checkout.name')}</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="Ramesh Patil"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.email')}</label>
            <input
              type="email"
              required
              className="form-control"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.password')}</label>
            <input
              type="password"
              required
              className="form-control"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('checkout.phone')}</label>
            <input
              type="tel"
              required
              className="form-control"
              placeholder="98220 12345"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('checkout.city')}</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Manchar"
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('product.location')}</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Pune"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
            style={{ marginTop: '10px' }}
          >
            {loading ? '...' : t('auth.register')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: '#64748b' }}>
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login/farmer" style={{ color: '#0B6B3A', fontWeight: '800', textDecoration: 'none' }}>
            {t('auth.farmerLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FarmerRegister;
