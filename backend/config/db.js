const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'freshfarm_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test Database Connection
pool.getConnection()
    .then((connection) => {
        console.log('✅ MySQL Database Connected Successfully to ' + (process.env.DB_NAME || 'freshfarm_db'));
        connection.release();
    })
    .catch((err) => {
        console.error('❌ MySQL Connection Failed:', err.message);
        console.error('⚠️ Make sure your MySQL Server is running and schema.sql has been executed.');
    });

module.exports = pool;
