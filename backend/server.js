const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const paymentController = require('./controllers/paymentController');
const rescueController = require('./controllers/rescueController');

// Razorpay signs the exact raw webhook body, so mount this before JSON parsing.
app.post('/api/payments/razorpay/webhook', express.raw({ type: 'application/json' }), paymentController.webhook);

// Enable CORS
app.use(cors());

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded Vegetable Images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const vegetableRoutes = require('./routes/vegetableRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const rescueRoutes = require('./routes/rescueRoutes');

// Mount REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/vegetables', vegetableRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/rescue', rescueRoutes);

// Root Route
app.get('/', (req, res) => {
    res.json({
        name: 'FreshFarm API Server',
        version: '1.0.0',
        status: 'Active',
        institution: 'VIT Pune Mini Project'
    });
});

// Global 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ message: 'Requested API endpoint not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err.stack);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// Start Express Server
app.listen(PORT, () => {
    console.log(` FreshFarm Backend Server running on port http://localhost:${PORT}`);
    paymentController.expirePendingAttempts().catch(err => console.error('Payment reservation cleanup error:', err.message));
    rescueController.processDeadlines();
    setInterval(() => {
        paymentController.expirePendingAttempts().catch(err => console.error('Payment reservation cleanup error:', err.message));
    }, 60 * 1000).unref();
    setInterval(() => rescueController.processDeadlines(), 60 * 1000).unref();
});
