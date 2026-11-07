import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

const ContactPage = () => {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="section-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 className="section-title">{t('contact.title')}</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>{t('contact.subtitle')}</p>
      </div>

      <div className="grid-2" style={{ gap: '30px' }}>
        {/* Left Column: Form */}
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px', color: '#1e293b' }}>
            {t('contact.title')}
          </h3>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#2e7d32' }}>
              <CheckCircle2 size={48} style={{ marginBottom: '12px' }} />
              <h3>{t('contact.success')}</h3>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('contact.name')}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-control"
                  placeholder="Rahul Patil"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('contact.email')}</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-control"
                  placeholder="rahul@gmail.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('contact.message')}</label>
                <textarea
                  required
                  rows="4"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="form-control"
                  placeholder={t('contact.message')}
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Send size={16} /> {t('contact.send')}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Contact Details */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px', color: '#1e293b' }}>
              {t('contact.title')}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ background: '#e8f5e9', padding: '10px', borderRadius: '10px', color: '#2e7d32' }}>
                  <MapPin size={22} />
                </div>
                <div>
                  <h5 style={{ fontWeight: '700', color: '#1e293b' }}>{t('appName')} Office</h5>
                  <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
                    Baner Road, Pune, Maharashtra 411045, India
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ background: '#fff3e0', padding: '10px', borderRadius: '10px', color: '#e65100' }}>
                  <Phone size={22} />
                </div>
                <div>
                  <h5 style={{ fontWeight: '700', color: '#1e293b' }}>Helpline Number</h5>
                  <p style={{ fontSize: '0.88rem', color: '#64748b' }}>+91 98220 12345 / +91 98220 54321</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ background: '#e0f2fe', padding: '10px', borderRadius: '10px', color: '#0284c7' }}>
                  <Mail size={22} />
                </div>
                <div>
                  <h5 style={{ fontWeight: '700', color: '#1e293b' }}>Email Support</h5>
                  <p style={{ fontSize: '0.88rem', color: '#64748b' }}>support@freshfarm.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
