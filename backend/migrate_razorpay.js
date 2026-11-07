const db = require('./config/db');

async function columnExists(connection, table, column) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  return Number(rows[0].count) > 0;
}

async function migrate() {
  const connection = await db.getConnection();
  try {
    if (!(await columnExists(connection, 'orders', 'payment_status'))) {
      await connection.query("ALTER TABLE orders ADD COLUMN payment_status VARCHAR(30) NOT NULL DEFAULT 'Pending'");
    }
    if (!(await columnExists(connection, 'orders', 'payment_id'))) {
      await connection.query('ALTER TABLE orders ADD COLUMN payment_id VARCHAR(100) NULL');
    }
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payment_attempts (
        attempt_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        gateway_order_id VARCHAR(100) NULL UNIQUE,
        gateway_payment_id VARCHAR(100) NULL UNIQUE,
        amount_paise BIGINT NOT NULL,
        delivery_address TEXT NOT NULL,
        items_json JSON NOT NULL,
        payment_method VARCHAR(40) NOT NULL,
        status ENUM('pending', 'paid', 'failed', 'expired') NOT NULL DEFAULT 'pending',
        order_id INT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_payment_attempt_expiry (status, expires_at),
        INDEX idx_payment_attempt_customer (customer_id),
        CONSTRAINT fk_payment_attempt_customer FOREIGN KEY (customer_id)
          REFERENCES customers(customer_id) ON DELETE CASCADE,
        CONSTRAINT fk_payment_attempt_order FOREIGN KEY (order_id)
          REFERENCES orders(order_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('Razorpay payment tables and order payment fields are ready.');
  } finally {
    connection.release();
    await db.end();
  }
}

migrate().catch(error => {
  console.error('Razorpay migration failed:', error.message);
  process.exit(1);
});
