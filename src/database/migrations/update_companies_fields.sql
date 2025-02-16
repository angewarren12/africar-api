-- Désactiver les contraintes de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- Supprimer la table companies si elle existe
DROP TABLE IF EXISTS companies;

-- Créer la table companies avec tous les champs nécessaires
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
    postal_code VARCHAR(10),
    website VARCHAR(255),
    whatsapp VARCHAR(20),
    description TEXT,
    registration_number VARCHAR(50) NOT NULL COMMENT 'RCCM',
    tax_number VARCHAR(50) NOT NULL,
    manager_name VARCHAR(100),
    manager_position VARCHAR(100),
    gps_coordinates VARCHAR(50),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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

-- Réactiver les contraintes de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;
