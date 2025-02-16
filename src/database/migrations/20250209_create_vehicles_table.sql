-- Supprimer la table si elle existe
DROP TABLE IF EXISTS vehicles;

-- Créer la table vehicles avec la nouvelle structure
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
