const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/companies/:companyId/trips/:tripId/stops - Récupérer tous les arrêts d'un trajet
router.get('/:companyId/trips/:tripId/stops', async (req, res) => {
  const { companyId, tripId } = req.params;

  try {
    // Vérifier que le trajet appartient à l'entreprise
    const [trips] = await pool.execute(
      'SELECT id FROM trips WHERE id = ? AND company_id = ?',
      [tripId, companyId]
    );

    if (trips.length === 0) {
      return res.status(404).json({
        message: 'Trajet non trouvé ou n\'appartient pas à cette entreprise'
      });
    }

    // Récupérer tous les arrêts avec les informations de la station
    const [stops] = await pool.execute(`
      SELECT 
        ts.*,
        s.name as station_name,
        s.city as station_city,
        s.address as station_address,
        s.latitude as station_latitude,
        s.longitude as station_longitude
      FROM trip_stops ts
      JOIN stations s ON ts.station_id = s.id
      WHERE ts.trip_id = ?
      ORDER BY ts.stop_order
    `, [tripId]);

    res.json(stops);
  } catch (error) {
    console.error('Erreur lors de la récupération des arrêts:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des arrêts',
      error: error.message
    });
  }
});

// POST /api/companies/:companyId/trips/:tripId/stops - Ajouter un nouvel arrêt
router.post('/:companyId/trips/:tripId/stops', async (req, res) => {
  const { companyId, tripId } = req.params;
  const {
    station_id,
    arrival_time,
    departure_time,
    stop_order,
    price,
    available_seats,
    platform,
    notes
  } = req.body;

  try {
    // Vérifier que le trajet existe et appartient à l'entreprise
    const [trips] = await pool.execute(
      'SELECT id FROM trips WHERE id = ? AND company_id = ?',
      [tripId, companyId]
    );

    if (trips.length === 0) {
      return res.status(404).json({
        message: 'Trajet non trouvé ou n\'appartient pas à cette entreprise'
      });
    }

    // Vérifier que la station existe et appartient à l'entreprise
    const [stations] = await pool.execute(
      'SELECT id FROM stations WHERE id = ? AND company_id = ?',
      [station_id, companyId]
    );

    if (stations.length === 0) {
      return res.status(404).json({
        message: 'Station non trouvée ou n\'appartient pas à cette entreprise'
      });
    }

    // Insérer le nouvel arrêt
    const [result] = await pool.execute(`
      INSERT INTO trip_stops (
        trip_id,
        station_id,
        arrival_time,
        departure_time,
        stop_order,
        price,
        available_seats,
        platform,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tripId,
      station_id,
      arrival_time,
      departure_time,
      stop_order,
      price,
      available_seats,
      platform,
      notes
    ]);

    // Récupérer l'arrêt créé avec les informations de la station
    const [newStop] = await pool.execute(`
      SELECT 
        ts.*,
        s.name as station_name,
        s.city as station_city,
        s.address as station_address,
        s.latitude as station_latitude,
        s.longitude as station_longitude
      FROM trip_stops ts
      JOIN stations s ON ts.station_id = s.id
      WHERE ts.id = ?
    `, [result.insertId]);

    res.status(201).json(newStop[0]);
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'arrêt:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'ajout de l\'arrêt',
      error: error.message
    });
  }
});

// PUT /api/companies/:companyId/trips/:tripId/stops/:stopId - Mettre à jour un arrêt
router.put('/:companyId/trips/:tripId/stops/:stopId', async (req, res) => {
  const { companyId, tripId, stopId } = req.params;
  const {
    station_id,
    arrival_time,
    departure_time,
    stop_order,
    price,
    available_seats,
    boarding_count,
    alighting_count,
    status,
    platform,
    notes
  } = req.body;

  try {
    // Vérifier que l'arrêt existe et appartient au bon trajet/entreprise
    const [stops] = await pool.execute(`
      SELECT ts.* 
      FROM trip_stops ts
      JOIN trips t ON ts.trip_id = t.id
      WHERE ts.id = ? AND ts.trip_id = ? AND t.company_id = ?
    `, [stopId, tripId, companyId]);

    if (stops.length === 0) {
      return res.status(404).json({
        message: 'Arrêt non trouvé ou n\'appartient pas à ce trajet/entreprise'
      });
    }

    // Si une nouvelle station est spécifiée, vérifier qu'elle appartient à l'entreprise
    if (station_id) {
      const [stations] = await pool.execute(
        'SELECT id FROM stations WHERE id = ? AND company_id = ?',
        [station_id, companyId]
      );

      if (stations.length === 0) {
        return res.status(404).json({
          message: 'Station non trouvée ou n\'appartient pas à cette entreprise'
        });
      }
    }

    // Mettre à jour l'arrêt
    await pool.execute(`
      UPDATE trip_stops
      SET 
        station_id = COALESCE(?, station_id),
        arrival_time = COALESCE(?, arrival_time),
        departure_time = COALESCE(?, departure_time),
        stop_order = COALESCE(?, stop_order),
        price = COALESCE(?, price),
        available_seats = COALESCE(?, available_seats),
        boarding_count = COALESCE(?, boarding_count),
        alighting_count = COALESCE(?, alighting_count),
        status = COALESCE(?, status),
        platform = COALESCE(?, platform),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `, [
      station_id,
      arrival_time,
      departure_time,
      stop_order,
      price,
      available_seats,
      boarding_count,
      alighting_count,
      status,
      platform,
      notes,
      stopId
    ]);

    // Récupérer l'arrêt mis à jour
    const [updatedStop] = await pool.execute(`
      SELECT 
        ts.*,
        s.name as station_name,
        s.city as station_city,
        s.address as station_address,
        s.latitude as station_latitude,
        s.longitude as station_longitude
      FROM trip_stops ts
      JOIN stations s ON ts.station_id = s.id
      WHERE ts.id = ?
    `, [stopId]);

    res.json(updatedStop[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'arrêt:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour de l\'arrêt',
      error: error.message
    });
  }
});

// DELETE /api/companies/:companyId/trips/:tripId/stops/:stopId - Supprimer un arrêt
router.delete('/:companyId/trips/:tripId/stops/:stopId', async (req, res) => {
  const { companyId, tripId, stopId } = req.params;

  try {
    // Vérifier que l'arrêt existe et appartient au bon trajet/entreprise
    const [stops] = await pool.execute(`
      SELECT ts.* 
      FROM trip_stops ts
      JOIN trips t ON ts.trip_id = t.id
      WHERE ts.id = ? AND ts.trip_id = ? AND t.company_id = ?
    `, [stopId, tripId, companyId]);

    if (stops.length === 0) {
      return res.status(404).json({
        message: 'Arrêt non trouvé ou n\'appartient pas à ce trajet/entreprise'
      });
    }

    // Supprimer l'arrêt
    await pool.execute(
      'DELETE FROM trip_stops WHERE id = ?',
      [stopId]
    );

    // Réorganiser les stop_order des arrêts restants
    await pool.execute(`
      SET @rank = 0;
      UPDATE trip_stops
      SET stop_order = (@rank := @rank + 1)
      WHERE trip_id = ?
      ORDER BY arrival_time;
    `, [tripId]);

    res.json({ message: 'Arrêt supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'arrêt:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression de l\'arrêt',
      error: error.message
    });
  }
});

// GET /api/companies/:companyId/trips/:tripId/stops/stats - Statistiques des arrêts
router.get('/:companyId/trips/:tripId/stops/stats', async (req, res) => {
  const { companyId, tripId } = req.params;

  try {
    // Vérifier que le trajet appartient à l'entreprise
    const [trips] = await pool.execute(
      'SELECT id FROM trips WHERE id = ? AND company_id = ?',
      [tripId, companyId]
    );

    if (trips.length === 0) {
      return res.status(404).json({
        message: 'Trajet non trouvé ou n\'appartient pas à cette entreprise'
      });
    }

    // Calculer les statistiques
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_stops,
        SUM(boarding_count) as total_boardings,
        SUM(alighting_count) as total_alightings,
        MIN(available_seats) as min_available_seats,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_stops,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_stops
      FROM trip_stops
      WHERE trip_id = ?
    `, [tripId]);

    // Calculer le taux d'occupation moyen
    const [occupancyRate] = await pool.execute(`
      SELECT 
        ROUND(AVG(
          CASE 
            WHEN available_seats IS NOT NULL AND available_seats > 0
            THEN (1 - (available_seats / FIRST_VALUE(available_seats) OVER (ORDER BY stop_order))) * 100
            ELSE 0
          END
        ), 2) as avg_occupancy_rate
      FROM trip_stops
      WHERE trip_id = ?
    `, [tripId]);

    res.json({
      ...stats[0],
      avg_occupancy_rate: occupancyRate[0].avg_occupancy_rate
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

module.exports = router;
