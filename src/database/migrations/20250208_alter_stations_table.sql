-- Désactiver la vérification des clés étrangères
SET FOREIGN_KEY_CHECKS=0;

-- Ajouter les nouvelles colonnes à la table stations
ALTER TABLE stations
ADD COLUMN phone VARCHAR(50) AFTER address,
ADD COLUMN email VARCHAR(255) AFTER phone,
ADD COLUMN capacity INT AFTER email,
ADD COLUMN latitude DECIMAL(10,8) AFTER capacity,
ADD COLUMN longitude DECIMAL(11,8) AFTER latitude,
ADD COLUMN is_main_station BOOLEAN DEFAULT FALSE AFTER longitude,
ADD COLUMN has_waiting_room BOOLEAN DEFAULT TRUE AFTER is_main_station,
ADD COLUMN has_ticket_office BOOLEAN DEFAULT TRUE AFTER has_waiting_room,
ADD COLUMN has_parking BOOLEAN DEFAULT TRUE AFTER has_ticket_office;

-- Réactiver la vérification des clés étrangères
SET FOREIGN_KEY_CHECKS=1;
