import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatbotWidget from './components/ChatbotWidget';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import HowItWorksPage from './pages/HowItWorksPage';
import ContactPage from './pages/ContactPage';
import FaqPage from './pages/FaqPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

import FarmerRegister from './pages/FarmerRegister';
import FarmerLogin from './pages/FarmerLogin';
import CustomerRegister from './pages/CustomerRegister';
import CustomerLogin from './pages/CustomerLogin';
import AdminLogin from './pages/AdminLogin';

import FarmerDashboard from './pages/FarmerDashboard';
import AddVegetable from './pages/AddVegetable';
import EditVegetable from './pages/EditVegetable';

import VegetableListing from './pages/VegetableListing';
import ShoppingCart from './pages/ShoppingCart';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderHistory from './pages/OrderHistory';
import DeliveryTracking from './pages/DeliveryTracking';

import AdminDashboard from './pages/AdminDashboard';
import FarmerManagement from './pages/FarmerManagement';
import CustomerManagement from './pages/CustomerManagement';
import OrderManagement from './pages/OrderManagement';
import ProductReviewsPage from './pages/ProductReviewsPage';
import FarmerRescue from './pages/FarmerRescue';
import RescueDeals from './pages/RescueDeals';
import NgoRescuePortal from './pages/NgoRescuePortal';
import AdminRescueApprovals from './pages/AdminRescueApprovals';

// Automatic route language synchronizer for SPA page transitions
const RouteLanguageSync = () => {
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const savedLang = localStorage.getItem('freshfarm_lang') || i18n.language || 'en';
    if (i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [location.pathname, location.search, i18n]);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <RouteLanguageSync />
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Pages */}
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/faqs" element={<FaqPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/vegetables" element={<VegetableListing />} />
                <Route path="/rescue-deals" element={<ProtectedRoute allowedRoles={['customer']}><RescueDeals /></ProtectedRoute>} />
                <Route path="/ngo/rescue" element={<NgoRescuePortal />} />
                <Route path="/product/:id/reviews" element={<ProductReviewsPage />} />

                {/* Auth Pages */}
                <Route path="/register/farmer" element={<FarmerRegister />} />
                <Route path="/login/farmer" element={<FarmerLogin />} />
                <Route path="/register/customer" element={<CustomerRegister />} />
                <Route path="/login/customer" element={<CustomerLogin />} />
                <Route path="/login/admin" element={<AdminLogin />} />

                {/* Customer Routes */}
                <Route path="/cart" element={<ShoppingCart />} />
                <Route path="/checkout" element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CheckoutPage />
                  </ProtectedRoute>
                } />
                <Route path="/order-success/:id" element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <OrderSuccessPage />
                  </ProtectedRoute>
                } />
                <Route path="/customer/orders" element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <OrderHistory />
                  </ProtectedRoute>
                } />
                <Route path="/delivery-tracking/:id" element={
                  <ProtectedRoute allowedRoles={['customer', 'farmer', 'admin']}>
                    <DeliveryTracking />
                  </ProtectedRoute>
                } />

                {/* Farmer Protected Routes */}
                <Route path="/farmer/dashboard" element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <FarmerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/farmer/rescue" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerRescue /></ProtectedRoute>} />
                <Route path="/farmer/add-vegetable" element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <AddVegetable />
                  </ProtectedRoute>
                } />
                <Route path="/farmer/edit-vegetable/:id" element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <EditVegetable />
                  </ProtectedRoute>
                } />

                {/* Admin Protected Routes */}
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/rescue-ngos" element={<ProtectedRoute allowedRoles={['admin']}><AdminRescueApprovals /></ProtectedRoute>} />
                <Route path="/admin/farmers" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <FarmerManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/customers" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <CustomerManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/orders" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <OrderManagement />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>

            {/* Floating Gemini AI Chatbot */}
            <ChatbotWidget />

            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
