-- Désactiver les contraintes de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- Supprimer toutes les tables qui pourraient avoir des dépendances
DROP TABLE IF EXISTS coverage_areas;
DROP TABLE IF EXISTS transport_types;
DROP TABLE IF EXISTS legal_documents;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS stations;
DROP TABLE IF EXISTS promotions;
DROP TABLE IF EXISTS companies;

-- Réactiver les contraintes de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;
