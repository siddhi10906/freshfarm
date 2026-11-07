import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { ShoppingBag } from 'lucide-react';

const CustomerRegister = () => {
  const { t } = useTranslation();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    city: 'Pune',
    pincode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/register/customer', formData);
      login(res.data.user, res.data.token);
      navigate('/vegetables');
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
          <div style={{ background: '#fff3e0', width: '56px', height: '56px', borderRadius: '50%', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
            <ShoppingBag size={28} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b', fontFamily: 'Poppins' }}>{t('auth.customerRegister')}</h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '4px' }}>{t('tagline')}</p>
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
              placeholder="Rahul Sharma"
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
              placeholder="rahul.sharma@gmail.com"
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

          <div className="form-group">
            <label className="form-label">{t('checkout.address')}</label>
            <textarea
              rows="2"
              required
              className="form-control"
              placeholder="Street Address, Area, Pincode"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('checkout.city')}</label>
              <input
                type="text"
                required
                className="form-control"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">PIN Code</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="411038"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
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
          <Link to="/login/customer" style={{ color: '#0B6B3A', fontWeight: '800', textDecoration: 'none' }}>
            {t('auth.login')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegister;
