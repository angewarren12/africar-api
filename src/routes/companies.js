const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Route pour créer une nouvelle compagnie
router.post('/', async (req, res) => {
  console.log('➕ POST /api/companies - Création d\'une nouvelle compagnie');
  console.log('📝 Données reçues:', JSON.stringify(req.body, null, 2));

  try {
    // Validation des champs requis
    const requiredFields = ['name', 'email', 'phone'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Champs requis manquants',
        fields: missingFields
      });
    }

    // Insérer la compagnie
    const [result] = await pool.execute(`
      INSERT INTO companies (
        name, email, alternate_email, phone, alternate_phone,
        whatsapp, address, city, district, postal_code,
        website, description, logo_url, registration_number,
        tax_number, legal_status, creation_date, manager_name,
        manager_position, insurance_provider, insurance_policy_number,
        insurance_expiry_date, latitude, longitude, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [
      req.body.name,
      req.body.email,
      req.body.alternate_email || null,
      req.body.phone,
      req.body.alternate_phone || null,
      req.body.whatsapp || null,
      req.body.address || null,
      req.body.city || null,
      req.body.district || null,
      req.body.postal_code || null,
      req.body.website || null,
      req.body.description || null,
      req.body.logo_url || null,
      req.body.registration_number || null,
      req.body.tax_number || null,
      req.body.legal_status || null,
      req.body.creation_date || null,
      req.body.manager_name || null,
      req.body.manager_position || null,
      req.body.insurance_provider || null,
      req.body.insurance_policy_number || null,
      req.body.insurance_expiry_date || null,
      req.body.latitude || null,
      req.body.longitude || null
    ]);

    const companyId = result.insertId;
    console.log('✅ Compagnie créée avec l\'ID:', companyId);

    // Insérer les zones de couverture
    if (req.body.coverage_areas && Array.isArray(req.body.coverage_areas) && req.body.coverage_areas.length > 0) {
      const coverageValues = req.body.coverage_areas.map(city => [companyId, city]);
      await pool.query(
        'INSERT INTO coverage_areas (company_id, city) VALUES ?',
        [coverageValues]
      );
      console.log('✅ Zones de couverture ajoutées');
    }

    // Insérer les types de transport
    if (req.body.transport_types && Array.isArray(req.body.transport_types) && req.body.transport_types.length > 0) {
      const transportValues = req.body.transport_types.map(type => [companyId, type]);
      await pool.query(
        'INSERT INTO transport_types (company_id, type) VALUES ?',
        [transportValues]
      );
      console.log('✅ Types de transport ajoutés');
    }

    // Récupérer la compagnie créée avec toutes ses informations
    const [companies] = await pool.execute(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM vehicles WHERE company_id = c.id) as fleet_size,
        (SELECT COUNT(*) FROM personnel WHERE company_id = c.id AND type = 'driver') as drivers_count,
        (SELECT COUNT(*) FROM stations WHERE company_id = c.id) as stations_count
      FROM companies c
      WHERE c.id = ?
    `, [companyId]);

    // Récupérer les zones de couverture
    const [coverageAreas] = await pool.execute(
      'SELECT city FROM coverage_areas WHERE company_id = ?',
      [companyId]
    );

    // Récupérer les types de transport
    const [transportTypes] = await pool.execute(
      'SELECT type FROM transport_types WHERE company_id = ?',
      [companyId]
    );

    // Formater la réponse
    const company = {
      ...companies[0],
      coverage_areas: coverageAreas.map(area => area.city),
      transport_types: transportTypes.map(t => t.type),
      location: companies[0].latitude && companies[0].longitude ? {
        latitude: companies[0].latitude,
        longitude: companies[0].longitude
      } : null
    };

    // Supprimer les champs latitude/longitude de l'objet principal
    delete company.latitude;
    delete company.longitude;

    console.log('📄 Données enregistrées dans la BD:', JSON.stringify(company, null, 2));
    res.status(201).json({
      message: 'Compagnie créée avec succès',
      company
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création de la compagnie:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la création de la compagnie',
      error: error.message 
    });
  }
});

// Route pour obtenir toutes les compagnies
router.get('/', async (req, res) => {
  console.log('🔍 GET /api/companies - Début de la requête');
  try {
    console.log('📊 Exécution de la requête SQL pour récupérer les compagnies...');
    const [companies] = await pool.execute(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM stations WHERE company_id = c.id) as stations_count,
        (SELECT COUNT(*) FROM personnel WHERE company_id = c.id AND type = 'driver') as drivers_count,
        (SELECT COUNT(*) FROM vehicles WHERE company_id = c.id) as vehicles_count
      FROM companies c
      ORDER BY c.created_at DESC
    `);
    
    console.log(`✅ ${companies.length} compagnies trouvées`);

    // Récupérer les zones de couverture et types de transport pour chaque compagnie
    for (let company of companies) {
      // Récupérer les zones de couverture
      const [coverageAreas] = await pool.execute(
        'SELECT city FROM coverage_areas WHERE company_id = ?',
        [company.id]
      );
      company.coverage_areas = coverageAreas.map(area => area.city);

      // Récupérer les types de transport
      const [transportTypes] = await pool.execute(
        'SELECT type FROM transport_types WHERE company_id = ?',
        [company.id]
      );
      company.transport_type = transportTypes.map(t => t.type);

      console.log(`📦 Données pour ${company.name}:`, {
        coverage_areas: company.coverage_areas,
        transport_type: company.transport_type
      });
    }

    res.json(companies);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des compagnies:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des compagnies',
      error: error.message 
    });
  }
});

// Route pour obtenir les détails d'une compagnie
router.get('/:id', async (req, res) => {
  console.log(`🔍 GET /api/companies/${req.params.id} - Début de la requête`);
  try {
    // Récupérer les informations de base de la compagnie
    const [companies] = await pool.execute(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM stations WHERE company_id = c.id) as stations_count,
        (SELECT COUNT(*) FROM personnel WHERE company_id = c.id AND type = 'driver') as drivers_count,
        (SELECT COUNT(*) FROM vehicles WHERE company_id = c.id) as vehicles_count,
        (SELECT COUNT(*) FROM trips WHERE company_id = c.id) as trips_count
      FROM companies c
      WHERE c.id = ?
    `, [req.params.id]);

    if (!companies.length) {
      console.log('❌ Compagnie non trouvée');
      return res.status(404).json({ message: 'Compagnie non trouvée' });
    }

    const company = companies[0];
    console.log('✅ Informations de base de la compagnie récupérées');

    // Récupérer les zones de couverture
    const [coverageAreas] = await pool.execute(
      'SELECT city FROM coverage_areas WHERE company_id = ?',
      [company.id]
    );
    company.coverage_areas = coverageAreas.map(area => area.city);
    console.log('✅ Zones de couverture récupérées');

    // Récupérer les types de transport
    const [transportTypes] = await pool.execute(
      'SELECT type FROM transport_types WHERE company_id = ?',
      [company.id]
    );
    company.transport_type = transportTypes.map(t => t.type);
    console.log('✅ Types de transport récupérés');

    // Récupérer le nombre de véhicules
    const [vehicleCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM vehicles WHERE company_id = ?',
      [company.id]
    );
    company.fleetSize = vehicleCount[0].count;
    console.log('✅ Nombre de véhicules récupéré');

    // Récupérer le nombre de chauffeurs
    const [driverCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM personnel WHERE company_id = ? AND type = "driver"',
      [company.id]
    );
    company.driversCount = driverCount[0].count;
    console.log('✅ Nombre de chauffeurs récupéré');

    // Récupérer le nombre de gares
    const [stationCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM stations WHERE company_id = ?',
      [company.id]
    );
    company.stationsCount = stationCount[0].count;
    console.log('✅ Nombre de gares récupéré');

    // Récupérer les véhicules
    const [vehicles] = await pool.execute(`
      SELECT id, brand, model, registration_number, capacity, status, created_at
      FROM vehicles
      WHERE company_id = ?
    `, [company.id]);
    company.vehicles = vehicles;
    console.log('✅ Liste des véhicules récupérée');

    // Récupérer les chauffeurs
    const [drivers] = await pool.execute(`
      SELECT id, first_name, last_name, phone, license_number, status, created_at
      FROM personnel
      WHERE company_id = ? AND type = 'driver'
    `, [company.id]);
    company.drivers = drivers;
    console.log('✅ Liste des chauffeurs récupérée');

    // Récupérer les gares
    console.log('🔍 Récupération des gares pour la compagnie', company.id);
    const [stations] = await pool.execute(`
      SELECT 
        id,
        name,
        address,
        city,
        phone,
        email,
        capacity,
        latitude, longitude,
        is_main_station,
        features,
        status,
        created_at,
        updated_at,
        (
          SELECT COUNT(DISTINCT t.id)
          FROM trips t
          JOIN routes r ON t.route_id = r.id
          WHERE r.departure_station_id = stations.id
          AND t.company_id = ?
        ) as departures_count,
        (
          SELECT COUNT(DISTINCT t.id)
          FROM trips t
          JOIN routes r ON t.route_id = r.id
          WHERE r.arrival_station_id = stations.id
          AND t.company_id = ?
        ) as arrivals_count,
        (
          SELECT COUNT(DISTINCT ts.trip_id)
          FROM trip_stops ts
          JOIN trips t ON ts.trip_id = t.id
          WHERE ts.station_id = stations.id
          AND t.company_id = ?
        ) as stops_count
      FROM stations
      WHERE company_id = ?
      ORDER BY name ASC
    `, [company.id, company.id, company.id, company.id]);
    
    console.log(`📊 ${stations.length} gares trouvées`);

    // Ajouter des statistiques pour chaque gare
    console.log('🔄 Récupération des statistiques détaillées pour chaque gare...');
    company.stations = await Promise.all(stations.map(async (station) => {
      console.log(`\n📍 Traitement de la gare "${station.name}" (ID: ${station.id})`);
      
      // Parser les features JSON si c'est une chaîne
      if (typeof station.features === 'string') {
        try {
          station.features = JSON.parse(station.features);
        } catch (error) {
          console.warn(`⚠️ Erreur lors du parsing des features pour la gare ${station.id}:`, error);
          station.features = {
            hasWaitingRoom: false,
            hasTicketOffice: false,
            hasParking: false
          };
        }
      }

      // Récupérer les 5 prochains départs
      console.log(`🚌 Récupération des prochains départs pour la gare "${station.name}"`);
      const [nextDepartures] = await pool.execute(`
        SELECT 
          t.id,
          t.departure_time,
          t.arrival_time,
          t.available_seats,
          t.price,
          arr_s.name as destination,
          arr_s.city as destination_city,
          v.registration_number as vehicle_number
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        JOIN stations arr_s ON r.arrival_station_id = arr_s.id
        JOIN vehicles v ON t.vehicle_id = v.id
        WHERE r.departure_station_id = ?
        AND t.company_id = ?
        AND t.status = 'scheduled'
        AND t.departure_time >= NOW()
        ORDER BY t.departure_time ASC
        LIMIT 5
      `, [station.id, company.id]);
      console.log(`✅ ${nextDepartures.length} prochains départs trouvés`);

      // Récupérer les 5 prochaines arrivées
      console.log(`🏁 Récupération des prochaines arrivées pour la gare "${station.name}"`);
      const [nextArrivals] = await pool.execute(`
        SELECT 
          t.id,
          t.departure_time,
          t.arrival_time,
          t.available_seats,
          t.price,
          dep_s.name as origin,
          dep_s.city as origin_city,
          v.registration_number as vehicle_number
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        JOIN stations dep_s ON r.departure_station_id = dep_s.id
        JOIN vehicles v ON t.vehicle_id = v.id
        WHERE r.arrival_station_id = ?
        AND t.company_id = ?
        AND t.status = 'scheduled'
        AND t.arrival_time >= NOW()
        ORDER BY t.arrival_time ASC
        LIMIT 5
      `, [station.id, company.id]);
      console.log(`✅ ${nextArrivals.length} prochaines arrivées trouvées`);

      console.log('📊 Calcul des statistiques pour la gare', station.name);
      const stationData = {
        ...station,
        next_departures: nextDepartures,
        next_arrivals: nextArrivals,
        total_movements: station.departures_count + station.arrivals_count + station.stops_count
      };
      console.log('✅ Statistiques calculées:', {
        departures: station.departures_count,
        arrivals: station.arrivals_count,
        stops: station.stops_count,
        total: stationData.total_movements
      });

      return stationData;
    }));

    console.log('✅ Liste des gares récupérée avec statistiques détaillées');

    // Récupérer les documents
    const [documents] = await pool.execute(`
      SELECT id, document_type as type, document_name as file_name, file_url as file_path, status, created_at
      FROM legal_documents
      WHERE company_id = ?
    `, [company.id]);
    company.documents = documents;
    console.log('✅ Liste des documents récupérée');

    // Récupérer les trajets
    const [trips] = await pool.execute(`
      SELECT 
        t.id,
        t.departure_time,
        t.arrival_time,
        r.distance,
        r.duration,
        r.base_price,
        t.price as total_price,
        t.available_seats,
        t.status,
        v.registration_number as vehicle_number,
        v.brand as vehicle_brand,
        v.model as vehicle_model,
        CONCAT(d.first_name, ' ', d.last_name) as driver_name,
        ds.name as departure_station,
        ds.city as departure_city,
        arr_s.name as arrival_station,
        arr_s.city as arrival_city
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN personnel d ON t.driver_id = d.id
      JOIN stations ds ON r.departure_station_id = ds.id
      JOIN stations arr_s ON r.arrival_station_id = arr_s.id
      WHERE t.company_id = ?
      ORDER BY t.departure_time ASC
    `, [company.id]);
    company.trips = trips;
    console.log('✅ Liste des trajets récupérée');

    // Récupérer les arrêts intermédiaires pour chaque trajet
    const [allStops] = await pool.execute(`
      SELECT 
        ts.*,
        s.name as station_name,
        s.city as station_city
      FROM trip_stops ts
      JOIN stations s ON ts.station_id = s.id
      WHERE ts.trip_id IN (${trips.map(t => t.id).join(',') || 0})
      ORDER BY ts.stop_order ASC
    `);

    // Organiser les arrêts par trajet
    const stopsByTrip = {};
    allStops.forEach(stop => {
      if (!stopsByTrip[stop.trip_id]) {
        stopsByTrip[stop.trip_id] = [];
      }
      stopsByTrip[stop.trip_id].push({
        station_name: stop.station_name,
        station_city: stop.station_city,
        arrival_time: stop.arrival_time,
        departure_time: stop.departure_time,
        stop_order: stop.stop_order,
        price_adjustment: stop.price_adjustment
      });
    });

    // Ajouter les arrêts à chaque trajet
    company.trips = trips.map(trip => ({
      ...trip,
      stops: stopsByTrip[trip.id] || []
    }));

    console.log('✅ Liste des trajets et arrêts récupérée');

    // Calculer quelques statistiques de base sur les trajets
    company.tripStats = {
      total: trips.length,
      scheduled: trips.filter(t => t.status === 'scheduled').length,
      inProgress: trips.filter(t => t.status === 'in_progress').length,
      completed: trips.filter(t => t.status === 'completed').length,
      cancelled: trips.filter(t => t.status === 'cancelled').length,
      totalRevenue: trips.reduce((sum, t) => sum + (t.status === 'completed' ? t.total_price : 0), 0)
    };

    console.log('📦 Données complètes de la compagnie:', {
      id: company.id,
      name: company.name,
      fleetSize: company.fleetSize,
      driversCount: company.driversCount,
      stationsCount: company.stationsCount,
      coverage_areas: company.coverage_areas,
      transport_type: company.transport_type
    });

    res.json(company);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des détails de la compagnie:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des détails de la compagnie',
      error: error.message 
    });
  }
});

// Route pour obtenir les détails d'une compagnie
router.get('/:id/details', async (req, res) => {
  console.log('\n🔍 GET /api/companies/:id/details - Récupération des détails de la compagnie');
  const companyId = req.params.id;
  console.log('📝 ID de la compagnie:', companyId);

  try {
    // Récupérer les informations de base de la compagnie
    console.log('1️⃣ Récupération des informations de base de la compagnie');
    let [companies] = await pool.execute(
      'SELECT id, name, email, phone, status, created_at, updated_at FROM companies WHERE id = ?',
      [companyId]
    ).catch(err => {
      console.error('❌ Erreur SQL (companies):', err);
      throw err;
    });

    if (!companies || companies.length === 0) {
      console.log('❌ Compagnie non trouvée');
      return res.status(404).json({ message: 'Compagnie non trouvée' });
    }

    const company = companies[0];
    console.log('✅ Informations de base de la compagnie récupérées:', company);

    try {
      // Récupérer les zones de couverture
      console.log('2️⃣ Récupération des zones de couverture');
      const [coverageAreas] = await pool.execute(
        'SELECT area_name FROM coverage_areas WHERE company_id = ?',
        [companyId]
      );
      company.coverage_areas = coverageAreas.map(area => area.area_name);
      console.log('✅ Zones de couverture récupérées:', company.coverage_areas);
    } catch (error) {
      console.error('⚠️ Erreur lors de la récupération des zones de couverture:', error);
      company.coverage_areas = [];
    }

    try {
      // Récupérer les types de transport
      console.log('3️⃣ Récupération des types de transport');
      const [transportTypes] = await pool.execute(
        'SELECT type_name FROM transport_types WHERE company_id = ?',
        [companyId]
      );
      company.transport_type = transportTypes.map(type => type.type_name);
      console.log('✅ Types de transport récupérés:', company.transport_type);
    } catch (error) {
      console.error('⚠️ Erreur lors de la récupération des types de transport:', error);
      company.transport_type = [];
    }

    try {
      // Récupérer le nombre de véhicules
      console.log('4️⃣ Récupération du nombre de véhicules');
      const [vehicleCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM vehicles WHERE company_id = ?',
        [companyId]
      );
      company.fleetSize = vehicleCount[0].count;
      console.log('✅ Nombre de véhicules récupéré:', company.fleetSize);
    } catch (error) {
      console.error('⚠️ Erreur lors de la récupération du nombre de véhicules:', error);
      company.fleetSize = 0;
    }

    try {
      // Récupérer le nombre de chauffeurs
      console.log('5️⃣ Récupération du nombre de chauffeurs');
      const [driverCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM personnel WHERE company_id = ? AND type = "driver"',
        [companyId]
      );
      company.driversCount = driverCount[0].count;
      console.log('✅ Nombre de chauffeurs récupéré:', company.driversCount);
    } catch (error) {
      console.error('⚠️ Erreur lors de la récupération du nombre de chauffeurs:', error);
      company.driversCount = 0;
    }

    try {
      // Récupérer les gares avec leurs statistiques
      console.log('6️⃣ Récupération des gares');
      const [stations] = await pool.execute(`
        SELECT 
          s.*,
          COALESCE((SELECT COUNT(*) FROM trips t WHERE t.departure_station_id = s.id), 0) as departure_count,
          COALESCE((SELECT COUNT(*) FROM trips t WHERE t.arrival_station_id = s.id), 0) as arrival_count,
          COALESCE((SELECT COUNT(*) FROM trip_stops ts WHERE ts.station_id = s.id), 0) as stop_count
        FROM stations s
        WHERE s.company_id = ?
        ORDER BY s.name ASC
      `, [companyId]);
      
      company.stations = stations;
      company.stationsCount = stations.length;
      console.log(`📊 ${stations.length} gares trouvées`);
    } catch (error) {
      console.error('⚠️ Erreur lors de la récupération des gares:', error);
      company.stations = [];
      company.stationsCount = 0;
    }

    console.log('📦 Données complètes de la compagnie:', company);
    res.json(company);
  } catch (error) {
    console.error('\n❌ Erreur lors de la récupération des détails de la compagnie:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('SQL State:', error.sqlState);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      message: 'Erreur lors de la récupération des détails de la compagnie',
      error: error.message
    });
  }
});

// Route pour mettre à jour une compagnie
router.put('/:id', async (req, res) => {
  console.log(`🔄 PUT /api/companies/${req.params.id} - Mise à jour de la compagnie`);
  console.log('📝 Données reçues:', JSON.stringify(req.body, null, 2));
  
  try {
    const { 
      name, 
      email, 
      phone, 
      address, 
      logo_url,
      status 
    } = req.body;
    const companyId = req.params.id;

    console.log('📊 Exécution de la requête SQL de mise à jour...');
    await pool.execute(`
      UPDATE companies
      SET 
        name = ?,
        email = ?,
        phone = ?,
        address = ?,
        logo_url = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, email, phone, address, logo_url, status, companyId]);

    console.log('✅ Compagnie mise à jour avec succès');
    res.json({ message: 'Compagnie mise à jour avec succès' });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la compagnie:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour de la compagnie',
      error: error.message 
    });
  }
});

// Route pour supprimer une compagnie
router.delete('/:id', async (req, res) => {
  console.log(`❌ DELETE /api/companies/${req.params.id} - Suppression de la compagnie`);
  try {
    console.log('📊 Exécution de la requête SQL de suppression...');
    await pool.execute('DELETE FROM companies WHERE id = ?', [req.params.id]);
    
    console.log('✅ Compagnie supprimée avec succès');
    res.json({ message: 'Compagnie supprimée avec succès' });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la compagnie:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Erreur lors de la suppression de la compagnie',
      error: error.message 
    });
  }
});

// Route pour créer une nouvelle station
router.post('/:id/stations', async (req, res) => {
  console.log('➕ POST /api/companies/:id/stations - Création d\'une nouvelle station');
  console.log('📝 Données reçues:', JSON.stringify(req.body, null, 2));

  try {
    // Valider les champs requis
    const requiredFields = ['name', 'city'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Champs requis manquants',
        fields: missingFields
      });
    }

    // Créer l'objet features
    const features = {
      hasWaitingRoom: req.body.has_waiting_room || req.body.features?.hasWaitingRoom || false,
      hasTicketOffice: req.body.has_ticket_office || req.body.features?.hasTicketOffice || false,
      hasParking: req.body.has_parking || req.body.features?.hasParking || false
    };

    console.log('📝 Features de la station:', features);

    // Insérer la station
    const [result] = await pool.execute(`
      INSERT INTO stations (
        company_id,
        name,
        city,
        address,
        phone,
        email,
        capacity,
        latitude,
        longitude,
        is_main_station,
        features,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [
      req.params.id,
      req.body.name,
      req.body.city,
      req.body.address || null,
      req.body.phone || null,
      req.body.email || null,
      req.body.capacity || 0,
      req.body.latitude || null,
      req.body.longitude || null,
      req.body.is_main_station || false,
      JSON.stringify(features)
    ]);

    const stationId = result.insertId;
    console.log('✅ Station insérée avec l\'ID:', stationId);

    // Récupérer la station créée
    const [stations] = await pool.execute(`
      SELECT 
        id,
        name,
        city,
        address,
        phone,
        email,
        capacity,
        latitude,
        longitude,
        is_main_station,
        features,
        status,
        created_at,
        updated_at
      FROM stations
      WHERE id = ?
    `, [stationId]);

    if (!stations.length) {
      throw new Error('Station créée mais impossible de la récupérer');
    }

    const station = stations[0];
    
    // S'assurer que les features sont un objet
    try {
      station.features = typeof station.features === 'string' 
        ? JSON.parse(station.features)
        : station.features || {
            hasWaitingRoom: false,
            hasTicketOffice: false,
            hasParking: false
          };
    } catch (error) {
      console.warn('⚠️ Erreur lors du parsing des features:', error);
      station.features = {
        hasWaitingRoom: false,
        hasTicketOffice: false,
        hasParking: false
      };
    }

    console.log('✅ Station créée avec succès:', station);
    res.status(201).json({
      message: 'Station créée avec succès',
      station
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création de la station:', error);
    res.status(500).json({
      message: 'Erreur lors de la création de la station',
      error: error.message
    });
  }
});

// Route pour récupérer les gares d'une compagnie
router.get('/:id/stations', async (req, res) => {
  console.log(`\n🔍 GET /api/companies/${req.params.id}/stations - Récupération des gares`);
  try {
    // Récupérer les gares avec leurs statistiques
    const [stations] = await pool.execute(`
      SELECT 
        id,
        name,
        address,
        city,
        phone,
        email,
        capacity,
        latitude, longitude,
        is_main_station,
        features,
        status,
        created_at,
        updated_at,
        (
          SELECT COUNT(DISTINCT t.id)
          FROM trips t
          JOIN routes r ON t.route_id = r.id
          WHERE r.departure_station_id = stations.id
          AND t.company_id = ?
        ) as departures_count,
        (
          SELECT COUNT(DISTINCT t.id)
          FROM trips t
          JOIN routes r ON t.route_id = r.id
          WHERE r.arrival_station_id = stations.id
          AND t.company_id = ?
        ) as arrivals_count,
        (
          SELECT COUNT(DISTINCT ts.trip_id)
          FROM trip_stops ts
          JOIN trips t ON ts.trip_id = t.id
          WHERE ts.station_id = stations.id
          AND t.company_id = ?
        ) as stops_count
      FROM stations
      WHERE company_id = ?
      ORDER BY name ASC
    `, [req.params.id, req.params.id, req.params.id, req.params.id]);
    
    console.log(`📊 ${stations.length} stations trouvées`);

    // Parser les features JSON pour chaque station
    const formattedStations = stations.map(station => {
      const stationCopy = { ...station };
      if (typeof stationCopy.features === 'string') {
        try {
          stationCopy.features = JSON.parse(stationCopy.features);
        } catch (error) {
          console.warn(`⚠️ Erreur lors du parsing des features pour la gare ${station.id}:`, error);
          stationCopy.features = {
            hasWaitingRoom: false,
            hasTicketOffice: false,
            hasParking: false
          };
        }
      }
      return stationCopy;
    });

    res.json(formattedStations);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des gares:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des gares',
      error: error.message 
    });
  }
});

// Route pour récupérer les véhicules d'une compagnie
router.get('/:id/vehicles', async (req, res) => {
  console.log(`\n🔍 GET /api/companies/${req.params.id}/vehicles - Récupération des véhicules`);
  try {
    const [vehicles] = await pool.execute(`
      SELECT 
        v.*,
        (
          SELECT COUNT(*)
          FROM trips t
          WHERE t.vehicle_id = v.id
          AND t.status = 'completed'
        ) as completed_trips,
        (
          SELECT COUNT(*)
          FROM trips t
          WHERE t.vehicle_id = v.id
          AND t.status = 'in_progress'
        ) as active_trips
      FROM vehicles v
      WHERE v.company_id = ?
      ORDER BY v.registration_number ASC
    `, [req.params.id]);

    console.log(`📊 ${vehicles.length} véhicules trouvés`);

    // Formater les données des véhicules
    const formattedVehicles = vehicles.map(vehicle => {
      // Parser les features JSON si c'est une chaîne
      let features;
      try {
        features = typeof vehicle.features === 'string' 
          ? JSON.parse(vehicle.features)
          : vehicle.features || {
              hasAC: false,
              hasWifi: false,
              hasToilet: false,
              hasTv: false
            };
      } catch (error) {
        console.warn(`⚠️ Erreur lors du parsing des features pour le véhicule ${vehicle.id}:`, error);
        features = {
          hasAC: false,
          hasWifi: false,
          hasToilet: false,
          hasTv: false
        };
      }

      return {
        id: vehicle.id,
        registrationNumber: vehicle.registration_number,
        brand: vehicle.brand,
        model: vehicle.model,
        type: vehicle.type,
        capacity: vehicle.capacity,
        manufactureYear: vehicle.manufacture_year,
        features,
        status: vehicle.status,
        statistics: {
          completedTrips: vehicle.completed_trips,
          activeTrips: vehicle.active_trips
        },
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at
      };
    });

    res.json(formattedVehicles);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des véhicules:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      message: 'Erreur lors de la récupération des véhicules',
      error: error.message
    });
  }
});

// Route pour créer un nouveau véhicule
router.post('/:id/vehicles', async (req, res) => {
  console.log('➕ POST /api/companies/:id/vehicles - Création d\'un nouveau véhicule');
  console.log('📝 Données reçues:', JSON.stringify(req.body, null, 2));

  try {
    const companyId = req.params.id;
    const {
      registrationNumber,
      brand,
      model,
      type,
      capacity,
      manufactureYear,
      features: rawFeatures,
      status = 'active'
    } = req.body;

    // Valider les champs requis
    const requiredFields = ['registrationNumber', 'brand', 'model', 'type', 'capacity'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Champs requis manquants',
        fields: missingFields
      });
    }

    // Créer l'objet features
    const features = {
      hasAC: rawFeatures?.hasAC || false,
      hasWifi: rawFeatures?.hasWifi || false,
      hasToilet: rawFeatures?.hasToilet || false,
      hasTv: rawFeatures?.hasTv || false
    };

    console.log('📝 Features du véhicule:', features);

    // Insérer le véhicule
    const [result] = await pool.execute(`
      INSERT INTO vehicles (
        company_id,
        registration_number,
        brand,
        model,
        type,
        capacity,
        manufacture_year,
        features,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      companyId,
      registrationNumber,
      brand,
      model,
      type,
      capacity,
      manufactureYear || null,
      JSON.stringify(features),
      status
    ]);

    const vehicleId = result.insertId;
    console.log('✅ Véhicule inséré avec l\'ID:', vehicleId);

    // Récupérer le véhicule créé
    const [vehicles] = await pool.execute(`
      SELECT 
        id,
        registration_number,
        brand,
        model,
        type,
        capacity,
        manufacture_year,
        features,
        status,
        created_at,
        updated_at
      FROM vehicles
      WHERE id = ?
    `, [vehicleId]);

    if (!vehicles.length) {
      throw new Error('Véhicule créé mais impossible de le récupérer');
    }

    const vehicle = vehicles[0];
    
    // S'assurer que les features sont un objet
    try {
      vehicle.features = typeof vehicle.features === 'string' 
        ? JSON.parse(vehicle.features)
        : vehicle.features || {
            hasAC: false,
            hasWifi: false,
            hasToilet: false,
            hasTv: false
          };
    } catch (error) {
      console.warn('⚠️ Erreur lors du parsing des features:', error);
      vehicle.features = {
        hasAC: false,
        hasWifi: false,
        hasToilet: false,
        hasTv: false
      };
    }

    console.log('✅ Véhicule créé avec succès:', vehicle);
    res.status(201).json({
      message: 'Véhicule créé avec succès',
      vehicle
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création du véhicule:', error);
    res.status(500).json({
      message: 'Erreur lors de la création du véhicule',
      error: error.message
    });
  }
});

// Route pour modifier un véhicule
router.put('/:companyId/vehicles/:vehicleId', async (req, res) => {
  console.log(`\n🔄 PUT /api/companies/${req.params.companyId}/vehicles/${req.params.vehicleId} - Modification d'un véhicule`);
  console.log('📝 Données reçues:', JSON.stringify(req.body, null, 2));

  try {
    const { companyId, vehicleId } = req.params;
    const {
      registrationNumber,
      brand,
      model,
      type,
      capacity,
      manufactureYear,
      features: rawFeatures,
      status
    } = req.body;

    // Vérifier que le véhicule existe et appartient à la compagnie
    const [vehicles] = await pool.execute(`
      SELECT id FROM vehicles 
      WHERE id = ? AND company_id = ?
    `, [vehicleId, companyId]);

    if (!vehicles.length) {
      return res.status(404).json({
        message: 'Véhicule non trouvé ou n\'appartenant pas à cette compagnie'
      });
    }

    // Créer l'objet features
    const features = {
      hasAC: rawFeatures?.hasAC ?? false,
      hasWifi: rawFeatures?.hasWifi ?? false,
      hasToilet: rawFeatures?.hasToilet ?? false,
      hasTv: rawFeatures?.hasTv ?? false
    };

    console.log('📝 Features du véhicule:', features);

    // Mettre à jour le véhicule
    await pool.execute(`
      UPDATE vehicles 
      SET 
        registration_number = ?,
        brand = ?,
        model = ?,
        type = ?,
        capacity = ?,
        manufacture_year = ?,
        features = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND company_id = ?
    `, [
      registrationNumber,
      brand,
      model,
      type,
      capacity,
      manufactureYear || null,
      JSON.stringify(features),
      status || 'active',
      vehicleId,
      companyId
    ]);

    // Récupérer le véhicule mis à jour
    const [updatedVehicles] = await pool.execute(`
      SELECT 
        id,
        registration_number,
        brand,
        model,
        type,
        capacity,
        manufacture_year,
        features,
        status,
        created_at,
        updated_at
      FROM vehicles
      WHERE id = ?
    `, [vehicleId]);

    if (!updatedVehicles.length) {
      throw new Error('Véhicule mis à jour mais impossible de le récupérer');
    }

    const vehicle = updatedVehicles[0];
    
    // S'assurer que les features sont un objet
    try {
      vehicle.features = typeof vehicle.features === 'string' 
        ? JSON.parse(vehicle.features)
        : vehicle.features || {
            hasAC: false,
            hasWifi: false,
            hasToilet: false,
            hasTv: false
          };
    } catch (error) {
      console.warn('⚠️ Erreur lors du parsing des features:', error);
      vehicle.features = {
        hasAC: false,
        hasWifi: false,
        hasToilet: false,
        hasTv: false
      };
    }

    console.log('✅ Véhicule mis à jour avec succès:', vehicle);
    res.json({
      message: 'Véhicule mis à jour avec succès',
      vehicle
    });

  } catch (error) {
    console.error('❌ Erreur lors de la modification du véhicule:', error);
    res.status(500).json({
      message: 'Erreur lors de la modification du véhicule',
      error: error.message
    });
  }
});

// Route pour supprimer un véhicule
router.delete('/:companyId/vehicles/:vehicleId', async (req, res) => {
  console.log(`\n❌ DELETE /api/companies/${req.params.companyId}/vehicles/${req.params.vehicleId} - Suppression d'un véhicule`);

  try {
    const { companyId, vehicleId } = req.params;

    // Vérifier que le véhicule existe et appartient à la compagnie
    const [vehicles] = await pool.execute(`
      SELECT id FROM vehicles 
      WHERE id = ? AND company_id = ?
    `, [vehicleId, companyId]);

    if (!vehicles.length) {
      return res.status(404).json({
        message: 'Véhicule non trouvé ou n\'appartenant pas à cette compagnie'
      });
    }

    // Vérifier si le véhicule a des voyages en cours
    const [activeTrips] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM trips
      WHERE vehicle_id = ?
      AND status = 'in_progress'
    `, [vehicleId]);

    if (activeTrips[0].count > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer un véhicule ayant des voyages en cours'
      });
    }

    // Supprimer le véhicule
    await pool.execute(`
      DELETE FROM vehicles 
      WHERE id = ? AND company_id = ?
    `, [vehicleId, companyId]);

    console.log('✅ Véhicule supprimé avec succès');
    res.json({
      message: 'Véhicule supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression du véhicule:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression du véhicule',
      error: error.message
    });
  }
});

module.exports = router;
