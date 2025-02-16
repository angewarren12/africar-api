-- Désactiver les contraintes de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- Mettre à jour la structure de la table companies
ALTER TABLE companies MODIFY COLUMN id INT AUTO_INCREMENT;

-- Créer la table coverage_areas
CREATE TABLE coverage_areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    city VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Créer la table transport_types
CREATE TABLE transport_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Créer la table stations
CREATE TABLE stations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    capacity INT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_main_station BOOLEAN DEFAULT FALSE,
    has_waiting_room BOOLEAN DEFAULT TRUE,
    has_ticket_office BOOLEAN DEFAULT TRUE,
    has_parking BOOLEAN DEFAULT TRUE,
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Réactiver les contraintes de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;
