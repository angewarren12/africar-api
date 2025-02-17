const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'africar_user',
  password: process.env.DB_PASSWORD || 'africar2024',
  database: process.env.DB_NAME || 'africar_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
