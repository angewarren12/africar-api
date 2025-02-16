-- Ajouter la colonne type à la table vehicles
ALTER TABLE vehicles
ADD COLUMN type VARCHAR(50) NULL COMMENT 'Type de véhicule (ex: Bus, Minibus, etc.)' AFTER model;
