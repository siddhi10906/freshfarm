const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken, isCustomer } = require('../middleware/auth');

router.post('/razorpay/order', verifyToken, isCustomer, paymentController.createRazorpayOrder);
router.post('/razorpay/verify', verifyToken, isCustomer, paymentController.verifyPayment);
router.post('/razorpay/cancel/:id', verifyToken, isCustomer, paymentController.cancelPayment);

module.exports = router;
