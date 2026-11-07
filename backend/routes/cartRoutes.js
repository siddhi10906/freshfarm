const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken, isCustomer } = require('../middleware/auth');

// Customer Cart Endpoints
router.use(verifyToken, isCustomer);

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.post('/rescue/:listingId', cartController.addRescueToCart);
router.put('/:id', cartController.updateCartQuantity);
router.delete('/:id', cartController.removeFromCart);
router.delete('/clear/all', cartController.clearCart);

module.exports = router;
