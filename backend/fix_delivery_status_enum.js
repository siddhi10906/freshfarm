const db = require('./config/db');

async function fixDeliveryEnum() {
  try {
    await db.query("ALTER TABLE delivery_status MODIFY COLUMN current_status ENUM('Order Placed','Order Confirmed','Packed','Shipped','Out for Delivery','Delivered') DEFAULT 'Order Placed'");
    console.log('✅ delivery_status.current_status ENUM updated successfully!');
  } catch (err) {
    console.error('Error altering delivery_status enum:', err.message);
  }

  const [cols] = await db.query('DESCRIBE delivery_status');
  console.log('Updated Delivery Status Schema:');
  console.log(JSON.stringify(cols, null, 2));
  process.exit(0);
}

fixDeliveryEnum();
