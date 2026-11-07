import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, ShoppingBag, Sprout, Truck, ShieldCheck, DollarSign } from 'lucide-react';

const HowItWorksPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('customer');

  return (
    <div style={{ width: '100%', background: '#f9fdfa', paddingBottom: '80px' }}>
      
      {/* 1. HERO HEADER */}
      <section className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #065F46 0%, #0d9488 50%, #16A34A 100%)',
          borderRadius: '24px',
          padding: '50px 40px',
          color: 'white',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(6, 95, 70, 0.18)'
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', padding: '6px 18px', borderRadius: '30px', fontSize: '0.88rem', fontWeight: '700', marginBottom: '16px' }}>
            <span>⚡ {t('howItWorks.subtitle')}</span>
          </div>

          <h1 style={{ fontSize: '2.8rem', fontWeight: '800', marginBottom: '16px', fontFamily: 'Poppins', letterSpacing: '-0.5px' }}>
            {t('howItWorks.title')}
          </h1>

          <p style={{ fontSize: '1.15rem', lineHeight: '1.7', maxWidth: '780px', margin: '0 auto', opacity: 0.95 }}>
            {t('about.subtitle')}
          </p>

          {/* Toggle Tab Selector */}
          <div style={{ display: 'inline-flex', background: 'rgba(0, 0, 0, 0.2)', padding: '6px', borderRadius: '40px', marginTop: '30px' }}>
            <button
              onClick={() => setActiveTab('customer')}
              style={{
                padding: '10px 28px',
                borderRadius: '30px',
                border: 'none',
                background: activeTab === 'customer' ? '#ffffff' : 'transparent',
                color: activeTab === 'customer' ? '#0B6B3A' : '#ffffff',
                fontWeight: '800',
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'all 0.25s ease-in-out'
              }}
            >
              🛒 {t('roles.customer')}
            </button>
            <button
              onClick={() => setActiveTab('farmer')}
              style={{
                padding: '10px 28px',
                borderRadius: '30px',
                border: 'none',
                background: activeTab === 'farmer' ? '#ffffff' : 'transparent',
                color: activeTab === 'farmer' ? '#0B6B3A' : '#ffffff',
                fontWeight: '800',
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'all 0.25s ease-in-out'
              }}
            >
              👨‍🌾 {t('roles.farmer')}
            </button>
          </div>
        </div>
      </section>

      {/* 2. FOR CUSTOMERS STEPS */}
      {activeTab === 'customer' && (
        <section className="container" style={{ paddingBottom: '50px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0B6B3A', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              {t('roles.customer')}
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#0f172a', marginTop: '4px', fontFamily: 'Poppins' }}>
              {t('howItWorks.title')}
            </h2>
          </div>

          <div className="grid-3">
            
            {/* Step 1 */}
            <div className="card" style={{ padding: '32px 24px', borderRadius: '22px', background: '#ffffff', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '2rem', fontWeight: '900', color: '#e2e8f0', fontFamily: 'Poppins' }}>
                01
              </div>
              <div style={{ background: '#e6f4ea', width: '56px', height: '56px', borderRadius: '18px', color: '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Search size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px', fontFamily: 'Poppins' }}>
                {t('howItWorks.step1Title')}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6' }}>
                {t('howItWorks.step1Desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="card" style={{ padding: '32px 24px', borderRadius: '22px', background: '#ffffff', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '2rem', fontWeight: '900', color: '#e2e8f0', fontFamily: 'Poppins' }}>
                02
              </div>
              <div style={{ background: '#e6f4ea', width: '56px', height: '56px', borderRadius: '18px', color: '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <ShoppingBag size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px', fontFamily: 'Poppins' }}>
                {t('howItWorks.step2Title')}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6' }}>
                {t('howItWorks.step2Desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="card" style={{ padding: '32px 24px', borderRadius: '22px', background: '#ffffff', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '2rem', fontWeight: '900', color: '#e2e8f0', fontFamily: 'Poppins' }}>
                03
              </div>
              <div style={{ background: '#e6f4ea', width: '56px', height: '56px', borderRadius: '18px', color: '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Truck size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px', fontFamily: 'Poppins' }}>
                {t('howItWorks.step3Title')}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6' }}>
                {t('howItWorks.step3Desc')}
              </p>
            </div>

          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link to="/vegetables" className="btn btn-primary" style={{ padding: '14px 36px', fontSize: '1rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={18} /> {t('hero.shopNow')}
            </Link>
          </div>
        </section>
      )}

      {/* 3. FOR FARMERS STEPS */}
      {activeTab === 'farmer' && (
        <section className="container" style={{ paddingBottom: '50px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0B6B3A', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              {t('roles.farmer')}
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#0f172a', marginTop: '4px', fontFamily: 'Poppins' }}>
              {t('farmerDashboard.title')}
            </h2>
          </div>

          <div className="grid-3">
            
            {/* Farmer Step 1 */}
            <div className="card" style={{ padding: '36px 28px', borderRadius: '22px', background: '#ffffff', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '2rem', fontWeight: '900', color: '#e2e8f0', fontFamily: 'Poppins' }}>
                01
              </div>
              <div style={{ background: '#e6f4ea', width: '56px', height: '56px', borderRadius: '18px', color: '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Sprout size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px', fontFamily: 'Poppins' }}>
                {t('footer.registerFarmer')}
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: '1.6' }}>
                {t('about.subtitle')}
              </p>
            </div>

            {/* Farmer Step 2 */}
            <div className="card" style={{ padding: '36px 28px', borderRadius: '22px', background: '#ffffff', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '2rem', fontWeight: '900', color: '#e2e8f0', fontFamily: 'Poppins' }}>
                02
              </div>
              <div style={{ background: '#e6f4ea', width: '56px', height: '56px', borderRadius: '18px', color: '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <ShieldCheck size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px', fontFamily: 'Poppins' }}>
                {t('farmerDashboard.addProduct')}
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: '1.6' }}>
                {t('about.transparentPricingDesc')}
              </p>
            </div>

            {/* Farmer Step 3 */}
            <div className="card" style={{ padding: '36px 28px', borderRadius: '22px', background: '#ffffff', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '2rem', fontWeight: '900', color: '#e2e8f0', fontFamily: 'Poppins' }}>
                03
              </div>
              <div style={{ background: '#e6f4ea', width: '56px', height: '56px', borderRadius: '18px', color: '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <DollarSign size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px', fontFamily: 'Poppins' }}>
                {t('farmerDashboard.totalSales')}
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: '1.6' }}>
                {t('about.transparentPricingDesc')}
              </p>
            </div>

          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link to="/register/farmer" className="btn btn-primary" style={{ padding: '14px 36px', fontSize: '1rem', borderRadius: '12px' }}>
              👨‍🌾 {t('footer.registerFarmer')}
            </Link>
          </div>
        </section>
      )}

    </div>
  );
};

export default HowItWorksPage;
