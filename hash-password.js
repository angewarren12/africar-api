const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function updatePassword() {
  const hashedPassword = bcrypt.hashSync('Admin123!', 10);
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  await connection.execute(
    'UPDATE users SET password = ? WHERE email = ?',
    [hashedPassword, 'admin@africar.com']
  );

  console.log('Password updated successfully');
  process.exit(0);
}

updatePassword().catch(console.error);
