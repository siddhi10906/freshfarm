import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FaqPage = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: t('nav.faqs'),
      a: t('about.subtitle')
    },
    {
      q: t('orderSuccess.trackOrder'),
      a: t('howItWorks.step3Desc')
    },
    {
      q: t('checkout.paymentMethod'),
      a: t('checkout.payNotice')
    },
    {
      q: t('chatbot.title'),
      a: t('chatbot.placeholder')
    }
  ];

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
      <div className="section-header" style={{ textAlign: 'center' }}>
        <h1 className="section-title">{t('nav.faqs')}</h1>
        <p className="section-subtitle">{t('appName')}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {faqs.map((faq, index) => (
          <div key={index} className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <button
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
              style={{
                width: '100%',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: openIndex === index ? '#f8fafc' : 'white',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: '700',
                fontSize: '1rem',
                color: '#1e293b'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HelpCircle size={18} color="#2e7d32" /> {faq.q}
              </span>
              {openIndex === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {openIndex === index && (
              <div style={{ padding: '16px 20px 20px 20px', borderTop: '1px solid #e2e8f0', color: '#475569', fontSize: '0.92rem', lineHeight: '1.6' }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaqPage;
