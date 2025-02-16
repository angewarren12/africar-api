-- Supprimer les tables qui dépendent de companies
DROP TABLE IF EXISTS coverage_areas;
DROP TABLE IF EXISTS transport_types;
DROP TABLE IF EXISTS stations;
DROP TABLE IF EXISTS companies;

-- Recréer la table companies avec la bonne structure
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    alternate_email VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    postal_code VARCHAR(20),
    website VARCHAR(255),
    whatsapp VARCHAR(20),
    description TEXT,
    registration_number VARCHAR(50) NOT NULL,
    tax_number VARCHAR(50),
    manager_name VARCHAR(100),
    manager_position VARCHAR(100),
    gps_coordinates VARCHAR(50),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Recréer la table coverage_areas
CREATE TABLE coverage_areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    city VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Recréer la table transport_types
CREATE TABLE transport_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Recréer la table stations
CREATE TABLE stations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    gps_coordinates VARCHAR(50),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);
