import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message }) => {
  const { t } = useTranslation();
  const displayMsg = message && message !== '...' ? message : t('appName');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      color: '#2e7d32'
    }}>
      <Loader2 size={40} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ marginTop: '12px', fontSize: '0.95rem', fontWeight: '600', color: '#64748b' }}>
        {displayMsg}
      </span>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
