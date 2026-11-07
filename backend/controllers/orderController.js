const db = require('../config/db');

// 1. Create Order (Checkout)
exports.createOrder = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const customer_id = req.user.id;
        const { payment_method, delivery_address } = req.body;

        if (String(payment_method).trim().toLowerCase() !== 'cod') {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ message: 'Online payments must be completed through the payment gateway before an order is placed.' });
        }

        if (!payment_method || !delivery_address) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ message: 'Payment method and delivery address are required.' });
        }

        // Fetch Cart Items
        const [cartItems] = await connection.query(
            `SELECT c.vegetable_id, c.quantity, c.quantity_unit, c.quantity_value, c.surplus_listing_id,
                    v.price, v.sold_by, v.quantity AS available_stock, v.vegetable_name,
                    s.discounted_price AS rescue_price, s.original_price AS rescue_original_price,
                    s.quantity_remaining AS rescue_stock, s.status AS rescue_status, s.deadline AS rescue_deadline
             FROM cart c
             JOIN vegetables v ON c.vegetable_id = v.vegetable_id
             LEFT JOIN surplus_listings s ON s.listing_id=c.surplus_listing_id
             WHERE c.customer_id = ?`,
            [customer_id]
        );

        if (cartItems.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ message: 'Your cart is empty.' });
        }

        // Validate stock availability and calculate subtotal
        let subtotal = 0;
        for (const item of cartItems) {
            const unit = item.quantity_unit || (item.sold_by === 'piece' ? 'piece' : 'kg');
            const val = parseFloat(item.quantity_value) || parseFloat(item.quantity) || 1;
            const kgEq = unit === 'g' ? val / 1000 : val;
            const effectivePrice = item.surplus_listing_id ? Number(item.rescue_price) : Number(item.price);
            const lineTotal = unit === 'g' ? (effectivePrice * val) / 1000 : effectivePrice * val;
            const stockAvailable = item.surplus_listing_id ? Number(item.rescue_stock) : Number(item.available_stock);

            if (item.surplus_listing_id && (item.rescue_status !== 'active' || new Date(item.rescue_deadline) <= new Date())) {
                await connection.rollback(); connection.release();
                return res.status(400).json({ message: `Rescue Deal for ${item.vegetable_name} has expired.` });
            }
            if (kgEq > stockAvailable) {
                await connection.rollback();
                connection.release();
                const stockLabel = item.sold_by === 'piece' ? `${stockAvailable} pieces` : `${stockAvailable} kg`;
                return res.status(400).json({
                    message: `${item.surplus_listing_id ? 'Rescue deal stock' : 'Stock'} insufficient for ${item.vegetable_name}. Available: ${stockLabel}.`
                });
            }
            subtotal += lineTotal;
        }

        // Keep order totals in sync with the checkout/cart summary.
        const grandTotal = Number((subtotal + (subtotal < 199 ? 15 : 0)).toFixed(2));

        const initialOrderStatus = 'Order Placed';

        // Insert Order
        const [orderResult] = await connection.query(
            `INSERT INTO orders (customer_id, total_amount, payment_method, delivery_address, status) 
             VALUES (?, ?, ?, ?, ?)`,
            [customer_id, grandTotal, payment_method, delivery_address, initialOrderStatus]
        );

        const order_id = orderResult.insertId;

        // Insert Order Items & Deduct Stock
        for (const item of cartItems) {
            const unit = item.quantity_unit || (item.sold_by === 'piece' ? 'piece' : 'kg');
            const val = parseFloat(item.quantity_value) || parseFloat(item.quantity) || 1;
            const kgEq = unit === 'g' ? val / 1000 : val;

            await connection.query(
                `INSERT INTO order_items (order_id, vegetable_id, quantity, quantity_unit, quantity_value, price, surplus_listing_id, original_price)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [order_id, item.vegetable_id, kgEq, unit, val,
                    item.surplus_listing_id ? item.rescue_price : item.price,
                    item.surplus_listing_id || null, item.surplus_listing_id ? item.rescue_original_price : null]
            );

            if (item.surplus_listing_id) {
                const [updated] = await connection.query(
                    `UPDATE surplus_listings SET quantity_remaining=quantity_remaining-?, quantity_sold=quantity_sold+?
                     WHERE listing_id=? AND status='active' AND deadline>NOW() AND quantity_remaining>=?`,
                    [kgEq, kgEq, item.surplus_listing_id, kgEq]
                );
                if (!updated.affectedRows) throw new Error(`Rescue deal stock for ${item.vegetable_name} changed. Please refresh your cart.`);
                await connection.query(
                    `INSERT INTO surplus_events (listing_id, actor_role, actor_id, event_type, quantity, details)
                     VALUES (?, 'customer', ?, 'sold_at_discount', ?, ?)`,
                    [item.surplus_listing_id, customer_id, kgEq, `Order #${order_id}`]
                );
                const [left] = await connection.query('SELECT quantity_remaining FROM surplus_listings WHERE listing_id=?', [item.surplus_listing_id]);
                if (Number(left[0].quantity_remaining) <= 0) await connection.query("UPDATE surplus_listings SET status='closed' WHERE listing_id=?", [item.surplus_listing_id]);
            } else {
                await connection.query('UPDATE vegetables SET quantity = quantity - ? WHERE vegetable_id = ?', [kgEq, item.vegetable_id]);
            }
        }

        // Insert Delivery Status Record
        await connection.query(
            `INSERT INTO delivery_status (order_id, current_status) VALUES (?, ?)`,
            [order_id, initialOrderStatus]
        );

        // Clear Customer Cart
        await connection.query('DELETE FROM cart WHERE customer_id = ?', [customer_id]);

        await connection.commit();
        connection.release();

        res.status(201).json({
            message: 'Order placed successfully!',
            order_id,
            total_amount: grandTotal,
            payment_method,
            status: initialOrderStatus
        });
    } catch (err) {
        await connection.rollback();
        connection.release();
        console.error('Create Order Error:', err);
        res.status(500).json({ message: 'Server error while placing order.' });
    }
};

// 2. Get Customer Order History
exports.getCustomerOrders = async (req, res) => {
    try {
        const customer_id = req.user.id;
        // Use a subquery to get only the LATEST delivery_status row per order.
        // Without this, orders with multiple status history rows (e.g. full trail) appear duplicated.
        const [orders] = await db.query(
            `SELECT o.*,
                    ds.current_status AS tracking_status,
                    ds.updated_at     AS last_updated
             FROM orders o
             LEFT JOIN delivery_status ds
               ON ds.delivery_id = (
                   SELECT delivery_id FROM delivery_status
                   WHERE order_id = o.order_id
                   ORDER BY updated_at DESC
                   LIMIT 1
               )
             WHERE o.customer_id = ?
             ORDER BY o.order_date DESC`,
            [customer_id]
        );

        // Fetch Items for each order
        for (let order of orders) {
            const [items] = await db.query(
                `SELECT oi.*, v.vegetable_name, v.category, v.image, v.sold_by, f.full_name AS farmer_name
                 FROM order_items oi
                 JOIN vegetables v ON oi.vegetable_id = v.vegetable_id
                 JOIN farmers f ON v.farmer_id = f.farmer_id
                 WHERE oi.order_id = ?`,
                [order.order_id]
            );
            order.items = items;
        }

        res.status(200).json(orders);
    } catch (err) {
        console.error('Error fetching customer orders:', err);
        res.status(500).json({ message: 'Server error fetching order history.' });
    }
};

// 3. Get Single Order Detail (For PDF Bill & Tracking)
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            `SELECT o.*, c.full_name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
                    ds.current_status AS tracking_status, ds.updated_at AS last_updated
             FROM orders o
             JOIN customers c ON o.customer_id = c.customer_id
             LEFT JOIN delivery_status ds
               ON ds.delivery_id = (
                   SELECT delivery_id FROM delivery_status
                   WHERE order_id = o.order_id
                   ORDER BY updated_at DESC
                   LIMIT 1
               )
             WHERE o.order_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        const order = rows[0];

        const [items] = await db.query(
            `SELECT oi.*, v.vegetable_name, v.category, v.image, v.sold_by, f.full_name AS farmer_name, f.phone AS farmer_phone
             FROM order_items oi
             JOIN vegetables v ON oi.vegetable_id = v.vegetable_id
             JOIN farmers f ON v.farmer_id = f.farmer_id
             WHERE oi.order_id = ?`,
            [id]
        );

        order.items = items;
        res.status(200).json(order);
    } catch (err) {
        console.error('Error fetching order details:', err);
        res.status(500).json({ message: 'Server error fetching order detail.' });
    }
};

// 4. Get Farmer Received Orders
exports.getFarmerOrders = async (req, res) => {
    try {
        const farmer_id = req.user.id;

        const [rows] = await db.query(
            `SELECT DISTINCT o.order_id, o.order_date, o.status, o.delivery_address, o.payment_method,
                    c.full_name AS customer_name, c.phone AS customer_phone
             FROM orders o
             JOIN order_items oi ON o.order_id = oi.order_id
             JOIN vegetables v ON oi.vegetable_id = v.vegetable_id
             JOIN customers c ON o.customer_id = c.customer_id
             WHERE v.farmer_id = ?
             ORDER BY o.order_date DESC`,
            [farmer_id]
        );

        for (let order of rows) {
            const [items] = await db.query(
                `SELECT oi.*, v.vegetable_name, v.image, v.sold_by 
                 FROM order_items oi
                 JOIN vegetables v ON oi.vegetable_id = v.vegetable_id
                 WHERE oi.order_id = ? AND v.farmer_id = ?`,
                [order.order_id, farmer_id]
            );
            order.items = items;
            
            // Calculate total earnings from this order for this specific farmer
            order.farmer_total = items.reduce((acc, curr) => {
                const val = parseFloat(curr.quantity_value) || parseFloat(curr.quantity) || 1;
                const line = curr.quantity_unit === 'g' ? (parseFloat(curr.price) * val) / 1000 : parseFloat(curr.price) * val;
                return acc + line;
            }, 0);
        }

        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching farmer orders:', err);
        res.status(500).json({ message: 'Server error fetching farmer orders.' });
    }
};

// Customer: Edit an existing order within 6 hours
exports.editOrder = async (req, res) => {
    let connection;

    try {
        const orderId = Number(req.params.id);
        const customerId = req.user.id;
        const { items, delivery_address } = req.body;

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({ message: 'Invalid order ID.' });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'Your order must contain at least one product.'
            });
        }

        if (items.some(item => !Number.isInteger(Number(item.vegetable_id)))) {
            return res.status(400).json({ message: 'Invalid product details.' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Lock order to prevent simultaneous modifications
        const [orders] = await connection.query(
            `SELECT * FROM orders
             WHERE order_id = ? AND customer_id = ?
             FOR UPDATE`,
            [orderId, customerId]
        );

        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Order not found.' });
        }

        const order = orders[0];

        // Allow editing only within 6 hours
        const [timeRows] = await connection.query(
            `SELECT TIMESTAMPDIFF(SECOND, order_date, NOW()) AS elapsed_seconds
             FROM orders WHERE order_id = ?`,
            [orderId]
        );

        const elapsedSeconds = Number(timeRows[0].elapsed_seconds);

        if (elapsedSeconds < 0 || elapsedSeconds > 21600) {
            await connection.rollback();
            return res.status(400).json({
                message: 'The 6-hour order modification period has expired.'
            });
        }

        if (['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(order.status)) {
            await connection.rollback();
            return res.status(400).json({
                message: 'This order can no longer be modified.'
            });
        }

        // Fetch existing order items
        const [oldItems] = await connection.query(
            `SELECT vegetable_id, quantity, quantity_unit, quantity_value, price, surplus_listing_id, original_price
             FROM order_items
             WHERE order_id = ?`,
            [orderId]
        );

        // Combine duplicate product IDs in the requested items
        const requestedMap = new Map();

        for (const item of items) {
            const vegetableId = Number(item.vegetable_id);
            const unit = String(item.quantity_unit || '').toLowerCase();
            const value = Number(item.quantity_value ?? item.quantity);

            if (!['kg', 'g', 'piece'].includes(unit) ||
                !Number.isFinite(value) || value <= 0) {
                await connection.rollback();
                return res.status(400).json({
                    message: 'Please provide a valid product quantity and unit.'
                });
            }

            if (requestedMap.has(vegetableId)) {
                await connection.rollback();
                return res.status(400).json({
                    message: 'A product cannot be added more than once. Combine its quantity.'
                });
            }

            requestedMap.set(vegetableId, {
                vegetableId,
                unit,
                value,
                surplus_listing_id: item.surplus_listing_id || null
            });
        }

        // Lock all affected vegetable stock rows
        const allIds = [...new Set([
            ...oldItems.map(item => Number(item.vegetable_id)),
            ...requestedMap.keys()
        ])].sort((a, b) => a - b);

        const placeholders = allIds.map(() => '?').join(',');

        const [vegetables] = await connection.query(
            `SELECT vegetable_id, vegetable_name, price, quantity, sold_by
             FROM vegetables
             WHERE vegetable_id IN (${placeholders})
             ORDER BY vegetable_id
             FOR UPDATE`,
            allIds
        );

        const vegetableMap = new Map(
            vegetables.map(v => [Number(v.vegetable_id), v])
        );

        const oldRegularMap = new Map();
        const oldRescueByVegetable = new Map();
        for (const item of oldItems) {
            const vegetableId = Number(item.vegetable_id);
            if (item.surplus_listing_id) oldRescueByVegetable.set(vegetableId, item);
            else oldRegularMap.set(vegetableId, (oldRegularMap.get(vegetableId) || 0) + Number(item.quantity));
        }

        const oldRescueIds = [...new Set(oldItems.filter(item => item.surplus_listing_id).map(item => Number(item.surplus_listing_id)))];
        let rescueMap = new Map();
        if (oldRescueIds.length) {
            const rescuePlaceholders = oldRescueIds.map(() => '?').join(',');
            const [rescueRows] = await connection.query(
                `SELECT * FROM surplus_listings WHERE listing_id IN (${rescuePlaceholders}) ORDER BY listing_id FOR UPDATE`,
                oldRescueIds
            );
            rescueMap = new Map(rescueRows.map(listing => [Number(listing.listing_id), listing]));
        }

        let subtotal = 0;
        const updatedItems = [];

        for (const requested of requestedMap.values()) {
            const vegetable = vegetableMap.get(requested.vegetableId);

            if (!vegetable) {
                await connection.rollback();
                return res.status(400).json({
                    message: 'One of the selected products is unavailable.'
                });
            }

            const isPiece = vegetable.sold_by === 'piece';

            if ((isPiece && requested.unit !== 'piece') ||
                (!isPiece && requested.unit === 'piece')) {
                await connection.rollback();
                return res.status(400).json({
                    message: `Invalid quantity unit for ${vegetable.vegetable_name}.`
                });
            }

            const stockQuantity = requested.unit === 'g'
                ? requested.value / 1000
                : requested.value;

            const oldItem = oldItems.find(item => Number(item.vegetable_id) === requested.vegetableId);
            const requestedRescueId = requested.surplus_listing_id ? Number(requested.surplus_listing_id) : null;
            const oldRescueItem = oldRescueByVegetable.get(requested.vegetableId);
            if (requestedRescueId && (!oldRescueItem || requestedRescueId !== Number(oldRescueItem.surplus_listing_id))) {
                await connection.rollback();
                return res.status(400).json({ message: 'A Rescue Deal can only remain on its original order line.' });
            }
            const isRescueItem = Boolean(oldRescueItem && requestedRescueId === Number(oldRescueItem.surplus_listing_id));
            const price = isRescueItem ? Number(oldRescueItem.price) : (oldItem && !oldItem.surplus_listing_id ? Number(oldItem.price) : Number(vegetable.price));

            const lineTotal = requested.unit === 'g'
                ? (price * requested.value) / 1000
                : price * requested.value;

            let rescueListing = null;
            if (isRescueItem) {
                rescueListing = rescueMap.get(Number(oldRescueItem.surplus_listing_id));
                if (!rescueListing) {
                    await connection.rollback();
                    return res.status(400).json({ message: 'The Rescue Deal listing is no longer available.' });
                }
                const oldRescueQuantity = Number(oldRescueItem.quantity);
                const availableForThisOrder = Number(rescueListing.quantity_remaining) + oldRescueQuantity;
                const increasesQuantity = stockQuantity > oldRescueQuantity;
                if (stockQuantity > availableForThisOrder || (increasesQuantity && (rescueListing.status !== 'active' || new Date(rescueListing.deadline) <= new Date()))) {
                    await connection.rollback();
                    return res.status(400).json({ message: `Insufficient active Rescue Deal stock for ${vegetable.vegetable_name}.` });
                }
            } else {
                const previousStockDeduction = oldRegularMap.get(requested.vegetableId) || 0;
                const availableForThisOrder = Number(vegetable.quantity) + previousStockDeduction;
                if (stockQuantity > availableForThisOrder) {
                    await connection.rollback();
                    return res.status(400).json({
                        message: `Insufficient stock for ${vegetable.vegetable_name}. Available: ${availableForThisOrder} ${isPiece ? 'pieces' : 'kg'}.`
                    });
                }
            }

            subtotal += lineTotal;

            updatedItems.push({
                vegetable_id: requested.vegetableId,
                quantity: stockQuantity,
                quantity_unit: requested.unit,
                quantity_value: requested.value,
                price,
                surplus_listing_id: isRescueItem ? Number(oldRescueItem.surplus_listing_id) : null,
                original_price: isRescueItem ? Number(oldRescueItem.original_price) : null
            });
        }

        // Restore old stock and deduct the newly requested stock.
        for (const vegetableId of allIds) {
            const oldQuantity = oldRegularMap.get(vegetableId) || 0;

            const newItem = updatedItems.find(
                item => item.vegetable_id === vegetableId && !item.surplus_listing_id
            );

            const newQuantity = newItem ? newItem.quantity : 0;
            const stockDifference = oldQuantity - newQuantity;

            if (stockDifference !== 0) {
                await connection.query(
                    `UPDATE vegetables
                     SET quantity = quantity + ?
                     WHERE vegetable_id = ?`,
                    [stockDifference, vegetableId]
                );
            }
        }

        // Keep Rescue Deal reservations and sold totals in sync with the edited order.
        for (const oldRescue of oldItems.filter(item => item.surplus_listing_id)) {
            const listingId = Number(oldRescue.surplus_listing_id);
            const listing = rescueMap.get(listingId);
            const replacement = updatedItems.find(item =>
                item.vegetable_id === Number(oldRescue.vegetable_id) && item.surplus_listing_id === listingId
            );
            const oldQuantity = Number(oldRescue.quantity);
            const newQuantity = replacement ? Number(replacement.quantity) : 0;
            const difference = Number((newQuantity - oldQuantity).toFixed(3));
            if (!difference) continue;
            if (!listing) throw new Error('The Rescue Deal listing could not be locked.');

            if (difference > 0) {
                const [reserved] = await connection.query(
                    `UPDATE surplus_listings SET quantity_remaining=quantity_remaining-?, quantity_sold=quantity_sold+?
                     WHERE listing_id=? AND status='active' AND deadline>NOW() AND quantity_remaining>=?`,
                    [difference, difference, listingId, difference]
                );
                if (!reserved.affectedRows) {
                    const error = new Error('Not enough active Rescue Deal stock remains for this quantity.');
                    error.status = 409;
                    throw error;
                }
            } else {
                const released = Math.abs(difference);
                const donationWindowOpen = listing.donation_closes_at && new Date(listing.donation_closes_at) > new Date();
                const dealStillActive = listing.status === 'active' || (listing.status === 'closed' && new Date(listing.deadline) > new Date());
                if (dealStillActive || donationWindowOpen) {
                    const nextStatus = listing.status === 'closed' && dealStillActive ? 'active' :
                        listing.status === 'closed' && donationWindowOpen ? 'donation_open' : listing.status;
                    await connection.query(
                        `UPDATE surplus_listings SET quantity_remaining=quantity_remaining+?, quantity_sold=GREATEST(0, quantity_sold-?), status=? WHERE listing_id=?`,
                        [released, released, nextStatus, listingId]
                    );
                } else {
                    await connection.query(
                        `UPDATE surplus_listings SET quantity_discarded=quantity_discarded+?, quantity_sold=GREATEST(0, quantity_sold-?) WHERE listing_id=?`,
                        [released, released, listingId]
                    );
                }
            }
            await connection.query(
                `INSERT INTO surplus_events (listing_id, actor_role, actor_id, event_type, quantity, details)
                 VALUES (?, 'customer', ?, 'order_modified', ?, ?)`,
                [listingId, customerId, Math.abs(difference), `Order #${orderId}: Rescue Deal quantity changed from ${oldQuantity} to ${newQuantity}.`]
            );
        }

        // Replace the order items
        await connection.query(
            'DELETE FROM order_items WHERE order_id = ?',
            [orderId]
        );

        for (const item of updatedItems) {
            await connection.query(
                `INSERT INTO order_items
                 (order_id, vegetable_id, quantity, quantity_unit, quantity_value, price, surplus_listing_id, original_price)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.vegetable_id,
                    item.quantity,
                    item.quantity_unit,
                    item.quantity_value,
                    item.price,
                    item.surplus_listing_id,
                    item.original_price
                ]
            );
        }

        // Match checkout: no GST on produce and ₹15 delivery below ₹199.
        const grandTotal = Number((subtotal + (subtotal < 199 ? 15 : 0)).toFixed(2));

        // There is no live payment gateway/refund workflow in this project.
        // Keep prepaid orders safe by only allowing edits that leave the paid amount unchanged.
        const paymentMethod = String(order.payment_method).trim().toLowerCase();
        const isPrepaid = !['cod', 'cash on delivery'].includes(paymentMethod);
        if (isPrepaid && Math.abs(grandTotal - Number(order.total_amount)) > 0.01) {
            await connection.rollback();
            return res.status(400).json({
                message: 'This prepaid order can only be changed when the total stays the same. Use Cash on Delivery for changes that alter the amount.'
            });
        }

        const newAddress = delivery_address === undefined
            ? order.delivery_address
            : String(delivery_address).trim();

        if (!newAddress) {
            await connection.rollback();
            return res.status(400).json({
                message: 'Delivery address cannot be empty.'
            });
        }

        await connection.query(
            `UPDATE orders
             SET total_amount = ?, delivery_address = ?
             WHERE order_id = ? AND customer_id = ?`,
            [grandTotal, newAddress, orderId, customerId]
        );

        await connection.commit();

        return res.status(200).json({
            message: 'Order updated successfully!',
            order_id: orderId,
            total_amount: grandTotal,
            delivery_address: newAddress,
            items: updatedItems
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }

        console.error('Edit Order Error:', err);

        return res.status(err.status || 500).json({
            message: err.status ? err.message : 'Server error while modifying order.'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// 5. Update Order / Delivery Status (Farmer or Admin)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid delivery status value.' });
        }

        // Update orders table
        await db.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, id]);

        // Update or insert into delivery_status table
        const [existing] = await db.query('SELECT delivery_id FROM delivery_status WHERE order_id = ?', [id]);
        if (existing.length > 0) {
            await db.query('UPDATE delivery_status SET current_status = ? WHERE order_id = ?', [status, id]);
        } else {
            await db.query('INSERT INTO delivery_status (order_id, current_status) VALUES (?, ?)', [id, status]);
        }

        res.status(200).json({ message: 'Order delivery status updated successfully!', status });
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ message: 'Server error updating status.' });
    }
};
