-- Ajouter les nouveaux champs à la table companies
ALTER TABLE companies
ADD COLUMN alternate_email VARCHAR(100),
ADD COLUMN alternate_phone VARCHAR(20),
ADD COLUMN district VARCHAR(100),
ADD COLUMN postal_code VARCHAR(10),
ADD COLUMN whatsapp VARCHAR(20),
ADD COLUMN manager_name VARCHAR(100),
ADD COLUMN manager_position VARCHAR(100),
ADD COLUMN gps_coordinates VARCHAR(50);
