const db = require('../config/db');

// Helper: Calculate item total and kg-equivalent stock needed
function calculateItemPricing(price, unit, value) {
    const val = parseFloat(value) || 1;
    const u = unit || 'kg';
    let kgEq = val;
    let itemTotal = 0;

    if (u === 'g') {
        kgEq = val / 1000;
        itemTotal = (parseFloat(price) * val) / 1000;
    } else {
        kgEq = val;
        itemTotal = parseFloat(price) * val;
    }

    return {
        kgEq,
        itemTotal: parseFloat(itemTotal.toFixed(2))
    };
}

// 1. Get Customer Cart Items
exports.getCart = async (req, res) => {
    try {
        const customer_id = req.user.id;
        const [cartItems] = await db.query(
            `SELECT c.cart_id, c.quantity, c.quantity_unit, c.quantity_value, c.created_at,
                    v.vegetable_id, v.vegetable_name, v.category, v.price, v.sold_by, c.surplus_listing_id,
                    v.quantity AS available_stock, v.image,
                    f.full_name AS farmer_name, s.discounted_price AS rescue_price,
                    s.original_price AS rescue_original_price, s.quantity_remaining AS rescue_stock, s.deadline AS rescue_deadline
             FROM cart c
             JOIN vegetables v ON c.vegetable_id = v.vegetable_id
             JOIN farmers f ON v.farmer_id = f.farmer_id
             LEFT JOIN surplus_listings s ON s.listing_id = c.surplus_listing_id
             WHERE c.customer_id = ?`,
            [customer_id]
        );

        let subtotal = 0;
        cartItems.forEach(item => {
            const unit = item.quantity_unit || (item.sold_by === 'piece' ? 'piece' : item.sold_by === 'dozen' ? 'dozen' : 'kg');
            const val = parseFloat(item.quantity_value) || parseFloat(item.quantity) || 1;
            const activeRescue = item.surplus_listing_id && item.rescue_price != null;
            const { kgEq, itemTotal } = calculateItemPricing(activeRescue ? item.rescue_price : item.price, unit, val);
            item.quantity_unit = unit;
            item.quantity_value = val;
            item.is_rescue_deal = Boolean(activeRescue);
            if (activeRescue) {
                item.original_price = item.rescue_original_price;
                item.price = Number(item.rescue_price);
                item.available_stock = Number(item.rescue_stock);
            }
            item.item_total = itemTotal;
            subtotal += itemTotal;
        });

        const gst = 0; // 0% GST on raw agricultural produce
        const deliveryCharge = subtotal >= 199 || subtotal === 0 ? 0 : 15; // FREE over ₹199
        const grandTotal = subtotal + gst + deliveryCharge;

        res.status(200).json({
            items: cartItems,
            subtotal: parseFloat(subtotal.toFixed(2)),
            gst: parseFloat(gst.toFixed(2)),
            deliveryCharge: parseFloat(deliveryCharge.toFixed(2)),
            grandTotal: parseFloat(grandTotal.toFixed(2))
        });
    } catch (err) {
        console.error('Error fetching cart:', err);
        res.status(500).json({ message: 'Server error while fetching cart.' });
    }
};

// Add a rescue listing to the existing cart. One cart row per vegetable is enforced by the legacy schema.
exports.addRescueToCart = async (req, res) => {
    try {
        const customer_id = req.user.id;
        const listingId = Number(req.params.listingId);
        const value = Number(req.body.quantity_value ?? req.body.quantity ?? 1);
        const unit = String(req.body.quantity_unit || 'kg').toLowerCase();
        if (!Number.isFinite(value) || value <= 0 || !['kg', 'g', 'piece', 'dozen'].includes(unit)) {
            return res.status(400).json({ message: 'Enter a valid quantity and unit.' });
        }
        const [rows] = await db.query(
            `SELECT s.*, v.sold_by FROM surplus_listings s JOIN vegetables v ON v.vegetable_id=s.vegetable_id
             WHERE s.listing_id=? AND s.status='active' AND s.deadline>NOW()`, [listingId]
        );
        const listing = rows[0];
        if (!listing) return res.status(404).json({ message: 'Rescue deal is no longer available.' });
        const [customerRows] = await db.query('SELECT city FROM customers WHERE customer_id=?', [customer_id]);
        const city = String(customerRows[0]?.city || '').toLowerCase();
        const locality = String(listing.locality || '').toLowerCase();
        if (!city || !(locality.includes(city) || city.includes(locality))) {
            return res.status(403).json({ message: 'This Rescue Deal is not available in your delivery locality.' });
        }
        if ((listing.sold_by === 'piece' && unit !== 'piece') || (listing.sold_by === 'dozen' && unit !== 'dozen') || (!['piece', 'dozen'].includes(listing.sold_by) && !['kg', 'g'].includes(unit))) return res.status(400).json({ message: 'Quantity unit does not match this product.' });
        const stockQty = unit === 'g' ? value / 1000 : value;
        if (stockQty > Number(listing.quantity_remaining)) return res.status(400).json({ message: 'Requested amount exceeds rescue deal stock.' });
        const [existing] = await db.query('SELECT cart_id, surplus_listing_id, quantity_value FROM cart WHERE customer_id=? AND vegetable_id=?', [customer_id, listing.vegetable_id]);
        if (existing.length && Number(existing[0].surplus_listing_id) !== listingId) {
            return res.status(409).json({ message: 'This vegetable is already in your cart. Remove it before adding its Rescue Deal.' });
        }
        if (existing.length) {
            const next = Number(existing[0].quantity_value) + value;
            if ((unit === 'g' ? next / 1000 : next) > Number(listing.quantity_remaining)) return res.status(400).json({ message: 'Combined quantity exceeds rescue deal stock.' });
            await db.query('UPDATE cart SET quantity=?, quantity_unit=?, quantity_value=? WHERE cart_id=?', [unit === 'g' ? next / 1000 : next, unit, next, existing[0].cart_id]);
        } else {
            await db.query('INSERT INTO cart (customer_id, vegetable_id, quantity, quantity_unit, quantity_value, surplus_listing_id) VALUES (?, ?, ?, ?, ?, ?)', [customer_id, listing.vegetable_id, stockQty, unit, value, listingId]);
        }
        res.status(200).json({ message: 'Rescue Deal added to your cart.' });
    } catch (error) {
        console.error('Add rescue deal to cart:', error);
        res.status(500).json({ message: 'Unable to add this Rescue Deal.' });
    }
};

// 2. Add Item to Cart
exports.addToCart = async (req, res) => {
    try {
        const customer_id = req.user.id;
        const { vegetable_id, quantity, quantity_unit, quantity_value } = req.body;

        // Check if vegetable exists and check stock
        const [veg] = await db.query('SELECT quantity, price, sold_by FROM vegetables WHERE vegetable_id = ?', [vegetable_id]);
        if (veg.length === 0) {
            return res.status(404).json({ message: 'Vegetable not found.' });
        }

        const availableStock = parseFloat(veg[0].quantity);
        const soldBy = veg[0].sold_by || 'weight';
        const unit = quantity_unit || (soldBy === 'piece' ? 'piece' : soldBy === 'dozen' ? 'dozen' : 'kg');
        const val = parseFloat(quantity_value) || parseFloat(quantity) || 1;

        if ((soldBy === 'piece' && unit !== 'piece') || (soldBy === 'dozen' && unit !== 'dozen') || (!['piece', 'dozen'].includes(soldBy) && !['kg', 'g'].includes(unit))) {
            return res.status(400).json({ message: 'Quantity unit does not match this product.' });
        }

        const { kgEq } = calculateItemPricing(veg[0].price, unit, val);

        // Check if already in cart with exact same vegetable and unit
        const [existing] = await db.query(
            'SELECT cart_id, quantity, quantity_value, surplus_listing_id FROM cart WHERE customer_id = ? AND vegetable_id = ? AND quantity_unit = ?',
            [customer_id, vegetable_id, unit]
        );

        if (existing.length > 0) {
            if (existing[0].surplus_listing_id) return res.status(409).json({ message: 'This vegetable is in your cart as a Rescue Deal. Remove it before adding the regular listing.' });
            const newTotalVal = parseFloat(existing[0].quantity_value) + val;
            const { kgEq: newKgEq } = calculateItemPricing(veg[0].price, unit, newTotalVal);

            if (newKgEq > availableStock) {
                const stockLabel = soldBy === 'piece' ? `${availableStock} pieces` : soldBy === 'dozen' ? `${availableStock} dozen` : `${availableStock} kg`;
                return res.status(400).json({ message: `Cannot add more than available stock (${stockLabel} available).` });
            }

            await db.query(
                'UPDATE cart SET quantity = ?, quantity_value = ? WHERE cart_id = ?',
                [newKgEq, newTotalVal, existing[0].cart_id]
            );
            return res.status(200).json({ message: 'Cart quantity updated.' });
        } else {
            if (kgEq > availableStock) {
                const stockLabel = soldBy === 'piece' ? `${availableStock} pieces` : soldBy === 'dozen' ? `${availableStock} dozen` : `${availableStock} kg`;
                return res.status(400).json({ message: `Cannot add more than available stock (${stockLabel} available).` });
            }

            await db.query(
                'INSERT INTO cart (customer_id, vegetable_id, quantity, quantity_unit, quantity_value) VALUES (?, ?, ?, ?, ?)',
                [customer_id, vegetable_id, kgEq, unit, val]
            );
            return res.status(201).json({ message: 'Added to cart successfully.' });
        }
    } catch (err) {
        console.error('Error adding to cart:', err);
        res.status(500).json({ message: 'Server error adding to cart.' });
    }
};

// 3. Update Cart Item Quantity
exports.updateCartQuantity = async (req, res) => {
    try {
        const customer_id = req.user.id;
        const { id } = req.params; // cart_id
        const { quantity, quantity_value, quantity_unit } = req.body;

        // Fetch cart item & vegetable
        const [rows] = await db.query(
            `SELECT c.*, v.quantity AS available_stock, v.price, v.sold_by,
                    s.quantity_remaining AS rescue_stock, s.status AS rescue_status, s.deadline AS rescue_deadline
             FROM cart c JOIN vegetables v ON c.vegetable_id = v.vegetable_id
             LEFT JOIN surplus_listings s ON s.listing_id=c.surplus_listing_id
             WHERE c.cart_id = ? AND c.customer_id = ?`,
            [id, customer_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Cart item not found.' });
        }

        const item = rows[0];
        const unit = quantity_unit || item.quantity_unit || (item.sold_by === 'piece' ? 'piece' : item.sold_by === 'dozen' ? 'dozen' : 'kg');
        if ((item.sold_by === 'piece' && unit !== 'piece') || (item.sold_by === 'dozen' && unit !== 'dozen') || (!['piece', 'dozen'].includes(item.sold_by) && !['kg', 'g'].includes(unit))) {
            return res.status(400).json({ message: 'Quantity unit does not match this product.' });
        }
        const val = parseFloat(quantity_value !== undefined ? quantity_value : quantity);

        if (val <= 0) {
            await db.query('DELETE FROM cart WHERE cart_id = ? AND customer_id = ?', [id, customer_id]);
            return res.status(200).json({ message: 'Item removed from cart.' });
        }

        const { kgEq } = calculateItemPricing(item.price, unit, val);
        if (item.surplus_listing_id && (item.rescue_status !== 'active' || new Date(item.rescue_deadline) <= new Date())) {
            return res.status(400).json({ message: 'This Rescue Deal is no longer available.' });
        }
        const availableStock = parseFloat(item.surplus_listing_id ? item.rescue_stock : item.available_stock);

        if (kgEq > availableStock) {
            const stockLabel = item.sold_by === 'piece' ? `${availableStock} pieces` : item.sold_by === 'dozen' ? `${availableStock} dozen` : `${availableStock} kg`;
            return res.status(400).json({ message: `Quantity exceeds available stock (${stockLabel} available).` });
        }

        await db.query(
            'UPDATE cart SET quantity = ?, quantity_unit = ?, quantity_value = ? WHERE cart_id = ?',
            [kgEq, unit, val, id]
        );
        res.status(200).json({ message: 'Cart quantity updated.' });
    } catch (err) {
        console.error('Error updating cart quantity:', err);
        res.status(500).json({ message: 'Server error updating cart.' });
    }
};

// 4. Remove Item from Cart
exports.removeFromCart = async (req, res) => {
    try {
        const customer_id = req.user.id;
        const { id } = req.params;

        await db.query('DELETE FROM cart WHERE cart_id = ? AND customer_id = ?', [id, customer_id]);
        res.status(200).json({ message: 'Item removed from cart.' });
    } catch (err) {
        console.error('Error removing from cart:', err);
        res.status(500).json({ message: 'Server error removing cart item.' });
    }
};

// 5. Clear Cart
exports.clearCart = async (req, res) => {
    try {
        const customer_id = req.user.id;
        await db.query('DELETE FROM cart WHERE customer_id = ?', [customer_id]);
        res.status(200).json({ message: 'Cart cleared successfully.' });
    } catch (err) {
        console.error('Error clearing cart:', err);
        res.status(500).json({ message: 'Server error clearing cart.' });
    }
};
