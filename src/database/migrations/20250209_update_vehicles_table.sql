-- Renommer la colonne year en manufacture_year pour plus de clarté
ALTER TABLE vehicles 
CHANGE COLUMN year manufacture_year INT NOT NULL;

-- Ajouter la colonne type
ALTER TABLE vehicles 
ADD COLUMN type VARCHAR(50) NULL COMMENT 'Type de véhicule (ex: Bus, Minibus, etc.)' AFTER model;

-- Ajouter la colonne features pour les équipements en JSON
ALTER TABLE vehicles 
ADD COLUMN features JSON DEFAULT (JSON_OBJECT(
    'hasAC', false,
    'hasTV', false,
    'hasWifi', false,
    'hasToilet', false,
    'hasUSBPorts', false
)) COMMENT 'Équipements du véhicule';
