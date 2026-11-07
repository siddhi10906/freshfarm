/**
 * Seed script: Demo Delivered order for Priti Pagar (customer_id: 5)
 * Run once: node seed_priti_order.js
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedOrder() {
    const c = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'freshfarm_db',
        port: process.env.DB_PORT || 3306,
    });

    console.log('✅ Connected to MySQL...');

    // Items to order (vegetable_id, qty, unit_price)
    const items = [
        { vegetable_id: 1, quantity: 2, price: 40.00 }, // Fresh Red Tomatoes x2 kg = ₹80
        { vegetable_id: 3, quantity: 3, price: 30.00 }, // Fresh Potatoes x3 kg    = ₹90
        { vegetable_id: 5, quantity: 2, price: 35.00 }, // Fresh Onions x2 kg      = ₹70
    ];
    const total = items.reduce((s, i) => s + i.quantity * i.price, 0); // ₹240

    // 1. Insert into orders
    const [orderResult] = await c.query(
        `INSERT INTO orders (customer_id, total_amount, payment_method, delivery_address, status, order_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            5,
            total,
            'Cash on Delivery',
            'Plot 7, Shivaji Nagar, Nashik, Maharashtra - 422001',
            'Delivered',
            new Date('2026-10-20 10:30:00'),
        ]
    );
    const order_id = orderResult.insertId;
    console.log(`✅ Order created — order_id: ${order_id}, total: ₹${total}`);

    // 2. Insert order_items
    for (const item of items) {
        await c.query(
            `INSERT INTO order_items (order_id, vegetable_id, quantity, price) VALUES (?, ?, ?, ?)`,
            [order_id, item.vegetable_id, item.quantity, item.price]
        );
    }
    console.log(`✅ ${items.length} order items inserted.`);

    // 3. Insert full delivery_status trail
    const statusTrail = ['Order Placed','Packed','Shipped','Out for Delivery','Delivered'];
    for (let i = 0; i < statusTrail.length; i++) {
        const ts = new Date('2026-10-20T10:30:00');
        ts.setHours(ts.getHours() + i * 6);
        await c.query(
            `INSERT INTO delivery_status (order_id, current_status, updated_at) VALUES (?, ?, ?)`,
            [order_id, statusTrail[i], ts]
        );
    }
    console.log(`✅ Delivery status trail inserted (${statusTrail.length} stages).`);

    // 4. Verify
    const [[verify]] = await c.query(
        `SELECT o.order_id, o.status, o.total_amount, c.full_name, c.email,
                GROUP_CONCAT(v.vegetable_name ORDER BY v.vegetable_name SEPARATOR ', ') AS products
         FROM orders o
         JOIN customers c ON o.customer_id = c.customer_id
         JOIN order_items oi ON o.order_id = oi.order_id
         JOIN vegetables v ON oi.vegetable_id = v.vegetable_id
         WHERE o.order_id = ?
         GROUP BY o.order_id`,
        [order_id]
    );
    console.log('\n📋 Verification:');
    console.log(`   Customer : ${verify.full_name} (${verify.email})`);
    console.log(`   Order ID : #${verify.order_id}`);
    console.log(`   Status   : ${verify.status}`);
    console.log(`   Total    : ₹${verify.total_amount}`);
    console.log(`   Products : ${verify.products}`);

    await c.end();
    console.log('\n🎉 Done! Priti can now log in and Rate & Review her products.');
}

seedOrder().catch(err => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
});
