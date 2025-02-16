-- Supprimer la table trips si elle existe
DROP TABLE IF EXISTS trips;

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
    FOREIGN KEY (driver_id) REFERENCES personnel(id)
);
