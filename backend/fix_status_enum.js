const db = require('./config/db');

async function fixEnum() {
  try {
    await db.query("ALTER TABLE orders MODIFY COLUMN status ENUM('Order Placed','Order Confirmed','Packed','Shipped','Out for Delivery','Delivered','Cancelled') DEFAULT 'Order Placed'");
    console.log('orders.status ENUM updated successfully!');
  } catch (err) {
    console.error('Error altering status enum:', err.message);
  }

  const [cols] = await db.query('DESCRIBE orders');
  console.log('Updated Orders Schema:');
  console.log(JSON.stringify(cols, null, 2));
  process.exit(0);
}

fixEnum();
