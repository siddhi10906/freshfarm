import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { Sprout } from 'lucide-react';

const FarmerLogin = () => {
  const { t, i18n } = useTranslation();
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
      const res = await API.post('/auth/login/farmer', formData);
      const savedLang = localStorage.getItem('freshfarm_lang') || i18n.language || 'en';
      i18n.changeLanguage(savedLang);
      login(res.data.user, res.data.token);
      navigate('/farmer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <img
            src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=700&auto=format&fit=crop&q=80"
            alt="Organic Farm Field"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(20, 83, 45, 0.9), transparent)',
            padding: '30px',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justify: 'flex-end'
          }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '8px' }}>{t('auth.farmerLogin')}</h3>
            <p style={{ fontSize: '0.88rem', opacity: 0.9 }}>{t('about.transparentPricingDesc')}</p>
          </div>
        </div>

        {/* Right Side */}
        <div style={{ padding: '50px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <div style={{ background: '#dcfce7', color: '#15803d', padding: '6px', borderRadius: '10px' }}>
              <Sprout size={22} />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>{t('nav.farmerPortal')}</span>
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            {t('auth.farmerLogin')}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '24px' }}>
            {t('farmerDashboard.title')}
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
            {t('auth.dontHaveAccount')} <Link to="/register/farmer" style={{ fontWeight: '800', color: '#15803d' }}>{t('auth.register')}</Link>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        role="farmer"
        initialEmail={formData.email}
      />
    </div>
  );
};

export default FarmerLogin;
