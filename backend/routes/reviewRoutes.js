const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken, isCustomer, isAdmin } = require('../middleware/auth');

// Customer Routes
router.post('/', verifyToken, isCustomer, reviewController.submitReview);
router.get('/customer/submitted', verifyToken, isCustomer, reviewController.getCustomerSubmittedReviews);

// Admin Route
router.get('/admin/all', verifyToken, isAdmin, reviewController.getAllReviewsAdmin);

// Public Route - must come after specific routes to avoid :id catching 'admin' or 'customer'
router.get('/vegetable/:id', reviewController.getVegetableReviews);

module.exports = router;
