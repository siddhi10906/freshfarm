const db = require('../config/db');

// 1. Admin Dashboard Analytics Summary (Live MySQL Counts)
exports.getAdminDashboard = async (req, res) => {
    try {
        const [farmerRows] = await db.query('SELECT COUNT(*) AS count FROM farmers');
        const [customerRows] = await db.query('SELECT COUNT(*) AS count FROM customers');
        const [vegRows] = await db.query('SELECT COUNT(*) AS count FROM vegetables');
        const [orderRows] = await db.query('SELECT COUNT(*) AS count FROM orders');
        const [pendingRows] = await db.query('SELECT COUNT(*) AS count FROM orders WHERE status = "Pending" OR status = "Out for Delivery" OR status = "Order Placed" OR status = "Packed" OR status = "Shipped"');
        const [revenueRows] = await db.query('SELECT IFNULL(SUM(total_amount), 0) AS total FROM orders WHERE status != "Cancelled"');

        const totalFarmers = parseInt(farmerRows[0]?.count || 0);
        const totalCustomers = parseInt(customerRows[0]?.count || 0);
        const totalVegetables = parseInt(vegRows[0]?.count || 0);
        const totalOrders = parseInt(orderRows[0]?.count || 0);
        const pendingDeliveries = parseInt(pendingRows[0]?.count || 0);
        const rawRev = revenueRows[0]?.total || 0;
        const totalRevenue = Number(parseFloat(rawRev).toFixed(2)) || 0;

        res.status(200).json({
            stats: {
                totalFarmers,
                totalCustomers,
                totalVegetables,
                totalOrders,
                pendingDeliveries,
                totalRevenue
            }
        });
    } catch (err) {
        console.error('Error fetching admin dashboard analytics:', err);
        res.status(500).json({ message: 'Server error fetching analytics.' });
    }
};

// 2. Manage Farmers List (Live MySQL Data)
exports.getAllFarmers = async (req, res) => {
    try {
        const [farmers] = await db.query(`
            SELECT f.farmer_id, f.full_name, f.email, f.phone, f.village, f.district, f.created_at,
                   COUNT(v.vegetable_id) AS total_vegetables
            FROM farmers f
            LEFT JOIN vegetables v ON f.farmer_id = v.farmer_id
            GROUP BY f.farmer_id
            ORDER BY f.created_at DESC
        `);
        res.status(200).json(farmers);
    } catch (err) {
        console.error('Error fetching farmers:', err);
        res.status(500).json({ message: 'Server error fetching farmers list.' });
    }
};

// Update / Edit Farmer Profile (Admin)
exports.updateFarmer = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, phone, village, district } = req.body;
        await db.query(
            'UPDATE farmers SET full_name = ?, phone = ?, village = ?, district = ? WHERE farmer_id = ?',
            [full_name, phone, village, district, id]
        );
        res.status(200).json({ message: 'Farmer account updated successfully!' });
    } catch (err) {
        console.error('Error updating farmer:', err);
        res.status(500).json({ message: 'Server error updating farmer.' });
    }
};

// Delete / Deactivate Farmer Account
exports.deleteFarmer = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM farmers WHERE farmer_id = ?', [id]);
        res.status(200).json({ message: 'Farmer account deactivated and removed successfully.' });
    } catch (err) {
        console.error('Error deleting farmer:', err);
        res.status(500).json({ message: 'Server error deleting farmer.' });
    }
};

// 3. Manage Customers List (Live MySQL Data)
exports.getAllCustomers = async (req, res) => {
    try {
        const [customers] = await db.query(`
            SELECT c.customer_id, c.full_name, c.email, c.phone, c.address, c.city, c.pincode, c.created_at,
                   COUNT(o.order_id) AS total_orders
            FROM customers c
            LEFT JOIN orders o ON c.customer_id = o.customer_id
            GROUP BY c.customer_id
            ORDER BY c.created_at DESC
        `);
        res.status(200).json(customers);
    } catch (err) {
        console.error('Error fetching customers:', err);
        res.status(500).json({ message: 'Server error fetching customers list.' });
    }
};

// Update Customer Details (Admin)
exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, phone, address, city, pincode } = req.body;
        await db.query(
            'UPDATE customers SET full_name = ?, phone = ?, address = ?, city = ?, pincode = ? WHERE customer_id = ?',
            [full_name, phone, address, city, pincode, id]
        );
        res.status(200).json({ message: 'Customer account updated successfully!' });
    } catch (err) {
        console.error('Error updating customer:', err);
        res.status(500).json({ message: 'Server error updating customer.' });
    }
};

// Delete Customer Account
exports.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM customers WHERE customer_id = ?', [id]);
        res.status(200).json({ message: 'Customer account deactivated and removed successfully.' });
    } catch (err) {
        console.error('Error deleting customer:', err);
        res.status(500).json({ message: 'Server error deleting customer.' });
    }
};

// 4. Manage All Vegetables (Admin)
exports.getAllVegetables = async (req, res) => {
    try {
        const [vegetables] = await db.query(`
            SELECT v.*, f.full_name AS farmer_name, f.village, f.district
            FROM vegetables v
            JOIN farmers f ON v.farmer_id = f.farmer_id
            ORDER BY v.vegetable_id DESC
        `);
        res.status(200).json(vegetables);
    } catch (err) {
        console.error('Error fetching all vegetables:', err);
        res.status(500).json({ message: 'Server error fetching vegetables.' });
    }
};

// Update Vegetable Listing (Admin)
exports.updateVegetable = async (req, res) => {
    try {
        const { id } = req.params;
        const { vegetable_name, category, price, quantity } = req.body;
        await db.query(
            'UPDATE vegetables SET vegetable_name = ?, category = ?, price = ?, quantity = ? WHERE vegetable_id = ?',
            [vegetable_name, category, parseFloat(price), parseInt(quantity), id]
        );
        res.status(200).json({ message: 'Vegetable listing updated successfully!' });
    } catch (err) {
        console.error('Error updating vegetable:', err);
        res.status(500).json({ message: 'Server error updating vegetable.' });
    }
};

// Delete Incorrect Vegetable Listing (Admin)
exports.deleteVegetable = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM vegetables WHERE vegetable_id = ?', [id]);
        res.status(200).json({ message: 'Product listing removed successfully.' });
    } catch (err) {
        console.error('Error deleting vegetable:', err);
        res.status(500).json({ message: 'Server error deleting product listing.' });
    }
};

// 5. Manage All Orders (Admin)
exports.getAllOrders = async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT o.*, c.full_name AS customer_name, c.email AS customer_email, c.phone AS customer_phone
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            ORDER BY o.order_date DESC
        `);

        for (let order of orders) {
            const [items] = await db.query(`
                SELECT oi.*, v.vegetable_name, f.full_name AS farmer_name
                FROM order_items oi
                JOIN vegetables v ON oi.vegetable_id = v.vegetable_id
                JOIN farmers f ON v.farmer_id = f.farmer_id
                WHERE oi.order_id = ?
            `, [order.order_id]);
            order.items = items;
        }

        res.status(200).json(orders);
    } catch (err) {
        console.error('Error fetching all orders:', err);
        res.status(500).json({ message: 'Server error fetching admin orders.' });
    }
};

// Update Order Delivery Status (Admin Platform Management)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await db.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, id]);
        
        const [existing] = await db.query('SELECT delivery_id FROM delivery_status WHERE order_id = ?', [id]);
        if (existing.length > 0) {
            await db.query('UPDATE delivery_status SET current_status = ? WHERE order_id = ?', [status, id]);
        } else {
            await db.query('INSERT INTO delivery_status (order_id, current_status) VALUES (?, ?)', [id, status]);
        }

        res.status(200).json({ message: 'Order delivery status updated successfully by Admin!' });
    } catch (err) {
        console.error('Error updating order status by admin:', err);
        res.status(500).json({ message: 'Server error updating order status.' });
    }
};
