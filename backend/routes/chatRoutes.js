const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Public AI Chatbot Endpoint
router.post('/', chatController.handleChatMessage);

module.exports = router;
