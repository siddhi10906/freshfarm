/**
 * FreshFarm — Reviews Migration Script (v2)
 * Adds product_reviews table + avg_rating/review_count columns to vegetables
 * Compatible with MySQL 5.7+
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function columnExists(conn, table, column) {
    const [rows] = await conn.execute(
        `SELECT COUNT(*) AS cnt FROM information_schema.columns
         WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
        [table, column]
    );
    return rows[0].cnt > 0;
}

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'freshfarm_db',
        port: process.env.DB_PORT || 3306,
    });

    console.log('✅ Connected to MySQL — running reviews migration...');

    // 1. Add avg_rating column if missing
    if (!(await columnExists(connection, 'vegetables', 'avg_rating'))) {
        await connection.execute(`ALTER TABLE vegetables ADD COLUMN avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0`);
        console.log('✅ Added avg_rating column to vegetables.');
    } else {
        console.log('ℹ️  avg_rating column already exists — skipping.');
    }

    // 2. Add review_count column if missing
    if (!(await columnExists(connection, 'vegetables', 'review_count'))) {
        await connection.execute(`ALTER TABLE vegetables ADD COLUMN review_count INT NOT NULL DEFAULT 0`);
        console.log('✅ Added review_count column to vegetables.');
    } else {
        console.log('ℹ️  review_count column already exists — skipping.');
    }

    // 3. Create product_reviews table
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS product_reviews (
            review_id      INT AUTO_INCREMENT PRIMARY KEY,
            vegetable_id   INT NOT NULL,
            customer_id    INT NOT NULL,
            order_id       INT NOT NULL,
            rating         TINYINT NOT NULL,
            review_text    TEXT NOT NULL,
            created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vegetable_id) REFERENCES vegetables(vegetable_id) ON DELETE CASCADE,
            FOREIGN KEY (customer_id)  REFERENCES customers(customer_id)  ON DELETE CASCADE,
            FOREIGN KEY (order_id)     REFERENCES orders(order_id)        ON DELETE CASCADE,
            UNIQUE KEY unique_review (customer_id, vegetable_id, order_id),
            INDEX idx_veg_reviews (vegetable_id),
            INDEX idx_customer_reviews (customer_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ product_reviews table ready.');

    // 4. Recalculate avg_rating for all vegetables
    await connection.execute(`
        UPDATE vegetables v
        SET
            avg_rating   = COALESCE((SELECT AVG(r.rating)      FROM product_reviews r WHERE r.vegetable_id = v.vegetable_id), 0),
            review_count = COALESCE((SELECT COUNT(r.review_id) FROM product_reviews r WHERE r.vegetable_id = v.vegetable_id), 0)
    `);
    console.log('✅ avg_rating and review_count synced.');

    await connection.end();
    console.log('🎉 Migration complete! FreshFarm Reviews system is ready.');
}

runMigration().catch((err) => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
});
