const express = require('express');
const router = express.Router();
const controller = require('../controllers/rescueController');
const { verifyToken, isCustomer, isCustomerOrNgo, isApprovedNgo, isFarmer, isFarmerOrAdmin, isAdmin } = require('../middleware/auth');

router.get('/deals', verifyToken, isCustomer, controller.customerListings);
router.post('/ngo/apply', controller.publicRegisterNgo);
router.post('/ngo/register', verifyToken, isCustomer, controller.registerNgo);
router.get('/ngo/me', verifyToken, isCustomerOrNgo, controller.myNgo);
router.get('/donations', verifyToken, isApprovedNgo, controller.donationListings);
router.post('/donations/:id/request', verifyToken, isApprovedNgo, controller.requestDonation);
router.get('/tracking', verifyToken, isFarmerOrAdmin, controller.getMetrics);
router.post('/listings', verifyToken, isFarmer, controller.createListing);
router.get('/farmer/listings', verifyToken, isFarmer, controller.farmerListings);
router.get('/farmer/donations', verifyToken, isFarmer, controller.farmerDonationRequests);
router.put('/farmer/donations/:id', verifyToken, isFarmer, controller.decideDonation);
router.get('/admin/ngos', verifyToken, isAdmin, controller.adminNgos);
router.put('/admin/ngos/:id', verifyToken, isAdmin, controller.reviewNgo);

module.exports = router;
