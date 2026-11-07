import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { ShieldCheck } from 'lucide-react';

const AdminLogin = () => {
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
      const res = await API.post('/auth/login/admin', formData);
      const savedLang = localStorage.getItem('freshfarm_lang') || i18n.language || 'en';
      i18n.changeLanguage(savedLang);
      login(res.data.user, res.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card-clean" style={{ borderTop: '4px solid #0B6B3A', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ background: '#e6f4ea', width: '56px', height: '56px', borderRadius: '50%', color: '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b', fontFamily: 'Poppins' }}>{t('auth.adminLogin')}</h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '4px' }}>{t('adminDashboard.title')}</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '12px 16px', borderRadius: '12px', fontSize: '0.88rem', marginBottom: '20px' }}>
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
              placeholder="admin@freshfarm.com"
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
              style={{ background: 'none', border: 'none', color: '#0B6B3A', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
            >
              {t('forgotPassword.link', 'Forgot Password?')}
            </button>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block" style={{ background: '#0B6B3A', marginTop: '4px' }}>
            {loading ? '...' : t('auth.login')}
          </button>
        </form>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        role="admin"
        initialEmail={formData.email}
      />
    </div>
  );
};

export default AdminLogin;
