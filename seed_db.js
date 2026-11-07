const fs = require('fs');
const path = require('path');
const mysql = require(path.join(__dirname, 'backend', 'node_modules', 'mysql2', 'promise'));
const dotenv = require(path.join(__dirname, 'backend', 'node_modules', 'dotenv'));

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function seed() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    console.log('Connected to MySQL server.');

    const sqlPath = path.join(__dirname, 'database', 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await connection.query(sql);
    console.log('✅ schema.sql executed successfully! Database re-seeded.');
    await connection.end();
  } catch (err) {
    console.error('❌ Seeding error:', err);
  }
}

seed();
