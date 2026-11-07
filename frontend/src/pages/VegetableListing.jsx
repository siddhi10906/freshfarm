import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import VegetableCard from '../components/VegetableCard';
import SearchBar from '../components/SearchBar';
import FilterSidebar from '../components/FilterSidebar';
import LoadingSpinner from '../components/LoadingSpinner';

const VegetableListing = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const [vegetables, setVegetables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortOption, setSortOption] = useState('default');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await API.get('/vegetables/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const fetchVegetables = async () => {
    try {
      setLoading(true);
      let query = `/vegetables?`;
      if (searchTerm) query += `search=${encodeURIComponent(searchTerm)}&`;
      if (selectedCategory && selectedCategory !== 'All') query += `category=${encodeURIComponent(selectedCategory)}&`;
      if (sortOption !== 'default') query += `sort=${sortOption}&`;
      if (minPrice) query += `minPrice=${minPrice}&`;
      if (maxPrice) query += `maxPrice=${maxPrice}&`;

      const res = await API.get(query);
      setVegetables(res.data);
    } catch (err) {
      console.error('Error fetching vegetables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const cat = searchParams.get('category');
    const search = searchParams.get('search');
    if (cat) {
      setSelectedCategory(cat);
    }
    if (search) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchVegetables();
  }, [searchTerm, selectedCategory, sortOption, minPrice, maxPrice]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSortOption('default');
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <div className="container" style={{ padding: '30px 20px' }}>
      {/* Search Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 className="section-title">{t('hero.title1')} {t('hero.title2')}</h1>
        <p className="section-subtitle" style={{ marginBottom: '20px' }}>
          {t('about.subtitle')}
        </p>
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '30px' }}>
        {/* Left Filter Sidebar */}
        <div>
          <FilterSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            sortOption={sortOption}
            onSelectSort={setSortOption}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onReset={handleResetFilters}
          />
        </div>

        {/* Right Vegetable Cards Grid */}
        <div>
          {loading ? (
            <LoadingSpinner message="..." />
          ) : vegetables.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '8px' }}>{t('product.noProductsFound')}</h3>
              <button onClick={handleResetFilters} className="btn btn-outline" style={{ marginTop: '16px' }}>
                {t('categories.all')}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>
                  {t('categories.items', { count: vegetables.length })}
                </span>
              </div>

              <div className="grid-3">
                {vegetables.map((veg) => (
                  <VegetableCard key={veg.vegetable_id} vegetable={veg} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VegetableListing;
