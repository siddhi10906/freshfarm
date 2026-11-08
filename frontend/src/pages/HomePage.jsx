import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShoppingBag, Truck, ShieldCheck, Leaf, Grid } from 'lucide-react';
import VegetableCard from '../components/VegetableCard';

const HomePage = () => {
  const { t } = useTranslation();

  // 8 Exact Products with local high-res produce photos
  const exactProducts = [
    {
      vegetable_id: 1,
      vegetable_name: 'Farm Fresh Tomatoes',
      category: 'Fresh',
      weight: '1 kg',
      price: '25.00',
      originalPrice: '30',
      discount: '17% OFF',
      quantity: 150,
      image: '/assets/images/produce/tomatoes.jpg',
      farmer_name: 'Ramesh Farm',
      village: 'Manchar'
    },
    {
      vegetable_id: 2,
      vegetable_name: 'Premium Potatoes',
      category: 'Organic',
      weight: '1 kg',
      price: '20.00',
      originalPrice: '25',
      discount: '20% OFF',
      quantity: 200,
      image: '/assets/images/produce/potatoes.jpg',
      farmer_name: 'Shinde Farm',
      village: 'Junnar'
    },
    {
      vegetable_id: 3,
      vegetable_name: 'Rich Red Onions',
      category: 'Fresh',
      weight: '1 kg',
      price: '22.00',
      originalPrice: '28',
      discount: '21% OFF',
      quantity: 250,
      image: '/assets/images/produce/onions.jpg',
      farmer_name: 'Shinde Farm',
      village: 'Baramati'
    },
    {
      vegetable_id: 4,
      vegetable_name: 'Organic Cauliflower',
      category: 'Organic',
      weight: '1 piece',
      price: '35.00',
      originalPrice: '45',
      discount: '22% OFF',
      quantity: 60,
      image: '/assets/images/produce/cauliflower.jpg',
      farmer_name: 'Patil Farm',
      village: 'Manchar'
    },
    {
      vegetable_id: 5,
      vegetable_name: 'Farm Fresh Carrots',
      category: 'Fresh',
      weight: '500 g',
      price: '18.00',
      originalPrice: '22',
      discount: '18% OFF',
      quantity: 100,
      image: '/assets/images/produce/carrots.png',
      farmer_name: 'Jadhav Farm',
      village: 'Baramati'
    },
    {
      vegetable_id: 6,
      vegetable_name: 'Tender Lady Finger',
      category: 'Fresh',
      weight: '250 g',
      price: '20.00',
      originalPrice: '25',
      discount: '20% OFF',
      quantity: 90,
      image: '/assets/images/produce/ladyfinger.png',
      farmer_name: 'More Farm',
      village: 'Junnar'
    },
    {
      vegetable_id: 7,
      vegetable_name: 'Green Spinach',
      category: 'Fresh',
      weight: '250 g',
      price: '16.00',
      originalPrice: '20',
      discount: '20% OFF',
      quantity: 80,
      image: '/assets/images/produce/spinach.jpg',
      farmer_name: 'Gaikwad Farm',
      village: 'Manchar'
    },
    {
      vegetable_id: 8,
      vegetable_name: 'Colorful Capsicum',
      category: 'Organic',
      weight: '1 kg',
      price: '48.00',
      originalPrice: '60',
      discount: '20% OFF',
      quantity: 90,
      image: '/assets/images/produce/capsicum.jpg',
      farmer_name: 'Deshmukh Farm',
      village: 'Junnar'
    }
  ];

  // 7 Categories
  const categoryList = [
    { key: 'leafy', title: t('categories.leafy'), rawTitle: 'Leafy Greens', image: '/assets/images/exact_cat1_leafy.png' },
    { key: 'tomatoes', title: t('categories.tomatoes'), rawTitle: 'Tomatoes', image: '/assets/images/exact_cat2_tomatoes.png' },
    { key: 'potatoes', title: t('categories.potatoes'), rawTitle: 'Potatoes', image: '/assets/images/exact_cat3_potatoes.png' },
    { key: 'onions', title: t('categories.onions'), rawTitle: 'Onions', image: '/assets/images/exact_cat4_onions.png' },
    { key: 'root', title: t('categories.root'), rawTitle: 'Root Vegetables', image: '/assets/images/exact_cat5_root.png' },
    { key: 'fruits', title: t('categories.fruits'), rawTitle: 'Fruits', image: '/assets/images/exact_cat6_fruits.png' },
    { key: 'organic', title: t('categories.organic'), rawTitle: 'Organic', image: '/assets/images/exact_cat7_organic.png' }
  ];

  return (
    <div style={{ width: '100%', background: '#f9fdfa', paddingBottom: '60px' }}>
      
      {/* 1. HERO BANNER - FULL-WIDTH 100% VIEWPORT COVERAGE */}
      <section className="container" style={{ paddingTop: '24px', paddingBottom: '36px' }}>
        <div className="home-hero-layout" style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f4fbf6 100%)',
          borderRadius: '24px',
          padding: '48px 60px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          alignItems: 'center',
          border: '1px solid #e2e8f0',
          position: 'relative',
          overflow: 'hidden',
          width: '100%'
        }}>

          {/* Left Side Content */}
          <div className="home-hero-content">
            <h1 className="home-hero-title" style={{ fontSize: '2.85rem', fontWeight: '800', lineHeight: '1.18', marginBottom: '16px', letterSpacing: '-0.5px', color: '#1e293b', fontFamily: 'Poppins' }}>
              {t('hero.title1')} <br />
              <span style={{ color: '#0B6B3A' }}>{t('hero.title2')}</span>
            </h1>

            <p className="home-hero-subtitle" style={{ fontSize: '1.15rem', color: '#475569', marginBottom: '30px', lineHeight: '1.6' }}>
              {t('hero.subtitle')}
            </p>

            {/* 3 Feature Circles */}
            <div className="home-hero-features" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#e6f4ea', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B6B3A' }}>
                  <Leaf size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a' }}>{t('hero.fresh100')}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t('hero.farmToHome')}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#e6f4ea', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B6B3A' }}>
                  <Truck size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a' }}>{t('hero.fastDelivery')}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t('hero.onTime')}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#e6f4ea', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B6B3A' }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a' }}>{t('hero.safeSecure')}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t('hero.qualityAssured')}</div>
                </div>
              </div>
            </div>

            {/* 2 CTA Buttons */}
            <div className="home-hero-actions" style={{ display: 'flex', gap: '18px' }}>
              <Link to="/vegetables" className="btn" style={{ background: '#0B6B3A', color: 'white', padding: '14px 38px', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', boxShadow: '0 4px 14px rgba(11, 107, 58, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} /> {t('hero.shopNow')}
              </Link>
              <button
                type="button"
                onClick={() => {
                  const catElem = document.getElementById('category-section');
                  if (catElem) {
                    catElem.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="btn"
                style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b', padding: '14px 30px', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Grid size={18} /> {t('hero.exploreCategories')}
              </button>
            </div>
          </div>

          {/* Right Side Image & Dashed Pill Badge */}
          <div className="home-hero-artwork" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            
            {/* Supporting Our Farmers Pill */}
            <div className="home-hero-badge" style={{
              position: 'absolute',
              top: '10px',
              left: '20px',
              background: '#ffffff',
              border: '1.5px dashed #16A34A',
              padding: '9px 18px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              fontWeight: '800',
              color: '#0f172a',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              zIndex: 3
            }}>
              <span>{t('hero.supportingFarmers')}</span>
            </div>

            {/* Mint Backdrop Shape */}
            <div className="home-hero-backdrop" style={{
              position: 'absolute',
              width: '480px',
              height: '360px',
              background: '#e6f4ea',
              borderRadius: '50% 50% 40% 60% / 60% 40% 60% 40%',
              top: '10px',
              right: '30px',
              zIndex: 1
            }}></div>

            {/* Wicker Produce Basket Image */}
            <img
              className="home-hero-image"
              src="/assets/images/hero_basket_produce.png"
              alt="Fresh Organic Produce Basket"
              style={{
                width: '100%',
                maxWidth: '580px',
                height: 'auto',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 2
              }}
            />
          </div>
        </div>
      </section>

      {/* 2. SHOP BY CATEGORY (FULL-WIDTH 100%) */}
      <section id="category-section" className="container" style={{ padding: '110px 0 36px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0B6B3A', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            {t('hero.browseCategories')}
          </span>
          <h2 style={{ fontSize: '1.95rem', fontWeight: '900', color: '#0f172a', marginTop: '2px', fontFamily: 'Poppins' }}>
            {t('hero.shopByCategory')}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '4px', color: '#0B6B3A' }}>
            🌱 🌱
          </div>
        </div>

        {/* 7 Category Cards Full Width */}
        <div className="grid-7">
          {categoryList.map((cat, idx) => (
            <motion.div key={idx} whileHover={{ y: -4 }}>
              <Link
                to={`/vegetables?category=${encodeURIComponent(cat.rawTitle)}`}
                className="card"
                style={{
                  padding: '20px 14px',
                  borderRadius: '18px',
                  textDecoration: 'none',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative'
                }}
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  style={{ width: '100px', height: '80px', objectFit: 'contain', marginBottom: '12px' }}
                />
                <div style={{ width: '100%', textAlign: 'left' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a', fontFamily: 'Poppins' }}>{cat.title}</div>
                </div>
                <div style={{ position: 'absolute', bottom: '14px', right: '14px', background: '#0B6B3A', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                  ➔
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS (FULL-WIDTH 100%) */}
      <section className="container" style={{ padding: '30px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0B6B3A', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              {t('hero.featuredProducts')}
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#0f172a', marginTop: '2px', fontFamily: 'Poppins' }}>
              {t('hero.freshPicks')}
            </h2>
          </div>

          <Link to="/vegetables" style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0B6B3A', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {t('hero.viewAll')}
          </Link>
        </div>

        <div className="grid-4">
          {exactProducts.map((veg) => (
            <VegetableCard key={veg.vegetable_id} vegetable={veg} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
