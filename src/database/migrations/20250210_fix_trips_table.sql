-- Supprimer d'abord les contraintes existantes
ALTER TABLE trips
DROP FOREIGN KEY IF EXISTS trips_ibfk_1,
DROP FOREIGN KEY IF EXISTS trips_ibfk_2,
DROP FOREIGN KEY IF EXISTS trips_ibfk_3,
DROP FOREIGN KEY IF EXISTS trips_ibfk_4;

-- Recréer les contraintes correctement
ALTER TABLE trips
ADD CONSTRAINT trips_ibfk_1 FOREIGN KEY (company_id) REFERENCES companies(id),
ADD CONSTRAINT trips_ibfk_2 FOREIGN KEY (route_id) REFERENCES routes(id),
ADD CONSTRAINT trips_ibfk_3 FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
ADD CONSTRAINT trips_ibfk_4 FOREIGN KEY (driver_id) REFERENCES personnel(id);
