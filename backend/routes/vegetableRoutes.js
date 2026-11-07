const express = require('express');
const router = express.Router();
const vegetableController = require('../controllers/vegetableController');
const { verifyToken, isFarmerOrAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public Vegetable Routes
router.get('/', vegetableController.getAllVegetables);
router.get('/categories', vegetableController.getCategories);
router.get('/:id', vegetableController.getVegetableById);

// Protected Vegetable Routes (Farmer or Admin)
router.post('/', verifyToken, isFarmerOrAdmin, upload.single('image'), vegetableController.addVegetable);
router.put('/:id', verifyToken, isFarmerOrAdmin, upload.single('image'), vegetableController.updateVegetable);
router.delete('/:id', verifyToken, isFarmerOrAdmin, vegetableController.deleteVegetable);

module.exports = router;
