const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, isCustomer, isFarmer, isFarmerOrAdmin } = require('../middleware/auth');

// Customer Order Routes
router.post('/', verifyToken, isCustomer, orderController.createOrder);
router.get('/customer/history', verifyToken, isCustomer, orderController.getCustomerOrders);

// Farmer Order Routes
router.get('/farmer/orders', verifyToken, isFarmer, orderController.getFarmerOrders);
router.put('/customer/edit/:id', verifyToken, isCustomer, orderController.editOrder);

// Delivery & Order Status Updates (Farmer or Admin)
router.put('/status/:id', verifyToken, isFarmerOrAdmin, orderController.updateOrderStatus);

// General Order Details (Any authenticated user associated)
router.get('/:id', verifyToken, orderController.getOrderById);

module.exports = router;
