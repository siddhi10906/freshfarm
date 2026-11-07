const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public Auth Endpoints
router.post('/register/farmer', authController.registerFarmer);
router.post('/login/farmer', authController.loginFarmer);

router.post('/register/customer', authController.registerCustomer);
router.post('/login/customer', authController.loginCustomer);

router.post('/login/admin', authController.loginAdmin);

// Forgot Password Endpoints
router.post('/forgot-password/send-otp', authController.sendOTP);
router.post('/forgot-password/verify-otp', authController.verifyOTP);
router.post('/forgot-password/reset-password', authController.resetPassword);

// Protected Profile Endpoint
router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;
