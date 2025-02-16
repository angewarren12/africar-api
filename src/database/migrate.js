const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runMigration() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'africar_db',
      multipleStatements: true
    });

    console.log('Connected to database');

    // Read and execute migration file
    const migrationPath = path.join(__dirname, 'migrations', '20250208_create_vehicles_table.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    await connection.query(migration);
    console.log('Migration executed successfully');

    await connection.end();
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
