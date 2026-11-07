import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { Sprout } from 'lucide-react';

const CustomerLogin = () => {
  const { t } = useTranslation();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/login/customer', formData);
      login(res.data.user, res.data.token);
      navigate('/vegetables');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '40px 20px' }}>
      <div style={{
        width: '100%',
        maxWidth: '920px',
        background: '#ffffff',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        border: '1px solid #e2e8f0'
      }}>
        {/* Left Side */}
        <div style={{
          background: 'linear-gradient(135deg, #14532d 0%, #15803d 100%)',
          color: 'white',
          padding: '50px 40px',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          position: 'relative'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '30px' }}>
              <div style={{ background: 'white', color: '#15803d', padding: '8px', borderRadius: '12px' }}>
                <Sprout size={24} />
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: '800' }}>{t('appName')}</span>
            </div>

            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: '1.2', marginBottom: '16px' }}>
              {t('auth.customerLogin')}
            </h2>

            <p style={{ fontSize: '1rem', opacity: 0.9, lineHeight: '1.6' }}>
              {t('tagline')}
            </p>
          </div>

          <div style={{ borderRadius: '16px', overflow: 'hidden', height: '160px', marginTop: '30px' }}>
            <img
              src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80"
              alt="Fresh Produce"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Right Side */}
        <div style={{ padding: '50px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            {t('auth.customerLogin')}
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '24px' }}>
            {t('about.subtitle')}
          </p>

          {error && (
            <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
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

            <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                style={{ background: 'none', border: 'none', color: '#15803d', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
              >
                {t('forgotPassword.link', 'Forgot Password?')}
              </button>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px', background: '#15803d', marginTop: '4px' }}>
              {loading ? '...' : t('auth.login')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: '#64748b' }}>
            {t('auth.dontHaveAccount')} <Link to="/register/customer" style={{ fontWeight: '800', color: '#15803d' }}>{t('auth.register')}</Link>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.82rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              {t('roles.farmer')}? <Link to="/login/farmer" style={{ fontWeight: '700', color: '#0B6B3A' }}>{t('auth.farmerLogin')}</Link>
            </div>
            <div>
              {t('roles.admin')}? <Link to="/login/admin" style={{ fontWeight: '700', color: '#0B6B3A' }}>{t('auth.adminLogin')}</Link>
            </div>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        role="customer"
        initialEmail={formData.email}
      />
    </div>
  );
};

export default CustomerLogin;
