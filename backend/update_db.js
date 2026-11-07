const db = require('./config/db');

async function updateDB() {
  await db.query("UPDATE vegetables SET image = '/assets/images/produce/tomatoes.jpg' WHERE vegetable_id = 1 OR vegetable_name LIKE '%Tomato%'");
  await db.query("UPDATE vegetables SET image = '/assets/images/produce/spinach.jpg' WHERE vegetable_id = 2 OR vegetable_name LIKE '%Spinach%'");
  await db.query("UPDATE vegetables SET image = '/assets/images/produce/potatoes.jpg' WHERE vegetable_id = 3 OR vegetable_name LIKE '%Potato%'");
  await db.query("UPDATE vegetables SET image = '/assets/images/produce/capsicum.jpg' WHERE vegetable_id = 4 OR vegetable_name LIKE '%Capsicum%'");
  await db.query("UPDATE vegetables SET image = '/assets/images/produce/onions.jpg' WHERE vegetable_id = 5 OR vegetable_name LIKE '%Onion%'");
  await db.query("UPDATE vegetables SET image = '/assets/images/produce/carrots.png' WHERE vegetable_id = 6 OR vegetable_name LIKE '%Carrot%'");
  await db.query("UPDATE vegetables SET image = '/assets/images/produce/cauliflower.jpg' WHERE vegetable_id = 7 OR vegetable_name LIKE '%Cauliflower%'");
  await db.query("UPDATE vegetables SET image = '/assets/images/produce/peas.jpg' WHERE vegetable_id = 8 OR vegetable_name LIKE '%Peas%'");

  const [rows] = await db.query('SELECT vegetable_id, vegetable_name, image FROM vegetables');
  console.log('MySQL Database Updated Successfully:');
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

updateDB().catch(err => {
  console.error('Update Error:', err);
  process.exit(1);
});
