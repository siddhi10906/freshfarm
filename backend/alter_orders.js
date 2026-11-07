const db = require('./config/db');

async function alterTable() {
  try {
    await db.query("ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Pending Payment'");
    console.log('✅ payment_status column added successfully');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ payment_status column already exists.');
    } else {
      console.error('Error altering table:', err.message);
    }
  }

  const [cols] = await db.query('DESCRIBE orders');
  console.log('Current Orders Schema:');
  console.log(JSON.stringify(cols, null, 2));
  process.exit(0);
}

alterTable();
