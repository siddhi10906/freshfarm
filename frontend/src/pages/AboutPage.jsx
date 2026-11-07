import React from 'react';
import { useTranslation } from 'react-i18next';
import { Leaf, Users, Truck, Heart, CheckCircle2, ShieldCheck, Tag, Award } from 'lucide-react';

const AboutPage = () => {
  const { t } = useTranslation();

  return (
    <div style={{ width: '100%', background: '#f9fdfa', paddingBottom: '70px' }}>
      
      {/* 1. HERO / ABOUT TITLE HEADER */}
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', padding: '6px 16px', borderRadius: '30px', fontSize: '0.88rem', fontWeight: '700', marginBottom: '16px' }}>
            <span>🍃 {t('nav.directFromFarmers')}</span>
          </div>

          <h1 style={{ fontSize: '2.8rem', fontWeight: '800', marginBottom: '18px', fontFamily: 'Poppins', letterSpacing: '-0.5px' }}>
            {t('about.title')}
          </h1>

          <p style={{ fontSize: '1.15rem', lineHeight: '1.7', maxWidth: '820px', margin: '0 auto', opacity: 0.95 }}>
            {t('about.subtitle')} {t('about.missionDesc')}
          </p>
        </div>
      </section>

      {/* 2. 4 CORE PROMISE CARDS */}
      <section className="container" style={{ paddingBottom: '50px' }}>
        <div className="grid-4">
          
          <div className="card" style={{ padding: '28px 24px', borderRadius: '20px', background: '#ffffff' }}>
            <div style={{ background: '#e6f4ea', width: '54px', height: '54px', borderRadius: '16px', color: '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Leaf size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px', fontFamily: 'Poppins' }}>
              🌱 {t('hero.fresh100')}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6' }}>
              {t('hero.subtitle')}
            </p>
          </div>

          <div className="card" style={{ padding: '28px 24px', borderRadius: '20px', background: '#ffffff' }}>
            <div style={{ background: '#e6f4ea', width: '54px', height: '54px', borderRadius: '16px', color: '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Users size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px', fontFamily: 'Poppins' }}>
              🤝 {t('about.directFarmers')}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6' }}>
              {t('about.directFarmersDesc')}
            </p>
          </div>

          <div className="card" style={{ padding: '28px 24px', borderRadius: '20px', background: '#ffffff' }}>
            <div style={{ background: '#e6f4ea', width: '54px', height: '54px', borderRadius: '16px', color: '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Truck size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px', fontFamily: 'Poppins' }}>
              🚚 {t('hero.fastDelivery')}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6' }}>
              {t('howItWorks.step3Desc')}
            </p>
          </div>

          <div className="card" style={{ padding: '28px 24px', borderRadius: '20px', background: '#ffffff' }}>
            <div style={{ background: '#e6f4ea', width: '54px', height: '54px', borderRadius: '16px', color: '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Heart size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px', fontFamily: 'Poppins' }}>
              🥗 {t('hero.safeSecure')}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6' }}>
              {t('about.qualityCheckDesc')}
            </p>
          </div>

        </div>
      </section>

      {/* 3. WHY CHOOSE FRESHFARM? SECTION */}
      <section className="container" style={{ paddingBottom: '60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0B6B3A', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            {t('about.whyTitle')}
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#0f172a', marginTop: '4px', fontFamily: 'Poppins' }}>
            {t('about.whyTitle')}
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '6px' }}>
            {t('about.subtitle')}
          </p>
        </div>

        <div className="grid-4">
          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '18px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ background: '#ecfdf5', width: '50px', height: '50px', borderRadius: '50%', color: '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
              <CheckCircle2 size={24} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Poppins' }}>{t('hero.fresh100')}</h4>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>{t('about.qualityCheckDesc')}</p>
          </div>

          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '18px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ background: '#ecfdf5', width: '50px', height: '50px', borderRadius: '50%', color: '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
              <ShieldCheck size={24} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Poppins' }}>{t('about.qualityCheck')}</h4>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>{t('hero.qualityAssured')}</p>
          </div>

          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '18px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ background: '#ecfdf5', width: '50px', height: '50px', borderRadius: '50%', color: '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
              <Tag size={24} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Poppins' }}>{t('about.transparentPricing')}</h4>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>{t('about.transparentPricingDesc')}</p>
          </div>

          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '18px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ background: '#ecfdf5', width: '50px', height: '50px', borderRadius: '50%', color: '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
              <Award size={24} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Poppins' }}>{t('about.directFarmers')}</h4>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>{t('about.directFarmersDesc')}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
