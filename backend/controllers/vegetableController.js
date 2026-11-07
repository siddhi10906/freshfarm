const db = require('../config/db');

// 1. Get All Vegetables with Search, Filter & Sorting
exports.getAllVegetables = async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, sort, farmer_id } = req.query;

        let sql = `
            SELECT v.*, f.full_name AS farmer_name, f.village, f.district 
            FROM vegetables v 
            JOIN farmers f ON v.farmer_id = f.farmer_id 
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            sql += ` AND (v.vegetable_name LIKE ? OR v.description LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        if (category && category !== 'All') {
            const catLower = category.toLowerCase();
            if (catLower.includes('tomato')) {
                sql += ` AND v.vegetable_name LIKE '%Tomato%'`;
            } else if (catLower.includes('potato')) {
                sql += ` AND v.vegetable_name LIKE '%Potato%'`;
            } else if (catLower.includes('onion')) {
                sql += ` AND v.vegetable_name LIKE '%Onion%'`;
            } else if (catLower.includes('leafy') || catLower.includes('spinach')) {
                sql += ` AND (v.category LIKE '%Leafy%' OR v.vegetable_name LIKE '%Spinach%' OR v.vegetable_name LIKE '%Palak%')`;
            } else if (catLower.includes('root') || catLower.includes('carrot')) {
                sql += ` AND (v.vegetable_name LIKE '%Carrot%' OR (v.category LIKE '%Root%' AND v.vegetable_name NOT LIKE '%Potato%' AND v.vegetable_name NOT LIKE '%Onion%'))`;
            } else if (catLower.includes('fruit')) {
                sql += ` AND (v.category LIKE '%Fruit%' OR v.vegetable_name LIKE '%Fruit%' OR v.category = 'Fruits')`;
            } else if (catLower.includes('organic')) {
                sql += ` AND (v.category LIKE '%Organic%' OR v.description LIKE '%Organic%' OR v.vegetable_name LIKE '%Organic%')`;
            } else {
                sql += ` AND (v.category = ? OR v.vegetable_name LIKE ?)`;
                params.push(category, `%${category}%`);
            }
        }

        if (farmer_id) {
            sql += ` AND v.farmer_id = ?`;
            params.push(farmer_id);
        }

        if (minPrice) {
            sql += ` AND v.price >= ?`;
            params.push(parseFloat(minPrice));
        }

        if (maxPrice) {
            sql += ` AND v.price <= ?`;
            params.push(parseFloat(maxPrice));
        }

        if (sort === 'price_asc') {
            sql += ` ORDER BY v.price ASC`;
        } else if (sort === 'price_desc') {
            sql += ` ORDER BY v.price DESC`;
        } else if (sort === 'freshest') {
            sql += ` ORDER BY v.created_at DESC`;
        } else {
            sql += ` ORDER BY v.vegetable_id DESC`;
        }

        const [vegetables] = await db.query(sql, params);
        res.status(200).json(vegetables);
    } catch (err) {
        console.error('Error fetching vegetables:', err);
        res.status(500).json({ message: 'Server error while fetching vegetables.' });
    }
};

// 2. Get Single Vegetable Details
exports.getVegetableById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            `SELECT v.*, f.full_name AS farmer_name, f.phone AS farmer_phone, f.village, f.district 
             FROM vegetables v 
             JOIN farmers f ON v.farmer_id = f.farmer_id 
             WHERE v.vegetable_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Vegetable not found.' });
        }

        res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Error fetching vegetable detail:', err);
        res.status(500).json({ message: 'Server error fetching vegetable details.' });
    }
};

// 3. Add New Vegetable (Farmer Only)
exports.addVegetable = async (req, res) => {
    try {
        const farmer_id = req.user.id;
        const { vegetable_name, category, description, price, quantity, sold_by } = req.body;
        const image = req.file ? req.file.filename : 'default-vegetable.jpg';
        const soldByVal = sold_by === 'piece' ? 'piece' : 'weight';

        if (!vegetable_name || !category || !price || quantity === undefined) {
            return res.status(400).json({ message: 'Vegetable name, category, price, and quantity are required.' });
        }

        const [result] = await db.query(
            `INSERT INTO vegetables (farmer_id, vegetable_name, category, description, price, quantity, image, sold_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [farmer_id, vegetable_name, category, description || '', parseFloat(price), parseInt(quantity), image, soldByVal]
        );

        res.status(201).json({
            message: 'Vegetable added successfully!',
            vegetable_id: result.insertId
        });
    } catch (err) {
        console.error('Error adding vegetable:', err);
        res.status(500).json({ message: 'Server error while adding vegetable.' });
    }
};

// 4. Update Vegetable (Farmer or Admin)
exports.updateVegetable = async (req, res) => {
    try {
        const { id } = req.params;
        const { vegetable_name, category, description, price, quantity, sold_by } = req.body;

        // Verify Ownership if Farmer
        if (req.user.role === 'farmer') {
            const [rows] = await db.query('SELECT farmer_id FROM vegetables WHERE vegetable_id = ?', [id]);
            if (rows.length === 0) return res.status(404).json({ message: 'Vegetable not found.' });
            if (rows[0].farmer_id !== req.user.id) {
                return res.status(403).json({ message: 'Unauthorized to modify this vegetable.' });
            }
        }

        const soldByVal = sold_by === 'piece' ? 'piece' : 'weight';
        let sql = `UPDATE vegetables SET vegetable_name = ?, category = ?, description = ?, price = ?, quantity = ?, sold_by = ?`;
        const params = [vegetable_name, category, description, parseFloat(price), parseInt(quantity), soldByVal];

        if (req.file) {
            sql += `, image = ?`;
            params.push(req.file.filename);
        }

        sql += ` WHERE vegetable_id = ?`;
        params.push(id);

        await db.query(sql, params);
        res.status(200).json({ message: 'Vegetable updated successfully!' });
    } catch (err) {
        console.error('Error updating vegetable:', err);
        res.status(500).json({ message: 'Server error while updating vegetable.' });
    }
};

// 5. Delete Vegetable (Farmer or Admin)
exports.deleteVegetable = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role === 'farmer') {
            const [rows] = await db.query('SELECT farmer_id FROM vegetables WHERE vegetable_id = ?', [id]);
            if (rows.length === 0) return res.status(404).json({ message: 'Vegetable not found.' });
            if (rows[0].farmer_id !== req.user.id) {
                return res.status(403).json({ message: 'Unauthorized to delete this vegetable.' });
            }
        }

        await db.query('DELETE FROM vegetables WHERE vegetable_id = ?', [id]);
        res.status(200).json({ message: 'Vegetable deleted successfully!' });
    } catch (err) {
        console.error('Error deleting vegetable:', err);
        res.status(500).json({ message: 'Server error while deleting vegetable.' });
    }
};

// 6. Get Categories List
exports.getCategories = async (req, res) => {
    try {
        const defaultCats = ['Leafy Greens', 'Tomatoes', 'Potatoes', 'Onions', 'Root Vegetables', 'Fruits', 'Organic'];
        const [dbCats] = await db.query('SELECT DISTINCT category FROM vegetables');
        const dbCatNames = dbCats.map(c => c.category);
        const combined = Array.from(new Set([...defaultCats, ...dbCatNames]));
        res.status(200).json(combined);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ message: 'Server error fetching categories.' });
    }
};
