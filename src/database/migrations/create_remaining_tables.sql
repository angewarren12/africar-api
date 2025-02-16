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

-- Créer la table routes
CREATE TABLE routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    departure_station_id INT NOT NULL,
    arrival_station_id INT NOT NULL,
    distance DECIMAL(10,2) NOT NULL,
    duration TIME NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (departure_station_id) REFERENCES stations(id),
    FOREIGN KEY (arrival_station_id) REFERENCES stations(id)
);

-- Créer la table legal_documents
CREATE TABLE legal_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    expiry_date DATE,
    status ENUM('valid', 'expired', 'pending') DEFAULT 'valid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);
