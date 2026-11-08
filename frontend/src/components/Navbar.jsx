import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import LanguageSwitcher from './LanguageSwitcher';
import { ShoppingBag, LogOut, Search, User, Leaf, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isFarmer = user?.role === 'farmer' || location.pathname.startsWith('/farmer');
  const isAdmin = user?.role === 'admin' || location.pathname.startsWith('/admin');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/vegetables?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/vegetables');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login/customer');
  };

  const handleFarmerLogout = () => {
    logout();
    navigate('/login/farmer');
  };

  const isActive = (path) => location.pathname === path;

  // READ ACTIVE TAB IF ON FARMER DASHBOARD
  const queryParams = new URLSearchParams(location.search);
  const currentTab = queryParams.get('tab') || 'dashboard';

  // 0. DEDICATED ADMIN PORTAL NAVBAR (RETURN NULL TO AVOID DUPLICATE TOP HEADER)
  if (isAdmin) {
    return null;
  }

  // 1. DEDICATED FARMER PORTAL NAVBAR (NO CUSTOMER LINKS)
  if (isFarmer) {
    return (
      <header style={{ width: '100%', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08)' }}>
        {/* Top Farmer Bar */}
        <div style={{ background: '#065F46', color: '#ffffff', fontSize: '0.82rem', padding: '6px 0', fontWeight: '600' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>🚜 {t('nav.farmerBusinessPortal')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <LanguageSwitcher />
              <span>{t('farmerDashboard.welcome')} {user?.name || t('roles.farmer')}</span>
            </div>
          </div>
        </div>

        {/* Main Farmer Header */}
        <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <div className="container farmer-navbar-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px' }}>
            
            {/* Farmer Brand Logo */}
            <Link to="/farmer/dashboard?tab=dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div style={{ background: '#0B6B3A', color: 'white', padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
                <Leaf size={24} />
              </div>
              <div>
                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0B6B3A', fontFamily: 'Poppins', lineHeight: 1.1, display: 'block' }}>
                  {t('appName')}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('nav.farmerBusinessPortal')}
                </span>
              </div>
            </Link>

            {/* Farmer Top Menu Links */}
            <div style={{ display: 'flex', gap: '6px', fontSize: '0.9rem', fontWeight: '700' }}>
              <Link to="/farmer/rescue" className="btn" style={{ color: location.pathname === '/farmer/rescue' ? '#0B6B3A' : '#475569', fontWeight: 800 }}>Surplus Rescue</Link>
              <button
                type="button"
                onClick={() => navigate('/farmer/dashboard?tab=dashboard')}
                className="btn"
                style={{
                  background: currentTab === 'dashboard' && location.pathname === '/farmer/dashboard' ? '#e6f4ea' : 'transparent',
                  color: currentTab === 'dashboard' && location.pathname === '/farmer/dashboard' ? '#0B6B3A' : '#475569',
                  border: currentTab === 'dashboard' && location.pathname === '/farmer/dashboard' ? '1.5px solid #0B6B3A' : 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                {t('nav.dashboard')}
              </button>

              <button
                type="button"
                onClick={() => navigate('/farmer/dashboard?tab=products')}
                className="btn"
                style={{
                  background: currentTab === 'products' ? '#e6f4ea' : 'transparent',
                  color: currentTab === 'products' ? '#0B6B3A' : '#475569',
                  border: currentTab === 'products' ? '1.5px solid #0B6B3A' : 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                {t('nav.myProducts')}
              </button>

              <button
                type="button"
                onClick={() => navigate('/farmer/dashboard?tab=orders')}
                className="btn"
                style={{
                  background: currentTab === 'orders' ? '#e6f4ea' : 'transparent',
                  color: currentTab === 'orders' ? '#0B6B3A' : '#475569',
                  border: currentTab === 'orders' ? '1.5px solid #0B6B3A' : 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                {t('nav.orders')}
              </button>

              <button
                type="button"
                onClick={() => navigate('/farmer/dashboard?tab=inventory')}
                className="btn"
                style={{
                  background: currentTab === 'inventory' ? '#e6f4ea' : 'transparent',
                  color: currentTab === 'inventory' ? '#0B6B3A' : '#475569',
                  border: currentTab === 'inventory' ? '1.5px solid #0B6B3A' : 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                {t('nav.inventory')}
              </button>

              <button
                type="button"
                onClick={() => navigate('/farmer/dashboard?tab=profile')}
                className="btn"
                style={{
                  background: currentTab === 'profile' ? '#e6f4ea' : 'transparent',
                  color: currentTab === 'profile' ? '#0B6B3A' : '#475569',
                  border: currentTab === 'profile' ? '1.5px solid #0B6B3A' : 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                {t('nav.profile')}
              </button>
            </div>

            {/* Logout Button */}
            <div>
              <button
                type="button"
                onClick={handleFarmerLogout}
                className="btn"
                style={{
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={16} /> {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // 2. STANDARD CUSTOMER WEBSITE NAVBAR
  return (
    <header style={{ width: '100%', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 2px 16px rgba(0, 0, 0, 0.05)' }}>
      {/* 1. Top Announcement Bar (Full Width) */}
      <div style={{ background: '#0B6B3A', color: '#ffffff', fontSize: '0.82rem', padding: '6px 0', fontWeight: '500', width: '100%' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{t('nav.announcement')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* 2. Premium Navbar (Full Width) */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #f1f5f9', width: '100%' }}>
        <div className="container customer-navbar-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', gap: '24px' }}>
          
          {/* Logo & Subtext */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ background: '#0B6B3A', color: 'white', padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
              <Leaf size={24} />
            </div>
            <div>
              <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0B6B3A', letterSpacing: '-0.5px', fontFamily: 'Poppins', lineHeight: 1.1, display: 'block' }}>
                {t('appName')}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', display: 'block' }}>
                {t('nav.directFromFarmers')}
              </span>
            </div>
          </Link>

          <button type="button" className="mobile-menu-toggle" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileMenuOpen(open => !open)}>
            {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>

          {/* Navigation Menu Links */}
          <div className={`customer-navbar-links${mobileMenuOpen ? ' is-open' : ''}`} style={{ display: 'flex', gap: '26px', fontSize: '0.9rem', fontWeight: '700' }}>
            <Link to="/" style={{ color: isActive('/') ? '#0B6B3A' : '#475569', borderBottom: isActive('/') ? '2px solid #0B6B3A' : 'none', paddingBottom: '4px' }}>
              {t('nav.home')}
            </Link>
            <Link to="/vegetables" style={{ color: isActive('/vegetables') ? '#0B6B3A' : '#475569', borderBottom: isActive('/vegetables') ? '2px solid #0B6B3A' : 'none', paddingBottom: '4px' }}>
              {t('nav.vegetables')}
            </Link>
            {user?.role !== 'ngo' && <Link to="/rescue-deals" style={{ color: isActive('/rescue-deals') ? '#0B6B3A' : '#475569', borderBottom: isActive('/rescue-deals') ? '2px solid #0B6B3A' : 'none', paddingBottom: '4px' }}>{t('nav.rescueDeals')}</Link>}
            <Link to="/ngo/rescue" style={{ color: isActive('/ngo/rescue') ? '#0B6B3A' : '#475569', paddingBottom: '4px' }}>{t('nav.ngoKitchen')}</Link>
            <Link to="/about" style={{ color: isActive('/about') ? '#0B6B3A' : '#475569', borderBottom: isActive('/about') ? '2px solid #0B6B3A' : 'none', paddingBottom: '4px' }}>
              {t('nav.about')}
            </Link>
            <Link to="/how-it-works" style={{ color: isActive('/how-it-works') ? '#0B6B3A' : '#475569', borderBottom: isActive('/how-it-works') ? '2px solid #0B6B3A' : 'none', paddingBottom: '4px' }}>
              {t('nav.howItWorks')}
            </Link>
            <Link to="/contact" style={{ color: isActive('/contact') ? '#0B6B3A' : '#475569', borderBottom: isActive('/contact') ? '2px solid #0B6B3A' : 'none', paddingBottom: '4px' }}>
              {t('nav.contact')}
            </Link>
          </div>

          {/* Search Bar Input */}
          <form className={`customer-navbar-search${mobileMenuOpen ? ' is-open' : ''}`} onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '24px', overflow: 'hidden', width: '340px', background: '#f8fafc', padding: '2px 4px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('nav.searchPlaceholder')}
              style={{ flex: 1, border: 'none', outline: 'none', padding: '8px 16px', fontSize: '0.88rem', color: '#0f172a', background: 'transparent' }}
            />
            <button type="submit" style={{ background: 'transparent', color: '#64748b', border: 'none', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Search size={18} />
            </button>
          </form>

          {/* Cart Icon & Auth Button */}
          <div className={`customer-navbar-actions${mobileMenuOpen ? ' is-open' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {(!user || user.role === 'customer') && (
              <Link to="/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#0f172a' }}>
                <div style={{ background: '#f8fafc', padding: '9px', borderRadius: '50%', border: '1px solid #e2e8f0' }}>
                  <ShoppingBag size={18} color="#0B6B3A" />
                </div>
                <span style={{ position: 'absolute', top: '-4px', right: '-6px', background: '#0B6B3A', color: 'white', fontSize: '0.68rem', fontWeight: '900', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cartCount}
                </span>
              </Link>
            )}

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-green">
                  {user.name.split(' ')[0]}
                </span>
                <button onClick={handleLogout} className="btn btn-outline btn-sm" style={{ padding: '6px 12px' }}>
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <Link to="/login/customer" className="btn btn-primary btn-sm" style={{ background: '#0B6B3A', borderRadius: '24px', padding: '9px 22px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={16} /> {t('nav.loginRegister')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
