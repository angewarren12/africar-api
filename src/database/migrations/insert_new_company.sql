-- Insérer la nouvelle compagnie
INSERT INTO companies (
    name,
    email,
    alternate_email,
    phone,
    alternate_phone,
    address,
    city,
    district,
    postal_code,
    website,
    whatsapp,
    description,
    registration_number,
    tax_number,
    manager_name,
    manager_position,
    gps_coordinates,
    status
) VALUES (
    'utb',
    'utb@gmail.com',
    'tester@gmail.com',
    '0777777777',
    '12223231321231',
    '221321231321231',
    'Abidjan',
    'abidjan',
    '00225',
    '21323212313',
    '12312312312312312',
    'utb',
    '212121212312312',
    '312211231',
    'kouame jean charle',
    'test',
    '5.38, -4',
    'active'
);

-- Récupérer l'ID de la compagnie insérée
SET @company_id = LAST_INSERT_ID();

-- Insérer les zones de couverture
INSERT INTO coverage_areas (company_id, city) VALUES
(@company_id, 'Abidjan'),
(@company_id, 'Yamoussoukro'),
(@company_id, 'Bouaké'),
(@company_id, 'San-Pédro');

-- Insérer le type de transport
INSERT INTO transport_types (company_id, type) VALUES
(@company_id, 'Transport mixte');
