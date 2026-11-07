import React, { useState, useEffect, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { tVegName, tCategory } from '../utils/i18nHelpers';
import {
  Sprout,
  ShoppingBag,
  IndianRupee,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  TrendingUp,
  User,
  Phone,
  MapPin,
  Package,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Edit3,
  Save
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

const getVegImageUrl = (veg) => {
  if (!veg) return '/assets/images/produce/bhindi_exact.png';
  const name = (veg.vegetable_name || '').toLowerCase();
  if (name.includes('bhindi') || name.includes('lady finger') || name.includes('ladyfinger') || name.includes('okra')) {
    return '/assets/images/produce/bhindi_exact.png';
  }
  const img = veg.image || '';
  if (img.startsWith('http') || img.startsWith('data:') || img.startsWith('/assets')) {
    return img;
  }
  if (name.includes('spinach') || name.includes('palak')) {
    return 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&auto=format&fit=crop&q=80';
  }
  if (name.includes('tomato')) {
    return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80';
  }
  if (name.includes('potato')) {
    return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80';
  }
  if (name.includes('onion')) {
    return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&auto=format&fit=crop&q=80';
  }
  if (name.includes('carrot')) {
    return 'https://images.unsplash.com/photo-1598170845058-12ef4a457939?w=400&auto=format&fit=crop&q=80';
  }
  if (name.includes('cauliflower')) {
    return 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400&auto=format&fit=crop&q=80';
  }
  if (name.includes('peas') || name.includes('matar')) {
    return 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400&auto=format&fit=crop&q=80';
  }
  if (name.includes('capsicum')) {
    return 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&auto=format&fit=crop&q=80';
  }
  if (img && !img.includes('default')) {
    return `/uploads/${img}`;
  }
  return '/assets/images/produce/bhindi_exact.png';
};

const FarmerDashboard = () => {
  const { t, i18n } = useTranslation();
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const [vegetables, setVegetables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [updatingVegStockId, setUpdatingVegStockId] = useState(null);
  const [editingStockValues, setEditingStockValues] = useState({});

  // Farmer Profile State
  const [farmerProfile, setFarmerProfile] = useState({
    name: user?.name || 'Ramesh Patil',
    phone: user?.phone || '9822012345',
    village: user?.village || 'Manchar',
    district: user?.district || 'Pune'
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const loadFarmerData = async () => {
    try {
      setLoading(true);
      const [vegRes, ordRes] = await Promise.all([
        API.get(`/vegetables?farmer_id=${user?.id || 1}`),
        API.get('/orders/farmer/orders')
      ]);
      let vegData = vegRes.data || [];
      let ordData = ordRes.data || [];

      // If farmer has no products yet, populate sample produce data
      if (vegData.length === 0) {
        vegData = [
          { vegetable_id: 901, vegetable_name: 'Fresh Red Tomatoes', category: 'Nightshades', price: '40.00', quantity: 150, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80' },
          { vegetable_id: 902, vegetable_name: 'Organic Spinach (Palak)', category: 'Leafy Greens', price: '25.00', quantity: 80, image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&auto=format&fit=crop&q=80' },
          { vegetable_id: 903, vegetable_name: 'Fresh Lady Finger (Bhindi)', category: 'Pods & Beans', price: '30.00', quantity: 9, image: 'https://images.unsplash.com/photo-1628773822503-930a858597c5?w=400&auto=format&fit=crop&q=80' }
        ];
      }

      // If farmer has no orders yet, populate sample orders data
      if (ordData.length === 0) {
        ordData = [
          {
            order_id: 101,
            customer_name: 'Priya Verma',
            customer_phone: '9812345678',
            farmer_total: 185.00,
            status: 'Order Placed',
            items: [{ vegetable_name: 'Fresh Lady Finger (Bhindi)', quantity: 2, price: '30.00' }, { vegetable_name: 'Fresh Red Tomatoes', quantity: 3, price: '40.00' }]
          },
          {
            order_id: 102,
            customer_name: 'Amit Kulkarni',
            customer_phone: '9822055667',
            farmer_total: 210.00,
            status: 'Delivered',
            items: [{ vegetable_name: 'Organic Spinach (Palak)', quantity: 3, price: '25.00' }]
          },
          {
            order_id: 103,
            customer_name: 'Sneha Shinde',
            customer_phone: '9765123490',
            farmer_total: 160.00,
            status: 'Packed',
            items: [{ vegetable_name: 'Fresh Red Tomatoes', quantity: 4, price: '40.00' }]
          }
        ];
      }

      setVegetables(vegData);
      setOrders(ordData);

      // Initialize stock editing input state
      const initialStock = {};
      vegData.forEach(v => {
        initialStock[v.vegetable_id] = v.quantity;
      });
      setEditingStockValues(initialStock);
    } catch (err) {
      console.error('Error fetching farmer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('freshfarm_lang') || i18n.language || 'en';
    if (i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
    if (user) {
      loadFarmerData();
      setFarmerProfile({
        name: user.name || 'Ramesh Patil',
        phone: user.phone || '9822012345',
        village: user.village || 'Manchar',
        district: user.district || 'Pune'
      });
    }
  }, [user, i18n]);

  const handleDeleteVeg = async (id) => {
    if (window.confirm('Are you sure you want to remove this vegetable listing from your inventory?')) {
      try {
        await API.delete(`/vegetables/${id}`);
        setVegetables(vegetables.filter(v => v.vegetable_id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete vegetable listing.');
      }
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await API.put(`/orders/status/${orderId}`, { status: newStatus });
      setOrders(orders.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleQuickStockUpdate = async (veg) => {
    const newQty = parseInt(editingStockValues[veg.vegetable_id]);
    if (isNaN(newQty) || newQty < 0) {
      alert('Please enter a valid non-negative stock quantity.');
      return;
    }

    try {
      setUpdatingVegStockId(veg.vegetable_id);
      await API.put(`/vegetables/${veg.vegetable_id}`, {
        vegetable_name: veg.vegetable_name,
        category: veg.category,
        description: veg.description || '',
        price: veg.price,
        quantity: newQty
      });
      setVegetables(vegetables.map(v => v.vegetable_id === veg.vegetable_id ? { ...v, quantity: newQty } : v));
      alert(`✅ Stock for ${veg.vegetable_name} updated to ${newQty} kg!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update stock.');
    } finally {
      setUpdatingVegStockId(null);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsEditingProfile(false);
    setProfileMessage(t('farmerDashboard.profileUpdated'));
    setTimeout(() => setProfileMessage(''), 3000);
  };

  if (loading) return <LoadingSpinner message={t('common.loading')} />;

  // Statistics Calculations
  const totalProducts = vegetables.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((acc, curr) => acc + (parseFloat(curr.farmer_total) || 0), 0);
  const lowStockItems = vegetables.filter(v => parseInt(v.quantity) < 20);

  // Weekly Revenue Chart Data
  const weeklySalesData = [
    { day: 'Mon', revenue: 420 },
    { day: 'Tue', revenue: 680 },
    { day: 'Wed', revenue: 510 },
    { day: 'Thu', revenue: 890 },
    { day: 'Fri', revenue: 1100 },
    { day: 'Sat', revenue: 1350 },
    { day: 'Sun', revenue: totalRevenue > 0 ? totalRevenue : 1600 }
  ];

  return (
    <div style={{ width: '100%', background: '#f4f7f5', minHeight: '100vh', paddingBottom: '60px' }}>
      
      {/* FARMER DASHBOARD HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #065F46 0%, #0B6B3A 100%)',
        color: '#ffffff',
        padding: '24px 0 28px 0',
        marginBottom: '30px',
        boxShadow: '0 4px 20px rgba(11, 107, 58, 0.15)'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.18)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '800', marginBottom: '6px' }}>
              <ShieldCheck size={14} /> {t('farmerDashboard.portalTag')}
            </div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: '900', fontFamily: 'Poppins', margin: 0 }}>
              {activeTab === 'dashboard' && t('farmerDashboard.overview')}
              {activeTab === 'products' && t('farmerDashboard.myProduceListings')}
              {activeTab === 'orders' && t('farmerDashboard.customerOrdersMgmt')}
              {activeTab === 'inventory' && t('farmerDashboard.inventoryStockControl')}
              {activeTab === 'profile' && t('farmerDashboard.profileSettings')}
            </h1>
            <p style={{ fontSize: '0.88rem', opacity: 0.9, marginTop: '4px', margin: 0 }}>
              {t('farmerDashboard.farmerLabel')} <b>{farmerProfile.name}</b> ({farmerProfile.village}, {farmerProfile.district})
            </p>
          </div>

          <div>
            <Link
              to="/farmer/add-vegetable"
              className="btn"
              style={{
                background: '#ffffff',
                color: '#0B6B3A',
                padding: '10px 20px',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={16} /> {t('farmerDashboard.addProduce')}
            </Link>
          </div>
        </div>
      </div>

      <div className="container">
        
        {/* ========================================================================= */}
        {/* TAB 1: DASHBOARD (STATISTICS, REVENUE, LOW STOCK ALERTS, TODAY'S ORDERS) */}
        {/* ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Top Statistic Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              
              <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '4px solid #0B6B3A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('farmerDashboard.totalProducts')}</span>
                  <div style={{ fontSize: '2.1rem', fontWeight: '900', color: '#0f172a', marginTop: '4px', fontFamily: 'Poppins' }}>{totalProducts}</div>
                  <span style={{ fontSize: '0.78rem', color: '#0B6B3A', fontWeight: '700' }}>{t('farmerDashboard.activeListings')}</span>
                </div>
                <div style={{ background: '#e6f4ea', color: '#0B6B3A', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={24} />
                </div>
              </div>

              <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '4px solid #0284c7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('farmerDashboard.ordersReceived')}</span>
                  <div style={{ fontSize: '2.1rem', fontWeight: '900', color: '#0f172a', marginTop: '4px', fontFamily: 'Poppins' }}>{totalOrders}</div>
                  <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: '700' }}>{t('farmerDashboard.customerOrders')}</span>
                </div>
                <div style={{ background: '#e0f2fe', color: '#0284c7', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={24} />
                </div>
              </div>

              <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '4px solid #16A34A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('farmerDashboard.totalRevenue')}</span>
                  <div style={{ fontSize: '2.1rem', fontWeight: '900', color: '#0B6B3A', marginTop: '4px', fontFamily: 'Poppins' }}>₹{totalRevenue.toFixed(2)}</div>
                  <span style={{ fontSize: '0.78rem', color: '#16A34A', fontWeight: '700' }}>{t('farmerDashboard.directPayout')}</span>
                </div>
                <div style={{ background: '#dcfce7', color: '#16A34A', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IndianRupee size={24} />
                </div>
              </div>

              <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '4px solid #ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('farmerDashboard.lowStockItems')}</span>
                  <div style={{ fontSize: '2.1rem', fontWeight: '900', color: '#dc2626', marginTop: '4px', fontFamily: 'Poppins' }}>{lowStockItems.length}</div>
                  <span style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: '700' }}>{t('farmerDashboard.stockAlert')}</span>
                </div>
                <div style={{ background: '#fef2f2', color: '#ef4444', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={24} />
                </div>
              </div>

            </div>

            {/* Sales Overview & Low Stock Alerts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
              
              {/* Revenue Chart */}
              <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0f172a', marginBottom: '16px', fontFamily: 'Poppins' }}>
                  {t('farmerDashboard.weeklyRevenue')}
                </h3>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklySalesData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0B6B3A" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#0B6B3A" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip formatter={(val) => [`₹${val}`, t('farmerDashboard.totalRevenue')]} />
                      <Area type="monotone" dataKey="revenue" stroke="#0B6B3A" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Poppins' }}>
                    <AlertTriangle size={18} color="#dc2626" /> {t('farmerDashboard.lowStockAlerts')}
                  </h3>
                  <button onClick={() => setSearchParams({ tab: 'inventory' })} className="btn btn-outline btn-sm">
                    {t('farmerDashboard.manageStockBtn')}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {lowStockItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#16a34a', fontWeight: '700' }}>
                      <CheckCircle2 size={36} style={{ marginBottom: '8px' }} />
                      <div>{t('farmerDashboard.allStocked')}</div>
                    </div>
                  ) : (
                    lowStockItems.map((item) => (
                      <div key={item.vegetable_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                        <div>
                          <div style={{ fontWeight: '800', color: '#0f172a' }}>{tVegName(t, item.vegetable_name)}</div>
                          <span style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: '700' }}>{t('farmerDashboard.onlyKgLeft', { count: item.quantity })}</span>
                        </div>
                        <Link to={`/farmer/edit-vegetable/${item.vegetable_id}`} className="btn btn-danger btn-sm">
                          {t('farmerDashboard.restock')}
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Today's Orders Summary */}
            <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0f172a', fontFamily: 'Poppins' }}>
                  {t('farmerDashboard.todaysReceivedOrders')}
                </h3>
                <button onClick={() => setSearchParams({ tab: 'orders' })} className="btn btn-primary btn-sm" style={{ background: '#0B6B3A' }}>
                  {t('farmerDashboard.viewAllOrders', { count: orders.length })}
                </button>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('farmerDashboard.orderId')}</th>
                      <th>{t('farmerDashboard.customerName')}</th>
                      <th>{t('farmerDashboard.produceItems')}</th>
                      <th>{t('farmerDashboard.orderAmount')}</th>
                      <th>{t('farmerDashboard.orderStatus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                          {t('farmerDashboard.noOrdersToday')}
                        </td>
                      </tr>
                    ) : (
                      orders.slice(0, 5).map((ord) => (
                        <tr key={ord.order_id}>
                          <td style={{ fontWeight: '800' }}>#{ord.order_id}</td>
                          <td>
                            <div style={{ fontWeight: '800', color: '#0f172a' }}>{ord.customer_name}</div>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>📞 {ord.customer_phone}</span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>
                              {ord.items.map(i => `${tVegName(t, i.vegetable_name)} (${i.quantity} ${t('common.kg', 'kg')})`).join(', ')}
                            </div>
                          </td>
                          <td style={{ fontWeight: '900', color: '#0B6B3A' }}>
                            ₹{parseFloat(ord.farmer_total || 0).toFixed(2)}
                          </td>
                          <td>
                            <span className={`badge ${ord.status === 'Delivered' ? 'badge-green' : 'badge-yellow'}`}>
                              {ord.status ? t(`status.${ord.status === 'Order Placed' ? 'placed' : ord.status === 'Out for Delivery' ? 'outForDelivery' : ord.status.toLowerCase()}`, ord.status) : t('status.placed')}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MY PRODUCTS (VEGETABLE LIST WITH ADD, EDIT, DELETE, UPDATE STOCK) */}
        {/* ========================================================================= */}
        {activeTab === 'products' && (
          <div className="card" style={{ padding: '28px', borderRadius: '20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a', fontFamily: 'Poppins', margin: 0 }}>
                  {t('farmerDashboard.myProductsTitle')}
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  {t('farmerDashboard.myProductsSub')}
                </p>
              </div>
              <Link
                to="/farmer/add-vegetable"
                className="btn"
                style={{ background: '#0B6B3A', color: 'white', padding: '10px 20px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: '800' }}
              >
                {t('farmerDashboard.addNewVegetable')}
              </Link>
            </div>

            {vegetables.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                <Sprout size={40} color="#0B6B3A" style={{ marginBottom: '10px' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>{t('farmerDashboard.noProduceListed')}</h3>
                <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '20px' }}>
                  {t('farmerDashboard.noProduceSub')}
                </p>
                <Link to="/farmer/add-vegetable" className="btn btn-primary" style={{ background: '#0B6B3A' }}>
                  {t('farmerDashboard.addFirstVegetable')}
                </Link>
              </div>
            ) : (
              <div className="grid-3">
                {vegetables.map((veg) => {
                  const stock = parseInt(veg.quantity) || 0;
                  const isLow = stock < 20;

                  return (
                    <div
                      key={veg.vegetable_id}
                      className="card"
                      style={{
                        padding: '16px',
                        borderRadius: '16px',
                        border: isLow ? '1.5px solid #fecaca' : '1px solid #e2e8f0',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between'
                      }}
                    >
                      <div>
                        <img
                          src={getVegImageUrl(veg)}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&auto=format&fit=crop&q=80';
                          }}
                          alt={veg.vegetable_name}
                          style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px' }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Poppins' }}>
                            {tVegName(t, veg.vegetable_name)}
                          </h3>
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: isLow ? '#dc2626' : '#16a34a', background: isLow ? '#fef2f2' : '#f0fdf4', padding: '2px 8px', borderRadius: '6px' }}>
                            {isLow ? t('farmerDashboard.lowStockBadge') : t('farmerDashboard.inStockBadge')}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '10px' }}>
                          {t('farmerDashboard.categoryLabel')} <b>{tCategory(t, veg.category)}</b>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0B6B3A' }}>
                            ₹{parseFloat(veg.price).toFixed(2)} {t('common.perKg', '/ kg')}
                          </span>
                          <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.9rem' }}>
                            {t('farmerDashboard.stockLabel')} <b>{stock} {t('common.kg', 'kg')}</b>
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                        <Link
                          to={`/farmer/edit-vegetable/${veg.vegetable_id}`}
                          className="btn btn-outline btn-sm"
                          style={{ justifyContent: 'center', fontSize: '0.82rem' }}
                        >
                          <Edit size={14} /> {t('common.edit')}
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDeleteVeg(veg.vegetable_id)}
                          className="btn btn-danger btn-sm"
                          style={{ justifyContent: 'center', fontSize: '0.82rem' }}
                        >
                          <Trash2 size={14} /> {t('common.delete')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ORDERS (CUSTOMER ORDERS TABLE WITH DELIVERY STATUS UPDATE) */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="card" style={{ padding: '28px', borderRadius: '20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a', fontFamily: 'Poppins', margin: 0 }}>
                  {t('farmerDashboard.customerOrdersMgmt')}
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  {t('farmerDashboard.myProductsSub')}
                </p>
              </div>
              <span style={{ background: '#e6f4ea', color: '#0B6B3A', fontWeight: '800', fontSize: '0.88rem', padding: '6px 14px', borderRadius: '12px' }}>
                {t('farmerDashboard.totalOrdersCount', { count: orders.length })}
              </span>
            </div>

            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '14px' }}>{t('farmerDashboard.orderId')}</th>
                    <th style={{ padding: '14px' }}>{t('farmerDashboard.customerInfo')}</th>
                    <th style={{ padding: '14px' }}>{t('farmerDashboard.orderedItems')}</th>
                    <th style={{ padding: '14px' }}>{t('farmerDashboard.amount')}</th>
                    <th style={{ padding: '14px' }}>{t('farmerDashboard.deliveryStatusUpdate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                        {t('farmerDashboard.noOrdersYet')}
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord) => (
                      <tr key={ord.order_id}>
                        <td style={{ fontWeight: '800', fontSize: '0.95rem' }}>#{ord.order_id}</td>
                        <td>
                          <div style={{ fontWeight: '800', color: '#0f172a' }}>{ord.customer_name}</div>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>📞 {ord.customer_phone}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.88rem' }}>
                            {ord.items.map(i => {
                              const u = i.quantity_unit || (i.sold_by === 'piece' ? 'piece' : 'kg');
                              const v = i.quantity_value !== undefined ? i.quantity_value : i.quantity;
                              const unitLabel = u === 'piece' ? (v > 1 ? 'pcs' : 'pc') : u;
                              const rescueLabel = i.surplus_listing_id ? ` · Rescue Deal ₹${Number(i.price).toFixed(2)}/${u === 'piece' ? 'pc' : 'kg'}` : '';
                              return `${tVegName(t, i.vegetable_name)} (${v} ${unitLabel}${rescueLabel})`;
                            }).join(', ')}
                          </div>
                        </td>
                        <td style={{ fontWeight: '900', color: '#0B6B3A', fontSize: '1rem' }}>
                          ₹{parseFloat(ord.farmer_total || 0).toFixed(2)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <select
                              value={ord.status || 'Order Placed'}
                              disabled={updatingOrderId === ord.order_id}
                              onChange={(e) => handleUpdateStatus(ord.order_id, e.target.value)}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '10px',
                                border: '1.5px solid #cbd5e1',
                                background: ord.status === 'Delivered' ? '#f0fdf4' : ord.status === 'Cancelled' ? '#fef2f2' : '#ffffff',
                                color: ord.status === 'Delivered' ? '#16a34a' : ord.status === 'Cancelled' ? '#dc2626' : '#0f172a',
                                fontWeight: '700',
                                fontSize: '0.88rem',
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

        {/* ========================================================================= */}
        {/* TAB 4: INVENTORY (STOCK MANAGEMENT & LOW STOCK ALERTS) */}
        {/* ========================================================================= */}
        {activeTab === 'inventory' && (
          <div className="card" style={{ padding: '28px', borderRadius: '20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a', fontFamily: 'Poppins', margin: 0 }}>
                  {t('farmerDashboard.stockMgmtTitle')}
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  {t('farmerDashboard.stockMgmtSub')}
                </p>
              </div>
              <span style={{ background: '#fef2f2', color: '#dc2626', fontWeight: '800', fontSize: '0.85rem', padding: '6px 14px', borderRadius: '12px' }}>
                {t('farmerDashboard.lowStockItems')}: {lowStockItems.length}
              </span>
            </div>

            {/* Inventory Table */}
            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '14px' }}>{t('farmerDashboard.vegetableProduce')}</th>
                    <th style={{ padding: '14px' }}>{t('filter.categoryLabel')}</th>
                    <th style={{ padding: '14px' }}>{t('farmerDashboard.pricePerKg')}</th>
                    <th style={{ padding: '14px' }}>{t('farmerDashboard.stockQuantity')}</th>
                    <th style={{ padding: '14px' }}>{t('farmerDashboard.stockHealth')}</th>
                    <th style={{ padding: '14px' }}>{t('farmerDashboard.quickUpdateStock')}</th>
                  </tr>
                </thead>
                <tbody>
                  {vegetables.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                        {t('farmerDashboard.noVegInventory')}
                      </td>
                    </tr>
                  ) : (
                    vegetables.map((veg) => {
                      const stock = parseInt(veg.quantity) || 0;
                      const isLow = stock < 20;

                      return (
                        <tr key={veg.vegetable_id}>
                          <td style={{ fontWeight: '800', color: '#0f172a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img
                                src={getVegImageUrl(veg)}
                                alt={veg.vegetable_name}
                                style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }}
                              />
                              <span>{tVegName(t, veg.vegetable_name)}</span>
                            </div>
                          </td>
                          <td>{tCategory(t, veg.category)}</td>
                          <td style={{ fontWeight: '800', color: '#0B6B3A' }}>
                            ₹{parseFloat(veg.price).toFixed(2)} / {veg.sold_by === 'piece' ? 'pc' : 'kg'}
                          </td>
                          <td style={{ fontWeight: '900', color: isLow ? '#dc2626' : '#0f172a' }}>
                            {stock} {veg.sold_by === 'piece' ? 'pcs' : t('common.kg', 'kg')}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: isLow ? '#dc2626' : '#16a34a', background: isLow ? '#fef2f2' : '#f0fdf4', padding: '4px 10px', borderRadius: '8px' }}>
                              {isLow ? t('farmerDashboard.lowStockBadge') : t('farmerDashboard.inStockBadge')}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="number"
                                min="0"
                                value={editingStockValues[veg.vegetable_id] ?? veg.quantity}
                                onChange={(e) => setEditingStockValues({ ...editingStockValues, [veg.vegetable_id]: e.target.value })}
                                style={{ width: '80px', padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: '700' }}
                              />
                              <button
                                type="button"
                                disabled={updatingVegStockId === veg.vegetable_id}
                                onClick={() => handleQuickStockUpdate(veg)}
                                className="btn btn-primary btn-sm"
                                style={{ background: '#0B6B3A', padding: '6px 12px', fontSize: '0.78rem' }}
                              >
                                {updatingVegStockId === veg.vegetable_id ? <RefreshCw size={14} className="spin-icon" /> : <Save size={14} />}
                                {t('farmerDashboard.saveStock')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: PROFILE (FARMER INFORMATION AND EDIT PROFILE) */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && (
          <div className="card" style={{ padding: '28px', borderRadius: '20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#e6f4ea', color: '#0B6B3A', width: '46px', height: '46px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a', fontFamily: 'Poppins', margin: 0 }}>
                    {t('farmerDashboard.profileTitle')}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                    {t('farmerDashboard.profileSub')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="btn btn-outline"
                style={{ fontSize: '0.88rem', fontWeight: '800', padding: '8px 16px', borderRadius: '10px' }}
              >
                <Edit3 size={15} /> {isEditingProfile ? t('farmerDashboard.cancelEditing') : t('farmerDashboard.editProfile')}
              </button>
            </div>

            {profileMessage && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px 14px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: '700', marginBottom: '16px' }}>
                {profileMessage}
              </div>
            )}

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">{t('farmerDashboard.fullName')}</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={farmerProfile.name}
                    onChange={(e) => setFarmerProfile({ ...farmerProfile, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('farmerDashboard.phoneNumber')}</label>
                  <input
                    type="tel"
                    required
                    className="form-control"
                    value={farmerProfile.phone}
                    onChange={(e) => setFarmerProfile({ ...farmerProfile, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('farmerDashboard.village')}</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={farmerProfile.village}
                    onChange={(e) => setFarmerProfile({ ...farmerProfile, village: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('farmerDashboard.district')}</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={farmerProfile.district}
                    onChange={(e) => setFarmerProfile({ ...farmerProfile, district: e.target.value })}
                  />
                </div>

                <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
                  <button type="submit" className="btn btn-primary" style={{ background: '#0B6B3A', padding: '10px 24px', borderRadius: '10px' }}>
                    {t('farmerDashboard.saveProfileChanges')}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('farmerDashboard.farmerName')}</span>
                  <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.05rem', marginTop: '2px' }}>{farmerProfile.name}</div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('farmerDashboard.phoneNumber')}</span>
                  <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.05rem', marginTop: '2px' }}>📞 {farmerProfile.phone}</div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('farmerDashboard.village')}</span>
                  <div style={{ fontWeight: '800', color: '#0B6B3A', fontSize: '1.05rem', marginTop: '2px' }}>🏡 {farmerProfile.village}</div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('farmerDashboard.district')}</span>
                  <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.05rem', marginTop: '2px' }}>📍 {farmerProfile.district}</div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default FarmerDashboard;
