import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { tVegName, tCategory } from '../utils/i18nHelpers';
import { getImageUrl } from '../utils/imageUrl';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Package,
  ShoppingBag,
  LogOut,
  ShieldCheck,
  Sprout,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  IndianRupee,
  Layers,
  Leaf,
  Plus,
  X,
  Check,
  Clock
} from 'lucide-react';

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  // Data States
  const [stats, setStats] = useState({
    totalFarmers: 0,
    totalCustomers: 0,
    totalVegetables: 0,
    totalOrders: 0,
    pendingDeliveries: 0,
    totalRevenue: 0
  });

  const [farmers, setFarmers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vegetables, setVegetables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit / Modal States
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingVeg, setEditingVeg] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [selectedVegCategory, setSelectedVegCategory] = useState('All');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      // The dashboard summary is enough to display the page shell. Load the
      // larger tables alongside it without making navigation wait for all five APIs.
      const dashboardRequest = API.get('/admin/dashboard').then(response => {
        const summary = response.data?.stats || {};
        setStats(current => ({
          ...current,
          totalFarmers: summary.totalFarmers ?? current.totalFarmers,
          totalCustomers: summary.totalCustomers ?? current.totalCustomers,
          totalVegetables: summary.totalVegetables ?? current.totalVegetables,
          totalOrders: summary.totalOrders ?? current.totalOrders,
          pendingDeliveries: summary.pendingDeliveries ?? current.pendingDeliveries,
          totalRevenue: summary.totalRevenue ?? current.totalRevenue
        }));
        return response;
      }).catch(error => {
        console.error('Error loading admin summary:', error);
        return null;
      }).finally(() => setLoading(false));

      const listsRequest = Promise.allSettled([
        API.get('/admin/farmers'),
        API.get('/admin/customers'),
        API.get('/admin/vegetables'),
        API.get('/admin/orders')
      ]);
      const [dashRes, listResults] = await Promise.all([dashboardRequest, listsRequest]);

      const dashData = dashRes?.data || null;
      const farmRes = listResults[0].status === 'fulfilled' ? listResults[0].value.data : [];
      const custRes = listResults[1].status === 'fulfilled' ? listResults[1].value.data : [];
      const vegRes = listResults[2].status === 'fulfilled' ? listResults[2].value.data : [];
      const ordRes = listResults[3].status === 'fulfilled' ? listResults[3].value.data : [];

      setFarmers(farmRes);
      setCustomers(custRes);
      setVegetables(vegRes);
      setOrders(ordRes);

      const pendingCount = ordRes.filter(o => o.status === 'Pending' || o.status === 'Out for Delivery' || o.status === 'Order Placed' || o.status === 'Packed' || o.status === 'Shipped').length;
      const totalRev = ordRes.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

      setStats({
        totalFarmers: dashData?.stats?.totalFarmers ?? farmRes.length,
        totalCustomers: dashData?.stats?.totalCustomers ?? custRes.length,
        totalVegetables: dashData?.stats?.totalVegetables ?? vegRes.length,
        totalOrders: dashData?.stats?.totalOrders ?? ordRes.length,
        pendingDeliveries: dashData?.stats?.pendingDeliveries ?? pendingCount,
        totalRevenue: dashData?.stats?.totalRevenue ?? totalRev
      });
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminDataSilently = async () => {
    try {
      const results = await Promise.allSettled([
        API.get('/admin/dashboard'),
        API.get('/admin/farmers'),
        API.get('/admin/customers'),
        API.get('/admin/vegetables'),
        API.get('/admin/orders')
      ]);

      const dashRes = results[0].status === 'fulfilled' ? results[0].value.data : null;
      const farmRes = results[1].status === 'fulfilled' ? results[1].value.data : [];
      const custRes = results[2].status === 'fulfilled' ? results[2].value.data : [];
      const vegRes = results[3].status === 'fulfilled' ? results[3].value.data : [];
      const ordRes = results[4].status === 'fulfilled' ? results[4].value.data : [];

      if (farmRes.length > 0 || results[1].status === 'fulfilled') setFarmers(farmRes);
      if (custRes.length > 0 || results[2].status === 'fulfilled') setCustomers(custRes);
      if (vegRes.length > 0 || results[3].status === 'fulfilled') setVegetables(vegRes);
      if (ordRes.length > 0 || results[4].status === 'fulfilled') setOrders(ordRes);

      const pendingCount = ordRes.filter(o => o.status === 'Pending' || o.status === 'Out for Delivery' || o.status === 'Order Placed' || o.status === 'Packed' || o.status === 'Shipped').length;
      const totalRev = ordRes.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

      setStats({
        totalFarmers: dashRes?.stats?.totalFarmers || farmRes.length,
        totalCustomers: dashRes?.stats?.totalCustomers || custRes.length,
        totalVegetables: dashRes?.stats?.totalVegetables || vegRes.length,
        totalOrders: dashRes?.stats?.totalOrders || ordRes.length,
        pendingDeliveries: dashRes?.stats?.pendingDeliveries || pendingCount,
        totalRevenue: dashRes?.stats?.totalRevenue || totalRev
      });
    } catch (err) {
      console.error('Error refreshing admin data:', err);
    }
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('freshfarm_lang') || i18n.language || 'en';
    if (i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
    fetchAdminData();
    const interval = setInterval(() => {
      fetchAdminDataSilently();
    }, 30000);
    return () => clearInterval(interval);
  }, [i18n]);

  const handleLogout = () => {
    logout();
    navigate('/login/admin');
  };

  // Farmer Handlers
  const handleSaveFarmer = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/admin/farmers/${editingFarmer.farmer_id}`, editingFarmer);
      setFarmers(farmers.map(f => f.farmer_id === editingFarmer.farmer_id ? { ...f, ...editingFarmer } : f));
      setEditingFarmer(null);
      showNotice('Farmer account updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update farmer.');
    }
  };

  const handleDeleteFarmer = async (id) => {
    if (window.confirm('Are you sure you want to deactivate and remove this farmer account?')) {
      try {
        await API.delete(`/admin/farmers/${id}`);
        setFarmers(farmers.filter(f => f.farmer_id !== id));
        showNotice('Farmer account deactivated and removed.');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete farmer.');
      }
    }
  };

  // Customer Handlers
  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/admin/customers/${editingCustomer.customer_id}`, editingCustomer);
      setCustomers(customers.map(c => c.customer_id === editingCustomer.customer_id ? { ...c, ...editingCustomer } : c));
      setEditingCustomer(null);
      showNotice('Customer account details updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update customer.');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm('Are you sure you want to deactivate and remove this customer account?')) {
      try {
        await API.delete(`/admin/customers/${id}`);
        setCustomers(customers.filter(c => c.customer_id !== id));
        showNotice('Customer account deactivated and removed.');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete customer.');
      }
    }
  };

  // Vegetable Handlers
  const handleSaveVegetable = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/admin/vegetables/${editingVeg.vegetable_id}`, editingVeg);
      setVegetables(vegetables.map(v => v.vegetable_id === editingVeg.vegetable_id ? { ...v, ...editingVeg } : v));
      setEditingVeg(null);
      showNotice('Vegetable listing updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update vegetable.');
    }
  };

  const handleDeleteVegetable = async (id) => {
    if (window.confirm('Are you sure you want to remove this product listing from the platform?')) {
      try {
        await API.delete(`/admin/vegetables/${id}`);
        setVegetables(vegetables.filter(v => v.vegetable_id !== id));
        showNotice('Product listing removed from platform.');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to remove product listing.');
      }
    }
  };

  // Order Handler
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await API.put(`/admin/orders/status/${orderId}`, { status: newStatus });
      setOrders(orders.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
      showNotice(`Order #${orderId} status updated to ${newStatus}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const showNotice = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 3000);
  };

  if (loading) return <LoadingSpinner message={t('common.loading')} />;

  // Filtered Vegetables
  const filteredVegetables = selectedVegCategory === 'All'
    ? vegetables
    : vegetables.filter(v => v.category.toLowerCase().includes(selectedVegCategory.toLowerCase()));

  const categoryList = ['All', 'Leafy Greens', 'Tomatoes', 'Potatoes', 'Onions', 'Root Vegetables', 'Fruits', 'Organic'];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f5', width: '100%' }}>
      
      {/* ========================================================================= */}
      {/* SIDEBAR NAVIGATION (FIXED LEFT 260PX) */}
      {/* ========================================================================= */}
      <aside style={{
        width: '260px',
        background: '#065F46',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 100,
        boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
      }}>
        {/* Sidebar Brand Header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#ffffff', color: '#0B6B3A', padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', fontFamily: 'Poppins', color: '#ffffff', lineHeight: 1.1 }}>
              {t('appName')}
            </div>
            <span style={{ fontSize: '0.68rem', color: '#a7f3d0', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('adminDashboard.governanceAdmin')}
            </span>
          </div>
        </div>

        {/* Sidebar Menu Items */}
        <nav style={{ flex: 1, padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          
          {/* Item 1: Dashboard */}
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'dashboard' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'dashboard' ? '#ffffff' : 'transparent',
              color: activeTab === 'dashboard' ? '#0B6B3A' : '#ecfdf5',
              fontWeight: activeTab === 'dashboard' ? '800' : '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            <LayoutDashboard size={18} /> {t('adminDashboard.dashboardOverview')}
          </button>

          {/* Item 2: Manage Farmers */}
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'farmers' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'farmers' ? '#ffffff' : 'transparent',
              color: activeTab === 'farmers' ? '#0B6B3A' : '#ecfdf5',
              fontWeight: activeTab === 'farmers' ? '800' : '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            <Sprout size={18} /> {t('adminDashboard.manageFarmers', { count: farmers.length })}
          </button>

          {/* Item 3: Manage Customers */}
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'customers' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'customers' ? '#ffffff' : 'transparent',
              color: activeTab === 'customers' ? '#0B6B3A' : '#ecfdf5',
              fontWeight: activeTab === 'customers' ? '800' : '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            <Users size={18} /> {t('adminDashboard.manageCustomers', { count: customers.length })}
          </button>

          {/* Item 4: Manage Vegetables */}
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'vegetables' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'vegetables' ? '#ffffff' : 'transparent',
              color: activeTab === 'vegetables' ? '#0B6B3A' : '#ecfdf5',
              fontWeight: activeTab === 'vegetables' ? '800' : '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            <Package size={18} /> {t('adminDashboard.manageVegetables', { count: vegetables.length })}
          </button>

          {/* Item 5: Manage Orders */}
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'orders' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'orders' ? '#ffffff' : 'transparent',
              color: activeTab === 'orders' ? '#0B6B3A' : '#ecfdf5',
              fontWeight: activeTab === 'orders' ? '800' : '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            <ShoppingBag size={18} /> {t('adminDashboard.manageOrders', { count: orders.length })}
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/rescue-ngos')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'transparent', color: '#ecfdf5', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left' }}
          >
            <ShieldCheck size={18} /> Rescue NGO approvals
          </button>

        </nav>

        {/* Sidebar Footer Logout */}
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '0.85rem',
              cursor: 'pointer',
              justifyContent: 'center'
            }}
          >
            <LogOut size={16} /> {t('adminDashboard.logoutAdmin')}
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN ADMIN WORKSPACE AREA (OFFSET BY 260PX SIDEBAR) */}
      {/* ========================================================================= */}
      <main style={{ marginLeft: '260px', flex: 1, padding: '30px 40px', minHeight: '100vh' }}>
        
        {/* Top Header Workspace Status Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#ffffff',
          padding: '16px 24px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          marginBottom: '28px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a', fontFamily: 'Poppins', margin: 0 }}>
              {activeTab === 'dashboard' && t('adminDashboard.systemGovernance')}
              {activeTab === 'farmers' && t('adminDashboard.farmerPortalTitle')}
              {activeTab === 'customers' && t('adminDashboard.customerDirectory')}
              {activeTab === 'vegetables' && t('adminDashboard.produceCatalog')}
              {activeTab === 'orders' && t('adminDashboard.orderOversight')}
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, marginTop: '2px' }}>
              {t('adminDashboard.platformNotice')}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '700' }}>
              {t('adminDashboard.loggedInAs')} <strong style={{ color: '#0f172a' }}>{user?.name || 'System Admin'}</strong>
            </span>
            <span style={{ background: '#e6f4ea', color: '#0B6B3A', fontSize: '0.8rem', fontWeight: '800', padding: '6px 14px', borderRadius: '12px' }}>
              {t('adminDashboard.systemStatusActive')}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="btn"
              style={{
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                padding: '6px 14px',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <LogOut size={14} /> {t('nav.logout')}
            </button>
          </div>
        </div>

        {/* Action Notice Alert Banner */}
        {actionMessage && (
          <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#16a34a', padding: '12px 18px', borderRadius: '12px', fontWeight: '800', fontSize: '0.88rem', marginBottom: '24px' }}>
            {actionMessage}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 1: DASHBOARD OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Top 5 Statistic Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              
              {/* Card 1: Total Farmers */}
              <div className="card" style={{ padding: '22px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '4px solid #0B6B3A' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('adminDashboard.totalFarmers')}</span>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', marginTop: '4px', fontFamily: 'Poppins' }}>
                  {stats.totalFarmers ?? farmers.length}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#0B6B3A', fontWeight: '800' }}>{t('adminDashboard.registeredFarmers')}</span>
              </div>

              {/* Card 2: Total Customers */}
              <div className="card" style={{ padding: '22px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '4px solid #0284c7' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('adminDashboard.totalCustomers')}</span>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', marginTop: '4px', fontFamily: 'Poppins' }}>
                  {stats.totalCustomers ?? customers.length}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '800' }}>{t('adminDashboard.registeredCustomers')}</span>
              </div>

              {/* Card 3: Total Vegetables */}
              <div className="card" style={{ padding: '22px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '4px solid #16a34a' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('adminDashboard.totalVegetables')}</span>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', marginTop: '4px', fontFamily: 'Poppins' }}>
                  {stats.totalVegetables ?? vegetables.length}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '800' }}>{t('adminDashboard.activeVegetables')}</span>
              </div>

              {/* Card 4: Total Orders */}
              <div className="card" style={{ padding: '22px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '4px solid #8b5cf6' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('adminDashboard.totalOrders')}</span>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', marginTop: '4px', fontFamily: 'Poppins' }}>
                  {stats.totalOrders ?? orders.length}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: '800' }}>{t('adminDashboard.totalOrders')}</span>
              </div>

              {/* Card 5: Pending Deliveries */}
              <div className="card" style={{ padding: '22px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '4px solid #f59e0b' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('adminDashboard.pendingDeliveries')}</span>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#d97706', marginTop: '4px', fontFamily: 'Poppins' }}>
                  {stats.pendingDeliveries ?? orders.filter(o => o.status === 'Pending' || o.status === 'Out for Delivery' || o.status === 'Order Placed' || o.status === 'Packed' || o.status === 'Shipped').length}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '800' }}>{t('adminDashboard.pendingInTransit')}</span>
              </div>

            </div>

            {/* Governance Info Banner & Recent Activity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              
              <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0f172a', marginBottom: '14px', fontFamily: 'Poppins' }}>
                  {t('adminDashboard.governancePrinciples')}
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: '1.6' }}>
                  {t('adminDashboard.governanceDesc')}
                </p>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '12px', marginTop: '16px', fontSize: '0.82rem', color: '#166534', fontWeight: '700' }}>
                  {t('adminDashboard.zeroCommission')} <br />
                  {t('adminDashboard.directEarnings')} <br />
                  {t('adminDashboard.automatedTracking')}
                </div>
              </div>

              <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0f172a', marginBottom: '14px', fontFamily: 'Poppins' }}>
                  {t('adminDashboard.systemSummary')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>{t('adminDashboard.regFarmersCount')}</span>
                    <b style={{ color: '#0B6B3A' }}>{farmers.length}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>{t('adminDashboard.regCustCount')}</span>
                    <b style={{ color: '#0284c7' }}>{customers.length}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>{t('adminDashboard.liveProduceCount')}</span>
                    <b style={{ color: '#16a34a' }}>{vegetables.length}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>{t('adminDashboard.platformOrderVol')}</span>
                    <b style={{ color: '#8b5cf6' }}>{orders.length}</b>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 2: MANAGE FARMERS */}
        {/* ========================================================================= */}
        {activeTab === 'farmers' && (
          <div className="card" style={{ padding: '28px', borderRadius: '20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0f172a', fontFamily: 'Poppins', margin: 0 }}>
                  {t('adminDashboard.farmersDirTitle')}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, marginTop: '2px' }}>
                  {t('adminDashboard.farmersDirSub')}
                </p>
              </div>
              <span style={{ background: '#e6f4ea', color: '#0B6B3A', fontWeight: '800', fontSize: '0.85rem', padding: '6px 14px', borderRadius: '12px' }}>
                {t('adminDashboard.totalFarmersBadge', { count: farmers.length })}
              </span>
            </div>

            {/* Editing Farmer Form */}
            {editingFarmer && (
              <form onSubmit={handleSaveFarmer} style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1.5px solid #cbd5e1', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                  {t('adminDashboard.editFarmerTitle', { id: editingFarmer.farmer_id })}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">{t('farmerDashboard.fullName')}</label>
                    <input type="text" required className="form-control" value={editingFarmer.full_name} onChange={(e) => setEditingFarmer({ ...editingFarmer, full_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">{t('farmerDashboard.phoneNumber')}</label>
                    <input type="text" required className="form-control" value={editingFarmer.phone} onChange={(e) => setEditingFarmer({ ...editingFarmer, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">{t('farmerDashboard.village')}</label>
                    <input type="text" required className="form-control" value={editingFarmer.village} onChange={(e) => setEditingFarmer({ ...editingFarmer, village: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">{t('farmerDashboard.district')}</label>
                    <input type="text" required className="form-control" value={editingFarmer.district} onChange={(e) => setEditingFarmer({ ...editingFarmer, district: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setEditingFarmer(null)} className="btn btn-outline btn-sm">{t('adminDashboard.cancel')}</button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ background: '#0B6B3A' }}>{t('adminDashboard.saveFarmerChanges')}</button>
                </div>
              </form>
            )}

            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '14px' }}>{t('checkout.name')}</th>
                    <th style={{ padding: '14px' }}>{t('checkout.email')}</th>
                    <th style={{ padding: '14px' }}>{t('farmerDashboard.phoneNumber')}</th>
                    <th style={{ padding: '14px' }}>{t('farmerDashboard.village')} / {t('farmerDashboard.district')}</th>
                    <th style={{ padding: '14px' }}>{t('common.date')}</th>
                    <th style={{ padding: '14px' }}>{t('common.status')}</th>
                    <th style={{ padding: '14px' }}>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {farmers.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>{t('adminDashboard.noFarmersFound')}</td>
                    </tr>
                  ) : (
                    farmers.map((farm) => (
                      <tr key={farm.farmer_id}>
                        <td style={{ fontWeight: '800', color: '#0f172a' }}>{farm.full_name}</td>
                        <td style={{ color: '#475569' }}>{farm.email}</td>
                        <td style={{ fontWeight: '600', color: '#0f172a' }}>{farm.phone}</td>
                        <td>
                          <span style={{ fontWeight: '700', color: '#0B6B3A' }}>{farm.village}</span>{farm.district ? `, ${farm.district}` : ''}
                        </td>
                        <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                          {farm.created_at ? new Date(farm.created_at).toLocaleDateString('en-IN') : 'Recent'}
                        </td>
                        <td>
                          <span className="badge badge-green">{t('adminDashboard.active')}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingFarmer(farm)}
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '0.78rem' }}
                            >
                              <Edit size={14} /> {t('common.edit')}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteFarmer(farm.farmer_id)}
                              className="btn btn-danger btn-sm"
                              style={{ fontSize: '0.78rem' }}
                            >
                              <Trash2 size={14} /> {t('adminDashboard.deactivate')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 3: MANAGE CUSTOMERS */}
        {/* ========================================================================= */}
        {activeTab === 'customers' && (
          <div className="card" style={{ padding: '28px', borderRadius: '20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0f172a', fontFamily: 'Poppins', margin: 0 }}>
                  {t('adminDashboard.customersDirTitle')}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, marginTop: '2px' }}>
                  {t('adminDashboard.customersDirSub')}
                </p>
              </div>
              <span style={{ background: '#e0f2fe', color: '#0284c7', fontWeight: '800', fontSize: '0.85rem', padding: '6px 14px', borderRadius: '12px' }}>
                {t('adminDashboard.totalCustomersBadge', { count: customers.length })}
              </span>
            </div>

            {/* Editing Customer Form */}
            {editingCustomer && (
              <form onSubmit={handleSaveCustomer} style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1.5px solid #cbd5e1', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                  {t('adminDashboard.editCustomerTitle', { id: editingCustomer.customer_id })}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">{t('farmerDashboard.fullName')}</label>
                    <input type="text" required className="form-control" value={editingCustomer.full_name} onChange={(e) => setEditingCustomer({ ...editingCustomer, full_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">{t('checkout.phone')}</label>
                    <input type="text" required className="form-control" value={editingCustomer.phone} onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">{t('checkout.city')}</label>
                    <input type="text" required className="form-control" value={editingCustomer.city} onChange={(e) => setEditingCustomer({ ...editingCustomer, city: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">{t('adminDashboard.cityPincode')}</label>
                    <input type="text" required className="form-control" value={editingCustomer.pincode} onChange={(e) => setEditingCustomer({ ...editingCustomer, pincode: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setEditingCustomer(null)} className="btn btn-outline btn-sm">{t('adminDashboard.cancel')}</button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ background: '#0284c7' }}>{t('adminDashboard.saveCustomerChanges')}</button>
                </div>
              </form>
            )}

            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '14px' }}>{t('checkout.name')}</th>
                    <th style={{ padding: '14px' }}>{t('checkout.email')}</th>
                    <th style={{ padding: '14px' }}>{t('checkout.phone')}</th>
                    <th style={{ padding: '14px' }}>{t('checkout.address')}</th>
                    <th style={{ padding: '14px' }}>{t('common.date')}</th>
                    <th style={{ padding: '14px' }}>{t('common.status')}</th>
                    <th style={{ padding: '14px' }}>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>{t('adminDashboard.noCustomersFound')}</td>
                    </tr>
                  ) : (
                    customers.map((cust) => (
                      <tr key={cust.customer_id}>
                        <td style={{ fontWeight: '800', color: '#0f172a' }}>{cust.full_name}</td>
                        <td style={{ color: '#475569' }}>{cust.email}</td>
                        <td style={{ fontWeight: '600', color: '#0f172a' }}>{cust.phone}</td>
                        <td>
                          <span style={{ color: '#0f172a' }}>{cust.address ? `${cust.address}, ` : ''}{cust.city} ({cust.pincode})</span>
                        </td>
                        <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                          {cust.created_at ? new Date(cust.created_at).toLocaleDateString('en-IN') : 'Recent'}
                        </td>
                        <td>
                          <span className="badge badge-green">{t('adminDashboard.active')}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingCustomer(cust)}
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '0.78rem' }}
                            >
                              <Edit size={14} /> {t('common.edit')}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteCustomer(cust.customer_id)}
                              className="btn btn-danger btn-sm"
                              style={{ fontSize: '0.78rem' }}
                            >
                              <Trash2 size={14} /> {t('adminDashboard.deactivate')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 4: MANAGE VEGETABLES */}
        {/* ========================================================================= */}
        {activeTab === 'vegetables' && (
          <div className="card" style={{ padding: '28px', borderRadius: '20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0f172a', fontFamily: 'Poppins', margin: 0 }}>
                  {t('adminDashboard.vegCatalogTitle')}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, marginTop: '2px' }}>
                  {t('adminDashboard.vegCatalogSub')}
                </p>
              </div>
              <span style={{ background: '#dcfce7', color: '#16a34a', fontWeight: '800', fontSize: '0.85rem', padding: '6px 14px', borderRadius: '12px' }}>
                {t('adminDashboard.totalListingsBadge', { count: vegetables.length })}
              </span>
            </div>

            {/* Vegetable Category Filter Bar */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569', alignSelf: 'center', marginRight: '6px' }}>{t('adminDashboard.filterCategory')}</span>
              {categoryList.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedVegCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: selectedVegCategory === cat ? '1.5px solid #0B6B3A' : '1px solid #cbd5e1',
                    background: selectedVegCategory === cat ? '#e6f4ea' : '#ffffff',
                    color: selectedVegCategory === cat ? '#0B6B3A' : '#475569',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  {cat === 'All' ? t('categories.all') : tCategory(t, cat)}
                </button>
              ))}
            </div>

            {/* Editing Vegetable Form */}
            {editingVeg && (
              <form onSubmit={handleSaveVegetable} style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1.5px solid #cbd5e1', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                  {t('adminDashboard.editListingTitle', { id: editingVeg.vegetable_id })}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">{t('farmerDashboard.productName')}</label>
                    <input type="text" required className="form-control" value={editingVeg.vegetable_name} onChange={(e) => setEditingVeg({ ...editingVeg, vegetable_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">{t('filter.categoryLabel')}</label>
                    <input type="text" required className="form-control" value={editingVeg.category} onChange={(e) => setEditingVeg({ ...editingVeg, category: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">{t('farmerDashboard.pricePerKg')}</label>
                    <input type="number" step="0.5" required className="form-control" value={editingVeg.price} onChange={(e) => setEditingVeg({ ...editingVeg, price: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">{t('farmerDashboard.stockQuantity')}</label>
                    <input type="number" required className="form-control" value={editingVeg.quantity} onChange={(e) => setEditingVeg({ ...editingVeg, quantity: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setEditingVeg(null)} className="btn btn-outline btn-sm">{t('adminDashboard.cancel')}</button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ background: '#0B6B3A' }}>{t('adminDashboard.saveProductListing')}</button>
                </div>
              </form>
            )}

            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '14px' }}>ID</th>
                    <th style={{ padding: '14px' }}>{t('adminDashboard.produceImageName')}</th>
                    <th style={{ padding: '14px' }}>{t('adminDashboard.farmerProducer')}</th>
                    <th style={{ padding: '14px' }}>{t('filter.categoryLabel')}</th>
                    <th style={{ padding: '14px' }}>{t('farmerDashboard.pricePerKg')}</th>
                    <th style={{ padding: '14px' }}>{t('farmerDashboard.stockQuantity')}</th>
                    <th style={{ padding: '14px' }}>{t('adminDashboard.listingActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVegetables.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>{t('adminDashboard.noVegCategory')}</td>
                    </tr>
                  ) : (
                    filteredVegetables.map((veg) => (
                      <tr key={veg.vegetable_id}>
                        <td style={{ fontWeight: '800' }}>#{veg.vegetable_id}</td>
                        <td style={{ fontWeight: '800', color: '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={getImageUrl(veg.image, '/assets/images/produce/tomatoes.jpg')}
                              alt={veg.vegetable_name}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = getImageUrl(veg.image, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&auto=format&fit=crop&q=80');
                              }}
                              style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #cbd5e1' }}
                            />
                            <span>{tVegName(t, veg.vegetable_name)}</span>
                          </div>
                        </td>
                        <td>👨‍🌾 {veg.farmer_name} ({veg.village})</td>
                        <td><span className="badge badge-green">{tCategory(t, veg.category)}</span></td>
                        <td style={{ fontWeight: '900', color: '#0B6B3A' }}>₹{parseFloat(veg.price).toFixed(2)}</td>
                        <td style={{ fontWeight: '800' }}>{veg.quantity} {t('common.kg', 'kg')}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingVeg(veg)}
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '0.78rem' }}
                            >
                              <Edit size={14} /> {t('common.edit')}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteVegetable(veg.vegetable_id)}
                              className="btn btn-danger btn-sm"
                              style={{ fontSize: '0.78rem' }}
                            >
                              <Trash2 size={14} /> {t('adminDashboard.removeListing')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 5: MANAGE ORDERS */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="card" style={{ padding: '28px', borderRadius: '20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0f172a', fontFamily: 'Poppins', margin: 0 }}>
                  {t('adminDashboard.ordersMgmtTitle')}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, marginTop: '2px' }}>
                  {t('adminDashboard.ordersMgmtSub')}
                </p>
              </div>
              <span style={{ background: '#fef3c7', color: '#b45309', fontWeight: '800', fontSize: '0.85rem', padding: '6px 14px', borderRadius: '12px' }}>
                {t('adminDashboard.pendingShipmentsBadge', { count: orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length })}
              </span>
            </div>

            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '14px' }}>{t('farmerDashboard.orderId')}</th>
                    <th style={{ padding: '14px' }}>{t('adminDashboard.custNamePhone')}</th>
                    <th style={{ padding: '14px' }}>{t('adminDashboard.itemsFarmerInfo')}</th>
                    <th style={{ padding: '14px' }}>{t('adminDashboard.amountPayment')}</th>
                    <th style={{ padding: '14px' }}>{t('adminDashboard.systemDeliveryUpdate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>{t('adminDashboard.noOrdersPlaced')}</td>
                    </tr>
                  ) : (
                    orders.map((ord) => (
                      <tr key={ord.order_id}>
                        <td style={{ fontWeight: '800' }}>#{ord.order_id}</td>
                        <td>
                          <div style={{ fontWeight: '800', color: '#0f172a' }}>{ord.customer_name}</div>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>📞 {ord.customer_phone}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>
                            {ord.items.map(i => `${t(`vegNames.${i.vegetable_name}`, i.vegetable_name)} (${i.quantity}kg by ${i.farmer_name}${i.surplus_listing_id ? ` · Rescue Deal ₹${Number(i.price).toFixed(2)}/kg` : ''})`).join(', ')}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '900', color: '#0B6B3A' }}>₹{parseFloat(ord.total_amount).toFixed(2)}</div>
                          <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '700' }}>
                            {ord.payment_method} • {ord.payment_status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <select
                              value={ord.status || 'Order Placed'}
                              disabled={updatingOrderId === ord.order_id}
                              onChange={(e) => handleUpdateOrderStatus(ord.order_id, e.target.value)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '10px',
                                border: '1.5px solid #cbd5e1',
                                background: ord.status === 'Delivered' ? '#f0fdf4' : ord.status === 'Cancelled' ? '#fef2f2' : '#ffffff',
                                color: ord.status === 'Delivered' ? '#16a34a' : ord.status === 'Cancelled' ? '#dc2626' : '#0f172a',
                                fontWeight: '700',
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="Order Placed">{t('status.placed')}</option>
                              <option value="Packed">{t('status.packed')}</option>
                              <option value="Shipped">{t('status.shipped')}</option>
                              <option value="Out for Delivery">{t('status.outForDelivery')}</option>
                              <option value="Delivered">{t('status.delivered')}</option>
                              <option value="Cancelled">{t('status.cancelled')}</option>
                            </select>
                            {updatingOrderId === ord.order_id && (
                              <RefreshCw size={16} className="spin-icon" color="#0B6B3A" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;
