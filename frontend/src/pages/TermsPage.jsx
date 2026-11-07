import React from 'react';
import { useTranslation } from 'react-i18next';

const TermsPage = () => {
  const { t } = useTranslation();

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
      <div className="card" style={{ padding: '36px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>
          {t('footer.terms')}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
          {t('appName')} 2026
        </p>

        <h3 style={{ color: '#2e7d32', marginBottom: '10px' }}>1. {t('howItWorks.title')}</h3>
        <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '20px' }}>
          {t('about.subtitle')}
        </p>

        <h3 style={{ color: '#2e7d32', marginBottom: '10px' }}>2. {t('about.directFarmers')}</h3>
        <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '20px' }}>
          {t('about.transparentPricingDesc')}
        </p>
      </div>
    </div>
  );
};

export default TermsPage;
