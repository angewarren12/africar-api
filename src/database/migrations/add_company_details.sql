-- Mise à jour de la table companies
ALTER TABLE companies
ADD COLUMN description TEXT,
ADD COLUMN registration_number VARCHAR(50),
ADD COLUMN tax_number VARCHAR(50),
ADD COLUMN website VARCHAR(255),
ADD COLUMN founding_date DATE,
ADD COLUMN license_expiry_date DATE;

-- Création de la table legal_documents
CREATE TABLE IF NOT EXISTS legal_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    document_type ENUM('license', 'insurance', 'tax', 'registration', 'other') NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    expiry_date DATE,
    status ENUM('valid', 'expired', 'pending') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Mise à jour de la table routes
ALTER TABLE routes
ADD COLUMN company_id INT,
ADD COLUMN departure_station_id INT,
ADD COLUMN arrival_station_id INT,
ADD COLUMN distance DECIMAL(10,2),
ADD COLUMN estimated_duration INT,
ADD COLUMN base_price DECIMAL(10,2),
ADD FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
ADD FOREIGN KEY (departure_station_id) REFERENCES stations(id),
ADD FOREIGN KEY (arrival_station_id) REFERENCES stations(id);

-- Mise à jour de la table stations
ALTER TABLE stations
ADD COLUMN company_id INT,
ADD COLUMN address TEXT,
ADD COLUMN city VARCHAR(100),
ADD COLUMN state VARCHAR(100),
ADD COLUMN country VARCHAR(100),
ADD COLUMN latitude DECIMAL(10,8),
ADD COLUMN longitude DECIMAL(11,8),
ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active',
ADD FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Mise à jour de la table vehicles
ALTER TABLE vehicles
ADD COLUMN model VARCHAR(100),
ADD COLUMN year INT,
ADD COLUMN license_plate VARCHAR(20),
ADD COLUMN capacity INT,
ADD COLUMN last_maintenance_date DATE,
ADD COLUMN next_maintenance_date DATE,
ADD COLUMN status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active';

-- Mise à jour de la table drivers
ALTER TABLE drivers
ADD COLUMN license_number VARCHAR(50),
ADD COLUMN license_expiry_date DATE,
ADD COLUMN phone VARCHAR(20),
ADD COLUMN email VARCHAR(255),
ADD COLUMN address TEXT,
ADD COLUMN hire_date DATE,
ADD COLUMN status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active';

-- Table pour les statistiques des trajets
CREATE TABLE IF NOT EXISTS trip_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    route_id INT NOT NULL,
    date DATE NOT NULL,
    total_trips INT DEFAULT 0,
    completed_trips INT DEFAULT 0,
    cancelled_trips INT DEFAULT 0,
    total_passengers INT DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX idx_company_status ON companies(status);
CREATE INDEX idx_vehicle_company ON vehicles(company_id, status);
CREATE INDEX idx_driver_company ON drivers(company_id, status);
CREATE INDEX idx_route_company ON routes(company_id);
CREATE INDEX idx_station_company ON stations(company_id, status);
CREATE INDEX idx_legal_docs_company ON legal_documents(company_id, status);
CREATE INDEX idx_trip_stats_company ON trip_stats(company_id, date);
