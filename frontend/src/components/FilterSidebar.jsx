import React from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, RotateCcw } from 'lucide-react';
import { tCategory } from '../utils/i18nHelpers';

const FilterSidebar = ({
  categories = [],
  selectedCategory,
  onSelectCategory,
  sortOption,
  onSelectSort,
  onReset
}) => {
  const { t } = useTranslation();

  // Helper to map Category English string to translation key
  const formatCategoryName = (cat) => {
    if (cat === 'All') return t('categories.all');
    return tCategory(t, cat);
  };

  const uniqueCategories = [];
  const seenDisplayNames = new Set();
  categories.forEach((cat) => {
    const displayName = formatCategoryName(cat);
    if (!seenDisplayNames.has(displayName)) {
      seenDisplayNames.add(displayName);
      uniqueCategories.push({ raw: cat, display: displayName });
    }
  });

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
          <Filter size={18} color="#2e7d32" /> {t('filter.title')}
        </h3>
        <button
          onClick={onReset}
          className="btn btn-outline btn-sm"
          style={{ fontSize: '0.75rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <RotateCcw size={12} /> {t('filter.reset')}
        </button>
      </div>

      {/* Sort Option */}
      <div style={{ marginBottom: '24px' }}>
        <label className="form-label">{t('filter.sortLabel')}</label>
        <select
          value={sortOption}
          onChange={(e) => onSelectSort(e.target.value)}
          className="form-control"
        >
          <option value="default">{t('filter.default')}</option>
          <option value="price_asc">{t('filter.priceLowHigh')}</option>
          <option value="price_desc">{t('filter.priceHighLow')}</option>
          <option value="freshest">{t('filter.freshest')}</option>
        </select>
      </div>

      {/* Category Filter */}
      <div style={{ marginBottom: '24px' }}>
        <label className="form-label">{t('filter.categoryLabel')}</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => onSelectCategory('All')}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: selectedCategory === 'All' ? '2px solid #2e7d32' : '1px solid #e2e8f0',
              background: selectedCategory === 'All' ? '#e8f5e9' : 'white',
              color: selectedCategory === 'All' ? '#2e7d32' : '#475569',
              fontWeight: '600',
              fontSize: '0.88rem',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            {t('categories.all')}
          </button>
          {uniqueCategories.map((item) => (
            <button
              key={item.raw}
              onClick={() => onSelectCategory(item.raw)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: selectedCategory === item.raw ? '2px solid #2e7d32' : '1px solid #e2e8f0',
                background: selectedCategory === item.raw ? '#e8f5e9' : 'white',
                color: selectedCategory === item.raw ? '#2e7d32' : '#475569',
                fontWeight: '600',
                fontSize: '0.88rem',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              {item.display}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
