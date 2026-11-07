import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder }) => {
  const { t } = useTranslation();
  const searchPlaceholder = placeholder || t('product.searchVegetables');

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Search
        size={20}
        color="#64748b"
        style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="form-control"
        style={{
          paddingLeft: '48px',
          paddingRight: value ? '40px' : '16px',
          height: '48px',
          borderRadius: '24px',
          fontSize: '0.95rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b'
          }}
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
