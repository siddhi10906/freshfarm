const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// All Admin Endpoints Require Admin Authentication
router.use(verifyToken, isAdmin);

// 1. Overview
router.get('/dashboard', adminController.getAdminDashboard);

// 2. Manage Farmers
router.get('/farmers', adminController.getAllFarmers);
router.put('/farmers/:id', adminController.updateFarmer);
router.delete('/farmers/:id', adminController.deleteFarmer);

// 3. Manage Customers
router.get('/customers', adminController.getAllCustomers);
router.put('/customers/:id', adminController.updateCustomer);
router.delete('/customers/:id', adminController.deleteCustomer);

// 4. Manage Vegetables
router.get('/vegetables', adminController.getAllVegetables);
router.put('/vegetables/:id', adminController.updateVegetable);
router.delete('/vegetables/:id', adminController.deleteVegetable);

// 5. Manage Orders
router.get('/orders', adminController.getAllOrders);
router.put('/orders/status/:id', adminController.updateOrderStatus);

module.exports = router;
