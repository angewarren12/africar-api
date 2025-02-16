const mysql = require('mysql2/promise');

async function up() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'africar_db'
    });

    console.log('Connected to database');

    // Create companies table if it doesn't exist
    const createCompaniesTableQuery = `
      CREATE TABLE IF NOT EXISTS companies (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        alternate_email VARCHAR(255),
        phone VARCHAR(50) NOT NULL,
        alternate_phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        district VARCHAR(100),
        postal_code VARCHAR(20),
        website VARCHAR(255),
        whatsapp VARCHAR(50),
        description TEXT,
        registration_number VARCHAR(100),
        tax_number VARCHAR(100),
        manager_name VARCHAR(255),
        manager_position VARCHAR(100),
        gps_coordinates VARCHAR(100),
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.query(createCompaniesTableQuery);
    console.log('Companies table created successfully');

    // Create vehicles table
    const createVehiclesTableQuery = `
      CREATE TABLE IF NOT EXISTS vehicles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        company_id INT NOT NULL,
        registration_number VARCHAR(50) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INT,
        capacity INT,
        vehicle_type ENUM('bus', 'minibus', 'van') NOT NULL,
        status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
        last_maintenance_date DATE,
        next_maintenance_date DATE,
        mileage INT DEFAULT 0,
        fuel_type ENUM('diesel', 'gasoline', 'electric', 'hybrid') NOT NULL,
        insurance_number VARCHAR(100),
        insurance_expiry_date DATE,
        technical_visit_date DATE,
        technical_visit_expiry_date DATE,
        gps_tracking_id VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        UNIQUE KEY unique_registration (registration_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.query(createVehiclesTableQuery);
    console.log('Vehicles table created successfully');

    await connection.end();
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

up();
