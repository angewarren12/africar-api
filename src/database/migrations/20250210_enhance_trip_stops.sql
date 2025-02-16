-- Ajouter des colonnes utiles à la table trip_stops
ALTER TABLE trip_stops
ADD COLUMN price DECIMAL(10,2) DEFAULT NULL COMMENT 'Prix du billet depuis le départ jusqu''à cet arrêt',
ADD COLUMN available_seats INT DEFAULT NULL COMMENT 'Places disponibles à partir de cet arrêt',
ADD COLUMN boarding_count INT DEFAULT 0 COMMENT 'Nombre de passagers qui montent à cet arrêt',
ADD COLUMN alighting_count INT DEFAULT 0 COMMENT 'Nombre de passagers qui descendent à cet arrêt',
ADD COLUMN status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled' COMMENT 'Statut de l''arrêt',
ADD COLUMN platform VARCHAR(10) DEFAULT NULL COMMENT 'Numéro de quai',
ADD COLUMN notes TEXT DEFAULT NULL COMMENT 'Notes ou instructions spéciales pour cet arrêt';

-- Ajouter des index pour optimiser les requêtes
ALTER TABLE trip_stops 
ADD INDEX idx_station_datetime (station_id, arrival_time),
ADD INDEX idx_status (status);

-- Mettre à jour la contrainte de clé étrangère pour la suppression en cascade
ALTER TABLE trip_stops 
DROP FOREIGN KEY trip_stops_ibfk_1,
ADD CONSTRAINT fk_trip_stops_trip 
FOREIGN KEY (trip_id) REFERENCES trips(id) 
ON DELETE CASCADE;
