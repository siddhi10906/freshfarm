const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function initializeDatabase() {
    console.log('🔄 Connecting to MySQL server...');

    // 1. Initial Connection without database to ensure database creation
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: process.env.DB_PORT || 3306,
        multipleStatements: true
    });

    console.log('✅ Connected to MySQL server!');

    // 2. Read schema.sql
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Executing database schema and seed data...');
    await connection.query(sql);

    console.log('🎉 Database freshfarm_db initialized successfully with all tables and sample data!');
    await connection.end();
}

initializeDatabase().catch((err) => {
    console.error('❌ Database Initialization Error:', err.message);
    process.exit(1);
});
