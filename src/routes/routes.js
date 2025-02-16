const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/companies/:companyId/routes - Récupérer toutes les routes d'une entreprise
router.get('/:companyId/routes', async (req, res) => {
  const { companyId } = req.params;

  try {
    const [routes] = await pool.execute(
      `SELECT 
        r.*,
        ds.name as departure_station_name,
        arr_s.name as arrival_station_name
      FROM routes r
      JOIN stations ds ON r.departure_station_id = ds.id
      JOIN stations arr_s ON r.arrival_station_id = arr_s.id
      WHERE r.company_id = ?
      ORDER BY r.created_at DESC`,
      [companyId]
    );

    res.json(routes);
  } catch (error) {
    console.error('Erreur lors du chargement des routes:', error);
    res.status(500).json({
      message: 'Erreur lors du chargement des routes',
      error: error.message
    });
  }
});

// GET /api/companies/:companyId/routes/:id - Récupérer une route spécifique
router.get('/:companyId/routes/:id', async (req, res) => {
  const { companyId, id } = req.params;

  try {
    const [routes] = await pool.execute(
      `SELECT 
        r.*,
        ds.name as departure_station_name,
        arr_s.name as arrival_station_name
      FROM routes r
      JOIN stations ds ON r.departure_station_id = ds.id
      JOIN stations arr_s ON r.arrival_station_id = arr_s.id
      WHERE r.company_id = ? AND r.id = ?`,
      [companyId, id]
    );

    if (routes.length === 0) {
      return res.status(404).json({
        message: 'Route non trouvée'
      });
    }

    res.json(routes[0]);
  } catch (error) {
    console.error('Erreur lors du chargement de la route:', error);
    res.status(500).json({
      message: 'Erreur lors du chargement de la route',
      error: error.message
    });
  }
});

// POST /api/companies/:companyId/routes - Créer une nouvelle route
router.post('/:companyId/routes', async (req, res) => {
  const { companyId } = req.params;
  const {
    departure_station_id,
    arrival_station_id,
    distance,
    duration,
    base_price
  } = req.body;

  try {
    // Vérifier que les stations existent et appartiennent à l'entreprise
    const [stations] = await pool.execute(
      'SELECT id FROM stations WHERE (id = ? OR id = ?) AND company_id = ?',
      [departure_station_id, arrival_station_id, companyId]
    );

    if (stations.length !== 2) {
      return res.status(404).json({
        message: 'Une ou plusieurs stations non trouvées ou n\'appartiennent pas à cette entreprise'
      });
    }

    // Vérifier que la route n'existe pas déjà
    const [existingRoutes] = await pool.execute(
      'SELECT id FROM routes WHERE departure_station_id = ? AND arrival_station_id = ? AND company_id = ?',
      [departure_station_id, arrival_station_id, companyId]
    );

    if (existingRoutes.length > 0) {
      return res.status(400).json({
        message: 'Une route existe déjà entre ces deux stations'
      });
    }

    // Créer la route
    const [result] = await pool.execute(
      `INSERT INTO routes (
        company_id,
        departure_station_id,
        arrival_station_id,
        distance,
        duration,
        base_price
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        departure_station_id,
        arrival_station_id,
        distance,
        duration,
        base_price
      ]
    );

    // Récupérer la route créée avec les noms des stations
    const [newRoute] = await pool.execute(
      `SELECT 
        r.*,
        ds.name as departure_station_name,
        arr_s.name as arrival_station_name
      FROM routes r
      JOIN stations ds ON r.departure_station_id = ds.id
      JOIN stations arr_s ON r.arrival_station_id = arr_s.id
      WHERE r.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newRoute[0]);
  } catch (error) {
    console.error('Erreur lors de la création de la route:', error);
    res.status(500).json({
      message: 'Erreur lors de la création de la route',
      error: error.message
    });
  }
});

// PUT /api/companies/:companyId/routes/:id - Modifier une route existante
router.put('/:companyId/routes/:id', async (req, res) => {
  const { companyId, id } = req.params;
  const {
    departure_station_id,
    arrival_station_id,
    distance,
    duration,
    base_price
  } = req.body;

  try {
    // Vérifier que la route existe et appartient à l'entreprise
    const [routes] = await pool.execute(
      'SELECT id FROM routes WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (routes.length === 0) {
      return res.status(404).json({
        message: 'Route non trouvée ou n\'appartient pas à cette entreprise'
      });
    }

    // Si les stations sont modifiées, vérifier qu'elles existent et appartiennent à l'entreprise
    if (departure_station_id || arrival_station_id) {
      const [stations] = await pool.execute(
        'SELECT id FROM stations WHERE (id = ? OR id = ?) AND company_id = ?',
        [
          departure_station_id || routes[0].departure_station_id,
          arrival_station_id || routes[0].arrival_station_id,
          companyId
        ]
      );

      if (stations.length !== 2) {
        return res.status(404).json({
          message: 'Une ou plusieurs stations non trouvées ou n\'appartiennent pas à cette entreprise'
        });
      }

      // Vérifier que la nouvelle combinaison de stations n'existe pas déjà
      const [existingRoutes] = await pool.execute(
        'SELECT id FROM routes WHERE departure_station_id = ? AND arrival_station_id = ? AND company_id = ? AND id != ?',
        [
          departure_station_id || routes[0].departure_station_id,
          arrival_station_id || routes[0].arrival_station_id,
          companyId,
          id
        ]
      );

      if (existingRoutes.length > 0) {
        return res.status(400).json({
          message: 'Une route existe déjà entre ces deux stations'
        });
      }
    }

    // Construire la requête de mise à jour
    let updateQuery = 'UPDATE routes SET updated_at = CURRENT_TIMESTAMP';
    const updateParams = [];

    if (departure_station_id) {
      updateQuery += ', departure_station_id = ?';
      updateParams.push(departure_station_id);
    }

    if (arrival_station_id) {
      updateQuery += ', arrival_station_id = ?';
      updateParams.push(arrival_station_id);
    }

    if (distance) {
      updateQuery += ', distance = ?';
      updateParams.push(distance);
    }

    if (duration) {
      updateQuery += ', duration = ?';
      updateParams.push(duration);
    }

    if (base_price) {
      updateQuery += ', base_price = ?';
      updateParams.push(base_price);
    }

    updateQuery += ' WHERE id = ? AND company_id = ?';
    updateParams.push(id, companyId);

    await pool.execute(updateQuery, updateParams);

    // Récupérer la route mise à jour
    const [updatedRoute] = await pool.execute(
      `SELECT 
        r.*,
        ds.name as departure_station_name,
        arr_s.name as arrival_station_name
      FROM routes r
      JOIN stations ds ON r.departure_station_id = ds.id
      JOIN stations arr_s ON r.arrival_station_id = arr_s.id
      WHERE r.id = ?`,
      [id]
    );

    res.json(updatedRoute[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la route:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour de la route',
      error: error.message
    });
  }
});

// DELETE /api/companies/:companyId/routes/:id - Supprimer une route
router.delete('/:companyId/routes/:id', async (req, res) => {
  const { companyId, id } = req.params;

  try {
    // Vérifier que la route existe et appartient à l'entreprise
    const [routes] = await pool.execute(
      'SELECT id FROM routes WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (routes.length === 0) {
      return res.status(404).json({
        message: 'Route non trouvée ou n\'appartient pas à cette entreprise'
      });
    }

    // Vérifier qu'aucun trajet n'utilise cette route
    const [trips] = await pool.execute(
      'SELECT id FROM trips WHERE route_id = ? AND (status = "scheduled" OR status = "in_progress")',
      [id]
    );

    if (trips.length > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer cette route car elle est utilisée par des trajets en cours ou programmés'
      });
    }

    // Supprimer la route
    await pool.execute(
      'DELETE FROM routes WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    res.json({
      message: 'Route supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la route:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression de la route',
      error: error.message
    });
  }
});

module.exports = router;
