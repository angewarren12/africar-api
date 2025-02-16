const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/companies/:companyId/trips - Récupérer tous les trajets d'une entreprise
router.get('/:companyId/trips', async (req, res) => {
  const { companyId } = req.params;
  const { status } = req.query;

  try {
    console.log('=== DÉBUT CHARGEMENT DES TRAJETS ===');
    console.log(`Entreprise ID: ${companyId}`);
    console.log(`Filtre statut: ${status || 'tous'}`);
    
    let query = `
      SELECT 
        t.*,
        r.departure_station_id,
        r.arrival_station_id,
        r.distance,
        r.duration,
        ds.name as departure_station_name,
        arr_s.name as arrival_station_name,
        v.registration_number,
        v.model,
        v.brand,
        p.first_name,
        p.last_name,
        p.phone,
        p.license_number
      FROM trips t
      LEFT JOIN routes r ON t.route_id = r.id
      LEFT JOIN stations ds ON r.departure_station_id = ds.id
      LEFT JOIN stations arr_s ON r.arrival_station_id = arr_s.id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN personnel p ON t.driver_id = p.id AND p.type = 'driver'
      WHERE t.company_id = ?
    `;

    const params = [companyId];

    if (status && status !== 'all') {
      query += ' AND t.status = ?';
      params.push(status);
    }

    query += ' ORDER BY t.departure_time DESC';

    console.log('=== REQUÊTE SQL ===');
    console.log(query);
    console.log('Paramètres:', params);

    const [trips] = await pool.execute(query, params);

    console.log('=== RÉSULTATS ===');
    console.log('Nombre de trajets trouvés:', trips.length);
    trips.forEach((trip, index) => {
      console.log(`\nTrajet #${index + 1}:`);
      console.log('ID:', trip.id);
      console.log('Route:', trip.departure_station_name, '->', trip.arrival_station_name);
      console.log('Chauffeur:', {
        name: `${trip.first_name || ''} ${trip.last_name || ''}`.trim(),
        phone: trip.phone || '',
        license: trip.license_number || ''
      });
      console.log('Véhicule:', {
        registration: trip.registration_number,
        brand: trip.brand,
        model: trip.model
      });
      console.log('Horaires:', {
        depart: trip.departure_time,
        arrivee: trip.arrival_time
      });
      console.log('Statut:', trip.status);
      console.log('Prix:', trip.price);
      console.log('Places disponibles:', trip.available_seats);
    });

    // Formater les données pour le frontend
    const formattedTrips = trips.map(trip => ({
      id: trip.id,
      company_id: trip.company_id,
      route_id: trip.route_id,
      vehicle_id: trip.vehicle_id,
      driver_id: trip.driver_id,
      departure_time: trip.departure_time,
      arrival_time: trip.arrival_time,
      status: trip.status,
      price: trip.price,
      available_seats: trip.available_seats,
      route: {
        departure_station_name: trip.departure_station_name,
        arrival_station_name: trip.arrival_station_name,
        distance: trip.distance,
        duration: trip.duration
      },
      vehicle: {
        registration_number: trip.registration_number,
        brand: trip.brand,
        model: trip.model
      },
      driver: {
        name: `${trip.first_name || ''} ${trip.last_name || ''}`.trim(),
        phone: trip.phone || '',
        license_number: trip.license_number || ''
      }
    }));

    console.log('\n=== DONNÉES ENVOYÉES AU FRONTEND ===');
    console.log(JSON.stringify(formattedTrips, null, 2));
    console.log('=== FIN CHARGEMENT DES TRAJETS ===\n');

    res.json(formattedTrips);
  } catch (error) {
    console.error('ERREUR:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des trajets' });
  }
});

// GET /api/companies/:companyId/trips/:id - Récupérer un trajet spécifique
router.get('/:companyId/trips/:id', async (req, res) => {
  const { companyId, id } = req.params;

  try {
    const [trips] = await pool.execute(
      `SELECT 
        t.*,
        r.departure_station_id,
        r.arrival_station_id,
        r.distance,
        r.duration,
        ds.name as departure_station_name,
        arr_s.name as arrival_station_name,
        v.registration_number,
        v.model,
        CONCAT(p.first_name, ' ', p.last_name) as driver_name
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN stations ds ON r.departure_station_id = ds.id
      JOIN stations arr_s ON r.arrival_station_id = arr_s.id
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN personnel p ON t.driver_id = p.id
      WHERE t.company_id = ? AND t.id = ?`,
      [companyId, id]
    );

    if (trips.length === 0) {
      return res.status(404).json({
        message: 'Trajet non trouvé'
      });
    }

    const trip = trips[0];
    const formattedTrip = {
      id: trip.id,
      company_id: trip.company_id,
      route_id: trip.route_id,
      vehicle_id: trip.vehicle_id,
      driver_id: trip.driver_id,
      departure_time: trip.departure_time,
      arrival_time: trip.arrival_time,
      status: trip.status,
      price: trip.price,
      available_seats: trip.available_seats,
      created_at: trip.created_at,
      updated_at: trip.updated_at,
      route: {
        departure_station_name: trip.departure_station_name,
        arrival_station_name: trip.arrival_station_name,
        distance: trip.distance,
        duration: trip.duration
      },
      vehicle: {
        registration_number: trip.registration_number,
        model: trip.model
      },
      driver: {
        name: trip.driver_name
      }
    };

    res.json(formattedTrip);
  } catch (error) {
    console.error('Erreur lors du chargement du trajet:', error);
    res.status(500).json({
      message: 'Erreur lors du chargement du trajet',
      error: error.message
    });
  }
});

// POST /api/companies/:companyId/trips - Créer un nouveau trajet
router.post('/:companyId/trips', async (req, res) => {
  const { companyId } = req.params;
  const {
    route_id,
    vehicle_id,
    driver_id,
    departure_time,
    arrival_time,
    price,
    available_seats
  } = req.body;

  try {
    // Vérifier que la route existe et appartient à l'entreprise
    const [routes] = await pool.execute(
      'SELECT id FROM routes WHERE id = ? AND company_id = ?',
      [route_id, companyId]
    );

    if (routes.length === 0) {
      return res.status(404).json({
        message: 'Route non trouvée ou n\'appartient pas à cette entreprise'
      });
    }

    // Vérifier que le véhicule existe et appartient à l'entreprise
    const [vehicles] = await pool.execute(
      'SELECT id FROM vehicles WHERE id = ? AND company_id = ? AND status = "active"',
      [vehicle_id, companyId]
    );

    if (vehicles.length === 0) {
      return res.status(404).json({
        message: 'Véhicule non trouvé, non disponible ou n\'appartient pas à cette entreprise'
      });
    }

    // Vérifier que le chauffeur existe et appartient à l'entreprise
    const [drivers] = await pool.execute(
      'SELECT id FROM personnel WHERE id = ? AND company_id = ? AND type = "driver" AND status = "active"',
      [driver_id, companyId]
    );

    if (drivers.length === 0) {
      return res.status(404).json({
        message: 'Chauffeur non trouvé, non disponible ou n\'appartient pas à cette entreprise'
      });
    }

    // Créer le trajet
    const [result] = await pool.execute(
      `INSERT INTO trips (
        company_id,
        route_id,
        vehicle_id,
        driver_id,
        departure_time,
        arrival_time,
        status,
        price,
        available_seats
      ) VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)`,
      [
        companyId,
        route_id,
        vehicle_id,
        driver_id,
        departure_time,
        arrival_time,
        price,
        available_seats
      ]
    );

    // Mettre à jour le statut du véhicule en "maintenance" (car "in_use" n'est pas une valeur valide)
    await pool.execute(
      'UPDATE vehicles SET status = "maintenance" WHERE id = ?',
      [vehicle_id]
    );

    res.status(201).json({
      message: 'Trajet créé avec succès',
      id: result.insertId
    });
  } catch (error) {
    console.error('Erreur lors de la création du trajet:', error);
    res.status(500).json({
      message: 'Erreur lors de la création du trajet',
      error: error.message
    });
  }
});

// PUT /api/companies/:companyId/trips/:id - Modifier un trajet existant
router.put('/:companyId/trips/:id', async (req, res) => {
  const { companyId, id } = req.params;
  const {
    route_id,
    vehicle_id,
    driver_id,
    departure_time,
    arrival_time,
    status,
    price,
    available_seats
  } = req.body;

  try {
    // Vérifier que le trajet existe et appartient à l'entreprise
    const [trips] = await pool.execute(
      'SELECT vehicle_id FROM trips WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (trips.length === 0) {
      return res.status(404).json({
        message: 'Trajet non trouvé ou n\'appartient pas à cette entreprise'
      });
    }

    const oldVehicleId = trips[0].vehicle_id;

    // Si le véhicule change, vérifier que le nouveau véhicule est disponible
    if (vehicle_id && vehicle_id !== oldVehicleId) {
      const [vehicles] = await pool.execute(
        'SELECT id FROM vehicles WHERE id = ? AND company_id = ? AND status = "available"',
        [vehicle_id, companyId]
      );

      if (vehicles.length === 0) {
        return res.status(404).json({
          message: 'Nouveau véhicule non trouvé, non disponible ou n\'appartient pas à cette entreprise'
        });
      }
    }

    // Construire la requête de mise à jour
    let updateQuery = 'UPDATE trips SET updated_at = CURRENT_TIMESTAMP';
    const updateParams = [];

    if (route_id) {
      updateQuery += ', route_id = ?';
      updateParams.push(route_id);
    }

    if (vehicle_id) {
      updateQuery += ', vehicle_id = ?';
      updateParams.push(vehicle_id);
    }

    if (driver_id) {
      updateQuery += ', driver_id = ?';
      updateParams.push(driver_id);
    }

    if (departure_time) {
      updateQuery += ', departure_time = ?';
      updateParams.push(departure_time);
    }

    if (arrival_time) {
      updateQuery += ', arrival_time = ?';
      updateParams.push(arrival_time);
    }

    if (status) {
      updateQuery += ', status = ?';
      updateParams.push(status);
    }

    if (price) {
      updateQuery += ', price = ?';
      updateParams.push(price);
    }

    if (available_seats) {
      updateQuery += ', available_seats = ?';
      updateParams.push(available_seats);
    }

    updateQuery += ' WHERE id = ? AND company_id = ?';
    updateParams.push(id, companyId);

    await pool.execute(updateQuery, updateParams);

    // Si le véhicule a changé, mettre à jour les statuts des véhicules
    if (vehicle_id && vehicle_id !== oldVehicleId) {
      // Libérer l'ancien véhicule
      await pool.execute(
        'UPDATE vehicles SET status = "available" WHERE id = ?',
        [oldVehicleId]
      );

      // Marquer le nouveau véhicule comme en utilisation
      await pool.execute(
        'UPDATE vehicles SET status = "in_use" WHERE id = ?',
        [vehicle_id]
      );
    }

    // Si le trajet est terminé ou annulé, libérer le véhicule
    if (status === 'completed' || status === 'cancelled') {
      await pool.execute(
        'UPDATE vehicles SET status = "available" WHERE id = ?',
        [oldVehicleId]
      );
    }

    res.json({
      message: 'Trajet mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du trajet:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du trajet',
      error: error.message
    });
  }
});

// DELETE /api/companies/:companyId/trips/:id - Supprimer un trajet
router.delete('/:companyId/trips/:id', async (req, res) => {
  const { companyId, id } = req.params;

  try {
    // Vérifier que le trajet existe et appartient à l'entreprise
    const [trips] = await pool.execute(
      'SELECT vehicle_id FROM trips WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (trips.length === 0) {
      return res.status(404).json({
        message: 'Trajet non trouvé ou n\'appartient pas à cette entreprise'
      });
    }

    // Libérer le véhicule
    await pool.execute(
      'UPDATE vehicles SET status = "available" WHERE id = ?',
      [trips[0].vehicle_id]
    );

    // Supprimer le trajet
    await pool.execute(
      'DELETE FROM trips WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    res.json({
      message: 'Trajet supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du trajet:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression du trajet',
      error: error.message
    });
  }
});

// Exporter le router pour l'utiliser dans index.js
module.exports = router;
