-- Désactiver les contraintes de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- Supprimer les contraintes de clés étrangères existantes
ALTER TABLE drivers DROP FOREIGN KEY drivers_ibfk_1;
ALTER TABLE legal_documents DROP FOREIGN KEY legal_documents_ibfk_1;
ALTER TABLE promotions DROP FOREIGN KEY promotions_ibfk_1;
ALTER TABLE routes DROP FOREIGN KEY routes_ibfk_1;
ALTER TABLE stations DROP FOREIGN KEY stations_ibfk_1;
ALTER TABLE vehicles DROP FOREIGN KEY vehicles_ibfk_1;

-- Mettre à jour la structure de la table companies
ALTER TABLE companies MODIFY COLUMN id INT AUTO_INCREMENT;

-- Mettre à jour les colonnes company_id dans les autres tables
ALTER TABLE drivers MODIFY COLUMN company_id INT;
ALTER TABLE legal_documents MODIFY COLUMN company_id INT;
ALTER TABLE promotions MODIFY COLUMN company_id INT;
ALTER TABLE routes MODIFY COLUMN company_id INT;
ALTER TABLE stations MODIFY COLUMN company_id INT;
ALTER TABLE vehicles MODIFY COLUMN company_id INT;

-- Recréer les contraintes de clés étrangères
ALTER TABLE drivers ADD CONSTRAINT drivers_ibfk_1 FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE legal_documents ADD CONSTRAINT legal_documents_ibfk_1 FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE promotions ADD CONSTRAINT promotions_ibfk_1 FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE routes ADD CONSTRAINT routes_ibfk_1 FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE stations ADD CONSTRAINT stations_ibfk_1 FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE vehicles ADD CONSTRAINT vehicles_ibfk_1 FOREIGN KEY (company_id) REFERENCES companies(id);

-- Réactiver les contraintes de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;
