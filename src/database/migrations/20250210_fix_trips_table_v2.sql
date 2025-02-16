-- Supprimer la table existante
DROP TABLE IF EXISTS trips;

-- Recréer la table avec les bonnes contraintes
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
    CONSTRAINT fk_trips_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_trips_route FOREIGN KEY (route_id) REFERENCES routes(id),
    CONSTRAINT fk_trips_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    CONSTRAINT fk_trips_driver FOREIGN KEY (driver_id) REFERENCES personnel(id)
);
