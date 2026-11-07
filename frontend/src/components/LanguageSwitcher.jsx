import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    const selectedLang = e.target.value;
    i18n.changeLanguage(selectedLang);
    localStorage.setItem('freshfarm_lang', selectedLang);
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('freshfarm_lang') || i18n.language || 'en';
    if (i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '4px 12px', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <Globe size={16} color="#0B6B3A" />
      <select
        value={i18n.language || 'en'}
        onChange={handleLanguageChange}
        style={{
          border: 'none',
          background: 'transparent',
          fontSize: '0.85rem',
          fontWeight: '700',
          color: '#0f172a',
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        <option value="en">🌐 English</option>
        <option value="hi">🇮🇳 हिंदी (Hindi)</option>
        <option value="mr">🇮🇳 मराठी (Marathi)</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
