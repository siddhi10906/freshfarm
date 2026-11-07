import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { Leaf, Send } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const isAdmin = user?.role === 'admin' || location.pathname.startsWith('/admin');
  if (isAdmin) return null;

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      alert(t('contact.success'));
      setNewsletterEmail('');
    }
  };

  return (
    <footer style={{ background: '#0B6B3A', color: '#ecfdf5', paddingTop: '60px', paddingBottom: '24px', marginTop: '60px' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '36px', marginBottom: '40px' }}>
          
          {/* Col 1: Company */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', marginBottom: '16px' }}>
              <div style={{ background: 'white', color: '#0B6B3A', padding: '6px', borderRadius: '10px' }}>
                <Leaf size={22} />
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'white', fontFamily: 'Poppins' }}>{t('appName')}</span>
            </div>
            <p style={{ fontSize: '0.88rem', lineHeight: '1.6', opacity: 0.9 }}>
              {t('footer.aboutDesc')}
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 style={{ color: '#F59E0B', fontSize: '1rem', fontWeight: '800', marginBottom: '16px', fontFamily: 'Poppins' }}>{t('footer.quickLinks')}</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <li><Link to="/" style={{ color: '#ecfdf5' }}>{t('nav.home')}</Link></li>
              <li><Link to="/vegetables" style={{ color: '#ecfdf5' }}>{t('nav.vegetables')}</Link></li>
              <li><Link to="/about" style={{ color: '#ecfdf5' }}>{t('nav.about')}</Link></li>
              <li><Link to="/how-it-works" style={{ color: '#ecfdf5' }}>{t('nav.howItWorks')}</Link></li>
              <li><Link to="/contact" style={{ color: '#ecfdf5' }}>{t('nav.contact')}</Link></li>
              <li><Link to="/faqs" style={{ color: '#ecfdf5' }}>{t('nav.faqs')}</Link></li>
            </ul>
          </div>

          {/* Col 3: Farmer Links */}
          <div>
            <h4 style={{ color: '#F59E0B', fontSize: '1rem', fontWeight: '800', marginBottom: '16px', fontFamily: 'Poppins' }}>{t('footer.farmerLinks')}</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <li><Link to="/register/farmer" style={{ color: '#F59E0B', fontWeight: '700' }}>{t('footer.registerFarmer')}</Link></li>
              <li><Link to="/login/farmer" style={{ color: '#ecfdf5' }}>{t('footer.farmerPortal')}</Link></li>
              <li><Link to="/farmer/add-vegetable" style={{ color: '#ecfdf5' }}>{t('footer.sellVegetables')}</Link></li>
              <li><Link to="/farmer/dashboard" style={{ color: '#ecfdf5' }}>{t('footer.farmerAnalytics')}</Link></li>
            </ul>
          </div>

          {/* Col 4: Customer Links */}
          <div>
            <h4 style={{ color: '#F59E0B', fontSize: '1rem', fontWeight: '800', marginBottom: '16px', fontFamily: 'Poppins' }}>{t('footer.customerLinks')}</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <li><Link to="/login/customer" style={{ color: '#ecfdf5' }}>{t('footer.customerAccount')}</Link></li>
              <li><Link to="/cart" style={{ color: '#ecfdf5' }}>{t('cart.title')}</Link></li>
              <li><Link to="/customer/orders" style={{ color: '#ecfdf5' }}>{t('nav.myOrders')}</Link></li>
              <li><Link to="/privacy" style={{ color: '#ecfdf5' }}>{t('footer.privacy')}</Link></li>
              <li><Link to="/terms" style={{ color: '#ecfdf5' }}>{t('footer.terms')}</Link></li>
            </ul>
          </div>

          {/* Col 5: Newsletter */}
          <div>
            <h4 style={{ color: '#F59E0B', fontSize: '1rem', fontWeight: '800', marginBottom: '16px', fontFamily: 'Poppins' }}>{t('footer.newsletter')}</h4>
            <p style={{ fontSize: '0.82rem', opacity: 0.9, marginBottom: '12px' }}>
              {t('footer.newsletterDesc')}
            </p>
            <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              <input
                type="email"
                required
                placeholder={t('footer.enterEmail')}
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', borderRadius: '20px', border: 'none', outline: 'none' }}
              />
              <button type="submit" style={{ background: '#F59E0B', color: '#0f172a', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom copyright notice */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '0.82rem', opacity: 0.9 }}>
          <div>
            {t('footer.copyright')}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
