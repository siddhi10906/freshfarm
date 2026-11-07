const jwt = require('jsonwebtoken');
const db = require('../config/db');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access Denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'freshfarm_super_secret_jwt_key_2026_vit_pune');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};

const isFarmer = (req, res, next) => {
    if (req.user && req.user.role === 'farmer') {
        next();
    } else {
        return res.status(403).json({ message: 'Forbidden. Farmer access required.' });
    }
};

const isCustomer = (req, res, next) => {
    if (req.user && req.user.role === 'customer') {
        next();
    } else {
        return res.status(403).json({ message: 'Forbidden. Customer access required.' });
    }
};

const isCustomerOrNgo = (req, res, next) => {
    if (req.user && ['customer', 'ngo'].includes(req.user.role)) return next();
    return res.status(403).json({ message: 'Customer or organization access required.' });
};

const isApprovedNgo = async (req, res, next) => {
    try {
        if (!req.user || !['customer', 'ngo'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Approved organization access required.' });
        }
        const [rows] = req.user.role === 'ngo'
            ? await db.query("SELECT * FROM ngo_profiles WHERE ngo_id=? AND status='approved'", [req.user.id])
            : await db.query("SELECT * FROM ngo_profiles WHERE customer_id=? AND status='approved'", [req.user.id]);
        if (!rows.length) return res.status(403).json({ message: 'Your organization must be approved by an admin before accessing donation listings.' });
        req.ngoProfile = rows[0];
        next();
    } catch (error) {
        console.error('NGO approval check failed:', error);
        res.status(500).json({ message: 'Unable to verify organization approval.' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }
};

const isFarmerOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'farmer' || req.user.role === 'admin')) {
        next();
    } else {
        return res.status(403).json({ message: 'Forbidden. Farmer or Admin access required.' });
    }
};

module.exports = {
    verifyToken,
    isFarmer,
    isCustomer,
    isCustomerOrNgo,
    isApprovedNgo,
    isAdmin,
    isFarmerOrAdmin
};
