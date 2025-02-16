-- Création de la table des clients
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    profile_photo VARCHAR(255),
    date_of_birth DATE,
    gender ENUM('M', 'F', 'other'),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Sénégal',
    id_card_number VARCHAR(50) UNIQUE,
    id_card_type ENUM('CNI', 'Passport', 'Autre'),
    account_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Index pour optimiser les recherches
ALTER TABLE customers 
ADD INDEX idx_email (email),
ADD INDEX idx_phone (phone),
ADD INDEX idx_status (account_status),
ADD INDEX idx_name (last_name, first_name);
