-- Supprimer la base de données si elle existe et la recréer
DROP DATABASE IF EXISTS africar_db;
CREATE DATABASE africar_db;
USE africar_db;

-- Créer la table companies (table principale)
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    alternate_email VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    whatsapp VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    district VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'Sénégal',
    website VARCHAR(255),
    description TEXT,
    logo_url VARCHAR(255),
    -- Informations légales
    registration_number VARCHAR(50) NULL COMMENT 'Numéro RCCM',
    tax_number VARCHAR(50) NULL COMMENT 'NINEA',
    legal_status VARCHAR(50) NULL,
    creation_date DATE NULL,
    -- Informations sur le responsable
    manager_name VARCHAR(100),
    manager_position VARCHAR(100),
    -- Informations sur l'assurance
    insurance_provider VARCHAR(100) NULL,
    insurance_policy_number VARCHAR(50) NULL,
    insurance_expiry_date DATE NULL,
    -- Localisation GPS du siège
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    -- Statut et timestamps
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Créer la table des zones de couverture
CREATE TABLE coverage_areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    city VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_company_city (company_id, city),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Créer la table des types de transport
CREATE TABLE transport_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_company_type (company_id, type),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Créer la table stations
CREATE TABLE stations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    capacity INT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_main_station BOOLEAN DEFAULT FALSE,
    features JSON DEFAULT (JSON_OBJECT(
        'hasWaitingRoom', false,
        'hasTicketOffice', false,
        'hasParking', false
    )),
    status ENUM('active', 'inactive', 'under_maintenance') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Créer la table vehicles
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    registration_number VARCHAR(20) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    type VARCHAR(50) NULL COMMENT 'Type de véhicule (ex: Bus, Minibus, etc.)',
    capacity INT NOT NULL,
    manufacture_year INT NOT NULL,
    features JSON DEFAULT (JSON_OBJECT(
        'hasAC', false,
        'hasTV', false,
        'hasWifi', false,
        'hasToilet', false,
        'hasUSBPorts', false
    )) COMMENT 'Équipements du véhicule',
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

-- Créer la table trips
CREATE TABLE trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    route_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    price DECIMAL(10,2) NOT NULL,
    available_seats INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (route_id) REFERENCES routes(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

-- Créer la table trip_stops
CREATE TABLE trip_stops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    station_id INT NOT NULL,
    arrival_time DATETIME NOT NULL,
    departure_time DATETIME NOT NULL,
    stop_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id),
    FOREIGN KEY (station_id) REFERENCES stations(id)
);

-- Créer la table users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'company_admin', 'staff') NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Ajouter des index pour améliorer les performances
ALTER TABLE stations ADD INDEX idx_company_city (company_id, city);
ALTER TABLE vehicles ADD INDEX idx_company_status (company_id, status);
ALTER TABLE drivers ADD INDEX idx_company_status (company_id, status);
ALTER TABLE routes ADD INDEX idx_company_stations (company_id, departure_station_id, arrival_station_id);
ALTER TABLE trips ADD INDEX idx_company_status (company_id, status);
ALTER TABLE trips ADD INDEX idx_route_date (route_id, departure_time);
ALTER TABLE trip_stops ADD INDEX idx_trip_order (trip_id, stop_order);
ALTER TABLE users ADD INDEX idx_company_role (company_id, role);

-- Insérer l'administrateur général
INSERT INTO users (
    first_name,
    last_name,
    email,
    password,
    role,
    status
) VALUES (
    'Admin',
    'Général',
    'example@africar.com',
    'admin123',
    'admin',
    'active'
);
