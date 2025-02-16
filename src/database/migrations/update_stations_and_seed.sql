-- Désactiver les contraintes de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- Supprimer toutes les clés étrangères de la table stations
ALTER TABLE stations DROP FOREIGN KEY IF EXISTS fk_stations_company;
ALTER TABLE stations DROP COLUMN IF EXISTS company_id;
ALTER TABLE stations ADD COLUMN company_id INT UNSIGNED;
ALTER TABLE stations ADD CONSTRAINT fk_stations_company FOREIGN KEY (company_id) REFERENCES companies(id);

-- Vider les tables
TRUNCATE TABLE legal_documents;
TRUNCATE TABLE vehicles;
TRUNCATE TABLE drivers;
TRUNCATE TABLE routes;
TRUNCATE TABLE stations;
TRUNCATE TABLE companies;

-- Insérer des données de test pour les companies
INSERT INTO companies (name, email, phone, address, description, registration_number, tax_number, website, founding_date, license_expiry_date, status) VALUES
('Transport Express Abidjan', 'contact@tea.ci', '+225 27 20 30 40 50', 'Abidjan Cocody, Rue des Jardins', 'Société de transport interurbain', 'RC-ABJ-2024-001', 'CC-2024-001', 'www.tea.ci', '2020-01-01', '2025-12-31', 'active'),
('Yamoussoukro Transit', 'info@ytransit.ci', '+225 27 30 40 50 60', 'Yamoussoukro Centre', 'Transport de passagers', 'RC-YAM-2024-002', 'CC-2024-002', 'www.ytransit.ci', '2019-06-15', '2025-12-31', 'active'),
('San Pedro Transport', 'contact@sptransport.ci', '+225 27 40 50 60 70', 'San Pedro Zone Portuaire', 'Transport de marchandises et passagers', 'RC-SP-2024-003', 'CC-2024-003', 'www.sptransport.ci', '2021-03-20', '2025-12-31', 'active');

-- Insérer des données de test pour les stations
INSERT INTO stations (name, city, address, phone, email, company_id) VALUES
('Gare Abidjan Nord', 'Abidjan', 'Adjamé, Gare Routière', '+225 27 20 21 22 23', 'gare.nord@tea.ci', 1),
('Gare Abidjan Sud', 'Abidjan', 'Treichville, Zone 3', '+225 27 20 24 25 26', 'gare.sud@tea.ci', 1),
('Gare Centrale Yamoussoukro', 'Yamoussoukro', 'Centre-ville', '+225 27 30 31 32 33', 'gare@ytransit.ci', 2),
('Terminal San Pedro', 'San Pedro', 'Zone Portuaire', '+225 27 40 41 42 43', 'terminal@sptransport.ci', 3);

-- Insérer des données de test pour les vehicles
INSERT INTO vehicles (company_id, registration_number, brand, model, year, capacity, status, insurance_expiry, technical_visit_expiry) VALUES
(1, 'CI-1234-AB', 'Toyota', 'Coaster', 2022, 30, 'active', '2025-06-30', '2025-03-31'),
(1, 'CI-5678-AB', 'Mercedes', 'Sprinter', 2023, 18, 'active', '2025-07-31', '2025-04-30'),
(2, 'CI-9012-YA', 'Hyundai', 'County', 2022, 25, 'active', '2025-08-31', '2025-05-31'),
(3, 'CI-3456-SP', 'Toyota', 'Hiace', 2023, 15, 'active', '2025-09-30', '2025-06-30');

-- Insérer des données de test pour les drivers
INSERT INTO drivers (company_id, first_name, last_name, email, phone, license_number, license_expiry, status) VALUES
(1, 'Kouamé', 'Konan', 'k.konan@tea.ci', '+225 07 01 02 03 04', 'PERM-001', '2026-12-31', 'active'),
(1, 'Yao', 'Koffi', 'y.koffi@tea.ci', '+225 07 02 03 04 05', 'PERM-002', '2026-12-31', 'active'),
(2, 'Aka', 'N''Guessan', 'a.nguessan@ytransit.ci', '+225 07 03 04 05 06', 'PERM-003', '2026-12-31', 'active'),
(3, 'Brou', 'Kouassi', 'b.kouassi@sptransport.ci', '+225 07 04 05 06 07', 'PERM-004', '2026-12-31', 'active');

-- Insérer des données de test pour les routes
INSERT INTO routes (company_id, departure_station_id, arrival_station_id, distance, duration, base_price) VALUES
(1, 1, 3, 240, '04:00:00', 5000),
(1, 1, 4, 350, '06:00:00', 7000),
(2, 3, 4, 450, '07:30:00', 8000),
(3, 4, 1, 350, '06:00:00', 7000);

-- Insérer des données de test pour les legal_documents
INSERT INTO legal_documents (company_id, document_type, document_name, file_url, expiry_date, status) VALUES
(1, 'license', 'Licence de transport', '/documents/license-tea.pdf', '2025-12-31', 'valid'),
(1, 'insurance', 'Assurance flotte', '/documents/insurance-tea.pdf', '2025-06-30', 'valid'),
(2, 'license', 'Licence de transport', '/documents/license-yt.pdf', '2025-12-31', 'valid'),
(3, 'license', 'Licence de transport', '/documents/license-sp.pdf', '2025-12-31', 'valid');

-- Réactiver les contraintes de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;
