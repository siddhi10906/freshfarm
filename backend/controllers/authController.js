const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'freshfarm_super_secret_jwt_key_2026_vit_pune';

// Helper to generate JWT Token
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// 1. Farmer Registration
exports.registerFarmer = async (req, res) => {
    try {
        const { full_name, email, password, phone, village, district } = req.body;

        if (!full_name || !email || !password || !phone || !village || !district) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check if farmer exists
        const [existing] = await db.query('SELECT farmer_id FROM farmers WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Farmer with this email already exists.' });
        }

        // Insert Farmer
        const [result] = await db.query(
            'INSERT INTO farmers (full_name, email, password, phone, village, district) VALUES (?, ?, ?, ?, ?, ?)',
            [full_name, email, password, phone, village, district]
        );

        const newFarmerId = result.insertId;

        // Auto-seed sample produce items for the newly registered farmer
        try {
            await db.query(
                `INSERT INTO vegetables (farmer_id, vegetable_name, category, description, price, quantity, image) VALUES
                 (?, 'Fresh Red Tomatoes', 'Nightshades', 'Organically grown farm-fresh juicy red tomatoes directly from fields.', 40.00, 150, 'tomatoes.jpg'),
                 (?, 'Organic Spinach (Palak)', 'Leafy Greens', 'Crisp, washed, nutrient-rich spinach leaves plucked fresh every morning.', 25.00, 80, 'spinach.jpg'),
                 (?, 'Fresh Lady Finger (Bhindi)', 'Pods & Beans', 'Tender organic lady fingers harvested daily.', 30.00, 9, 'lady_finger.jpg')`,
                [newFarmerId, newFarmerId, newFarmerId]
            );
        } catch (vegErr) {
            console.error('Error seeding initial farmer produce:', vegErr.message);
        }

        const token = generateToken({ id: newFarmerId, role: 'farmer', email, name: full_name });

        res.status(201).json({
            message: 'Farmer registered successfully!',
            token,
            user: { id: newFarmerId, name: full_name, email, role: 'farmer', village, district }
        });
    } catch (err) {
        console.error('Farmer Registration Error:', err);
        res.status(500).json({ message: 'Server error during farmer registration.' });
    }
};

// 2. Farmer Login
exports.loginFarmer = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const [rows] = await db.query('SELECT * FROM farmers WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const farmer = rows[0];
        const isMatch = farmer.password.startsWith('$2a$')
            ? await bcrypt.compare(password, farmer.password)
            : (password === farmer.password);
            
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = generateToken({ id: farmer.farmer_id, role: 'farmer', email: farmer.email, name: farmer.full_name });

        res.status(200).json({
            message: 'Farmer login successful!',
            token,
            user: {
                id: farmer.farmer_id,
                name: farmer.full_name,
                email: farmer.email,
                role: 'farmer',
                phone: farmer.phone,
                village: farmer.village,
                district: farmer.district
            }
        });
    } catch (err) {
        console.error('Farmer Login Error:', err);
        res.status(500).json({ message: 'Server error during farmer login.' });
    }
};

// 3. Customer Registration
exports.registerCustomer = async (req, res) => {
    try {
        const { full_name, email, password, phone, address, city, pincode } = req.body;

        if (!full_name || !email || !password || !phone || !address || !city || !pincode) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const [existing] = await db.query('SELECT customer_id FROM customers WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Customer with this email already exists.' });
        }

        const [result] = await db.query(
            'INSERT INTO customers (full_name, email, password, phone, address, city, pincode) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [full_name, email, password, phone, address, city, pincode]
        );

        const token = generateToken({ id: result.insertId, role: 'customer', email, name: full_name });

        res.status(201).json({
            message: 'Customer registered successfully!',
            token,
            user: { id: result.insertId, name: full_name, email, role: 'customer', address, city, pincode }
        });
    } catch (err) {
        console.error('Customer Registration Error:', err);
        res.status(500).json({ message: 'Server error during customer registration.' });
    }
};

// 4. Customer Login
exports.loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const [rows] = await db.query('SELECT * FROM customers WHERE email = ?', [email]);
        if (rows.length === 0) {
            const [organizations] = await db.query('SELECT * FROM ngo_profiles WHERE LOWER(contact_email)=?', [String(email).trim().toLowerCase()]);
            const organization = organizations[0];
            if (!organization || !organization.password_hash || !(await bcrypt.compare(password, organization.password_hash))) {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }
            if (organization.status !== 'approved') {
                return res.status(403).json({ message: organization.status === 'pending' ? 'Your organization application is awaiting admin approval.' : 'Your organization application was not approved. Contact FreshFarm support.' });
            }
            const token = generateToken({ id: organization.ngo_id, role: 'ngo', email: organization.contact_email, name: organization.organization_name });
            return res.status(200).json({
                message: 'Organization login successful!', token,
                user: { id: organization.ngo_id, ngo_id: organization.ngo_id, name: organization.organization_name, email: organization.contact_email, role: 'ngo' }
            });
        }

        const customer = rows[0];
        const isMatch = customer.password.startsWith('$2')
            ? await bcrypt.compare(password, customer.password)
            : (password === customer.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = generateToken({ id: customer.customer_id, role: 'customer', email: customer.email, name: customer.full_name });

        res.status(200).json({
            message: 'Customer login successful!',
            token,
            user: {
                id: customer.customer_id,
                name: customer.full_name,
                email: customer.email,
                role: 'customer',
                phone: customer.phone,
                address: customer.address,
                city: customer.city,
                pincode: customer.pincode
            }
        });
    } catch (err) {
        console.error('Customer Login Error:', err);
        res.status(500).json({ message: 'Server error during customer login.' });
    }
};

// 5. Admin Login
exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const [rows] = await db.query('SELECT * FROM admin WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid Admin credentials.' });
        }

        const admin = rows[0];
        const isMatch = admin.password.startsWith('$2a$')
            ? await bcrypt.compare(password, admin.password)
            : (password === admin.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Admin credentials.' });
        }

        const token = generateToken({ id: admin.admin_id, role: 'admin', email: admin.email, name: admin.name });

        res.status(200).json({
            message: 'Admin login successful!',
            token,
            user: { id: admin.admin_id, name: admin.name, email: admin.email, role: 'admin' }
        });
    } catch (err) {
        console.error('Admin Login Error:', err);
        res.status(500).json({ message: 'Server error during admin login.' });
    }
};

// 6. Get User Profile
exports.getProfile = async (req, res) => {
    try {
        const { id, role } = req.user;
        let query = '';
        let idColumn = '';

        if (role === 'farmer') {
            query = 'SELECT farmer_id AS id, full_name AS name, email, phone, village, district, created_at FROM farmers WHERE farmer_id = ?';
        } else if (role === 'customer') {
            query = 'SELECT customer_id AS id, full_name AS name, email, phone, address, city, pincode, created_at FROM customers WHERE customer_id = ?';
        } else if (role === 'admin') {
            query = 'SELECT admin_id AS id, name, email, created_at FROM admin WHERE admin_id = ?';
        } else if (role === 'ngo') {
            const [organizations] = await db.query("SELECT ngo_id AS id, organization_name AS name, contact_email AS email, organization_type, service_city FROM ngo_profiles WHERE ngo_id=? AND status='approved'", [id]);
            if (!organizations.length) return res.status(403).json({ message: 'Organization access is not approved.' });
            return res.status(200).json({ user: { ...organizations[0], role: 'ngo' } });
        } else {
            return res.status(400).json({ message: 'Invalid user role.' });
        }

        const [rows] = await db.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User profile not found.' });
        }

        res.status(200).json({ user: { ...rows[0], role } });
    } catch (err) {
        console.error('Get Profile Error:', err);
        res.status(500).json({ message: 'Server error fetching user profile.' });
    }
};

// In-Memory OTP Store: Key -> `${role}:${email.toLowerCase()}` -> { otp, expiresAt }
const otpStore = new Map();

// 7. Send OTP for Forgot Password
exports.sendOTP = async (req, res) => {
    try {
        const { email, role } = req.body;
        if (!email || !role) {
            return res.status(400).json({ message: 'Email and role are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        let query = '';

        if (role === 'farmer') {
            query = 'SELECT farmer_id FROM farmers WHERE LOWER(email) = ?';
        } else if (role === 'customer') {
            query = 'SELECT customer_id FROM customers WHERE LOWER(email) = ?';
        } else if (role === 'admin') {
            query = 'SELECT admin_id FROM admin WHERE LOWER(email) = ?';
        } else {
            return res.status(400).json({ message: 'Invalid role specified.' });
        }

        const [users] = await db.query(query, [normalizedEmail]);
        if (users.length === 0) {
            return res.status(404).json({ message: `No registered ${role} account found with email: ${email}` });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 Minutes Expiry

        const storeKey = `${role}:${normalizedEmail}`;
        otpStore.set(storeKey, { otp, expiresAt });

        console.log(`🔑 [FORGOT PASSWORD OTP] Role: ${role}, Email: ${normalizedEmail}, OTP: ${otp}`);

        res.status(200).json({
            success: true,
            message: `OTP sent successfully. Code expires in 5 minutes.`,
            otp, // Included in response for easy testing
            email: normalizedEmail
        });
    } catch (err) {
        console.error('Send OTP Error:', err);
        res.status(500).json({ message: 'Server error generating OTP.' });
    }
};

// 8. Verify OTP
exports.verifyOTP = async (req, res) => {
    try {
        const { email, role, otp } = req.body;
        if (!email || !role || !otp) {
            return res.status(400).json({ message: 'Email, role, and OTP are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const storeKey = `${role}:${normalizedEmail}`;
        const record = otpStore.get(storeKey);

        if (!record) {
            return res.status(400).json({ message: 'No OTP requested for this email or OTP has expired.' });
        }

        if (Date.now() > record.expiresAt) {
            otpStore.delete(storeKey);
            return res.status(400).json({ message: 'OTP has expired (valid for 5 minutes). Please request a new OTP.' });
        }

        if (record.otp !== otp.toString().trim()) {
            return res.status(400).json({ message: 'Invalid OTP code. Please enter the correct 6-digit OTP.' });
        }

        res.status(200).json({ success: true, message: 'OTP verified successfully.' });
    } catch (err) {
        console.error('Verify OTP Error:', err);
        res.status(500).json({ message: 'Server error verifying OTP.' });
    }
};

// 9. Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { email, role, otp, newPassword } = req.body;
        if (!email || !role || !otp || !newPassword) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const storeKey = `${role}:${normalizedEmail}`;
        const record = otpStore.get(storeKey);

        if (!record || Date.now() > record.expiresAt || record.otp !== otp.toString().trim()) {
            return res.status(400).json({ message: 'OTP verification session expired or invalid. Please restart process.' });
        }

        let updateQuery = '';
        if (role === 'farmer') {
            updateQuery = 'UPDATE farmers SET password = ? WHERE LOWER(email) = ?';
        } else if (role === 'customer') {
            updateQuery = 'UPDATE customers SET password = ? WHERE LOWER(email) = ?';
        } else if (role === 'admin') {
            updateQuery = 'UPDATE admin SET password = ? WHERE LOWER(email) = ?';
        } else {
            return res.status(400).json({ message: 'Invalid role.' });
        }

        await db.query(updateQuery, [newPassword, normalizedEmail]);

        // Remove OTP record from memory
        otpStore.delete(storeKey);

        console.log(`✅ [PASSWORD RESET SUCCESS] Role: ${role}, Email: ${normalizedEmail}`);

        res.status(200).json({
            success: true,
            message: 'Password reset successfully. Please login again.'
        });
    } catch (err) {
        console.error('Reset Password Error:', err);
        res.status(500).json({ message: 'Server error resetting password.' });
    }
};
