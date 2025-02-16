-- Création de la table du personnel
CREATE TABLE IF NOT EXISTS personnel (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    type ENUM('driver', 'agent') NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    birth_date DATE,
    hire_date DATE NOT NULL,
    license_number VARCHAR(50),
    license_expiry_date DATE,
    status ENUM('active', 'inactive', 'on_leave') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index pour améliorer les performances des recherches
CREATE INDEX idx_personnel_company ON personnel(company_id);
CREATE INDEX idx_personnel_type ON personnel(type);
CREATE INDEX idx_personnel_email ON personnel(email);
CREATE INDEX idx_personnel_status ON personnel(status);
