-- Créer la table vehicles
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    registration_number VARCHAR(20) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    capacity INT NOT NULL,
    status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
    insurance_expiry DATE,
    technical_visit_expiry DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Créer la table drivers
CREATE TABLE drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    license_number VARCHAR(50) NOT NULL,
    license_expiry DATE,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);
