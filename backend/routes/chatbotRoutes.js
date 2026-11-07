const express = require('express');
const router = express.Router();
const { askGreenyAI } = require('../controllers/chatbotController');

// POST /api/chatbot/ask Endpoint
router.post('/ask', askGreenyAI);

module.exports = router;
