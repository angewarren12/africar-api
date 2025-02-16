const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Validation des données du personnel
const validatePersonnel = (data) => {
  const errors = [];
  
  // Champs requis
  if (!data.type || !['driver', 'agent'].includes(data.type)) {
    errors.push('Type invalide (doit être "driver" ou "agent")');
  }
  if (!data.first_name) errors.push('Prénom requis');
  if (!data.last_name) errors.push('Nom requis');
  if (!data.email) errors.push('Email requis');
  if (!data.password) errors.push('Mot de passe requis');
  if (!data.hire_date) errors.push('Date d\'embauche requise');

  // Validation des longueurs
  if (data.first_name && data.first_name.length > 100) {
    errors.push('Le prénom ne doit pas dépasser 100 caractères');
  }
  if (data.last_name && data.last_name.length > 100) {
    errors.push('Le nom ne doit pas dépasser 100 caractères');
  }
  if (data.email && data.email.length > 255) {
    errors.push('L\'email ne doit pas dépasser 255 caractères');
  }
  if (data.password && data.password.length > 255) {
    errors.push('Le mot de passe ne doit pas dépasser 255 caractères');
  }
  if (data.phone && data.phone.length > 20) {
    errors.push('Le numéro de téléphone ne doit pas dépasser 20 caractères');
  }
  if (data.license_number && data.license_number.length > 50) {
    errors.push('Le numéro de permis ne doit pas dépasser 50 caractères');
  }
  if (data.license_type && data.license_type.length > 50) {
    errors.push('Le type de permis ne doit pas dépasser 50 caractères');
  }
  if (data.role && data.role.length > 50) {
    errors.push('Le rôle ne doit pas dépasser 50 caractères');
  }

  // Validation du statut
  if (data.status && !['active', 'inactive', 'on_leave'].includes(data.status)) {
    errors.push('Statut invalide');
  }

  return errors;
};

// Route pour récupérer tout le personnel d'une compagnie
router.get('/:companyId/personnel', async (req, res) => {
  console.log(`[Personnel] Fetching all personnel for company ${req.params.companyId}`);
  
  try {
    const { type, station_id } = req.query;
    const companyId = req.params.companyId;
    
    let query = `
      SELECT 
        p.*,
        s.name as station_name
      FROM personnel p
      LEFT JOIN stations s ON p.station_id = s.id
      WHERE p.company_id = ?
    `;
    
    const queryParams = [companyId];

    if (type) {
      query += ' AND p.type = ?';
      queryParams.push(type);
    }

    if (station_id) {
      query += ' AND p.station_id = ?';
      queryParams.push(station_id);
    }

    query += ' ORDER BY p.created_at DESC';

    const [personnel] = await pool.execute(query, queryParams);

    console.log(`[Personnel] Successfully retrieved ${personnel.length} personnel records for company ${req.params.companyId}`);
    res.json(personnel);

  } catch (error) {
    console.error(`[Personnel] Error fetching personnel for company ${req.params.companyId}: ${error.message}`);
    res.status(500).json({
      message: 'Erreur lors de la récupération du personnel',
      error: error.message
    });
  }
});

// Route pour récupérer un membre du personnel spécifique
router.get('/:companyId/personnel/:personnelId', async (req, res) => {
  console.log(`[Personnel] Fetching personnel ${req.params.personnelId} for company ${req.params.companyId}`);
  
  try {
    const [personnel] = await pool.execute(`
      SELECT 
        p.*,
        s.name as station_name
      FROM personnel p
      LEFT JOIN stations s ON p.station_id = s.id
      WHERE p.id = ? AND p.company_id = ?
    `, [req.params.personnelId, req.params.companyId]);

    if (!personnel.length) {
      console.log(`[Personnel] Personnel ${req.params.personnelId} not found for company ${req.params.companyId}`);
      return res.status(404).json({
        message: 'Personnel non trouvé'
      });
    }

    console.log(`[Personnel] Successfully retrieved personnel ${req.params.personnelId}`);
    res.json(personnel[0]);

  } catch (error) {
    console.error(`[Personnel] Error fetching personnel ${req.params.personnelId}: ${error.message}`);
    res.status(500).json({
      message: 'Erreur lors de la récupération du personnel',
      error: error.message
    });
  }
});

// Route pour créer un nouveau membre du personnel
router.post('/:companyId/personnel', async (req, res) => {
  console.log(`[Personnel] Creating new personnel for company ${req.params.companyId}`, { 
    type: req.body.type,
    email: req.body.email 
  });
  
  try {
    const companyId = req.params.companyId;
    const {
      type,
      first_name,
      last_name,
      email,
      password,
      phone,
      address,
      birth_date,
      hire_date,
      status = 'active',
      license_number,
      license_expiry_date,
      license_type,
      role,
      station_id
    } = req.body;

    // Validation des données
    const validationErrors = validatePersonnel(req.body);
    if (validationErrors.length > 0) {
      console.log(`[Personnel] Validation error for new personnel: ${validationErrors[0]}`);
      return res.status(400).json({
        message: 'Données invalides',
        errors: validationErrors
      });
    }

    // Vérifier si l'email existe déjà
    const [existingPersonnel] = await pool.execute(
      'SELECT id FROM personnel WHERE email = ?',
      [email]
    );

    if (existingPersonnel.length > 0) {
      console.log(`[Personnel] Email ${email} already exists`);
      return res.status(400).json({
        message: 'Cette adresse email est déjà utilisée'
      });
    }

    // Vérifier si la station existe si station_id est fourni
    if (station_id) {
      const [station] = await pool.execute(
        'SELECT id FROM stations WHERE id = ? AND company_id = ?',
        [station_id, companyId]
      );

      if (station.length === 0) {
        console.log(`[Personnel] Station ${station_id} does not exist for company ${companyId}`);
        return res.status(400).json({
          message: 'Station invalide'
        });
      }
    }

    // Insérer le nouveau membre du personnel
    const [result] = await pool.execute(`
      INSERT INTO personnel (
        company_id,
        type,
        first_name,
        last_name,
        email,
        password,
        phone,
        address,
        birth_date,
        hire_date,
        status,
        license_number,
        license_expiry_date,
        license_type,
        role,
        station_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      companyId,
      type,
      first_name,
      last_name,
      email,
      password,
      phone || null,
      address || null,
      birth_date || null,
      hire_date,
      status,
      license_number || null,
      license_expiry_date || null,
      license_type || null,
      role || null,
      station_id || null
    ]);

    // Récupérer le membre du personnel créé
    const [personnel] = await pool.execute(`
      SELECT 
        p.*,
        s.name as station_name
      FROM personnel p
      LEFT JOIN stations s ON p.station_id = s.id
      WHERE p.id = ?
    `, [result.insertId]);

    console.log(`[Personnel] Successfully created new personnel with ID ${result.insertId}`);
    res.status(201).json(personnel[0]);

  } catch (error) {
    console.error(`[Personnel] Error creating personnel: ${error.message}`);
    res.status(500).json({
      message: 'Erreur lors de la création du personnel',
      error: error.message
    });
  }
});

// Route pour modifier un membre du personnel
router.put('/:companyId/personnel/:personnelId', async (req, res) => {
  console.log(`[Personnel] Updating personnel ${req.params.personnelId} for company ${req.params.companyId}`);
  
  try {
    const { companyId, personnelId } = req.params;
    const updateData = req.body;

    // Vérifier que le personnel existe
    const [existingPersonnel] = await pool.execute(
      'SELECT * FROM personnel WHERE id = ? AND company_id = ?',
      [personnelId, companyId]
    );

    if (!existingPersonnel.length) {
      console.log(`[Personnel] Personnel ${personnelId} not found for company ${companyId}`);
      return res.status(404).json({
        message: 'Personnel non trouvé'
      });
    }

    // Validation des données
    const validationErrors = validatePersonnel({
      ...existingPersonnel[0],
      ...updateData
    });
    
    if (validationErrors.length > 0) {
      console.log(`[Personnel] Validation error for updated personnel: ${validationErrors[0]}`);
      return res.status(400).json({
        message: 'Données invalides',
        errors: validationErrors
      });
    }

    // Vérifier si le nouvel email existe déjà
    if (updateData.email && updateData.email !== existingPersonnel[0].email) {
      const [existingEmail] = await pool.execute(
        'SELECT id FROM personnel WHERE email = ? AND id != ?',
        [updateData.email, personnelId]
      );

      if (existingEmail.length > 0) {
        console.log(`[Personnel] Email ${updateData.email} already exists`);
        return res.status(400).json({
          message: 'Cette adresse email est déjà utilisée'
        });
      }
    }

    // Vérifier si la nouvelle station existe
    if (updateData.station_id) {
      const [station] = await pool.execute(
        'SELECT id FROM stations WHERE id = ? AND company_id = ?',
        [updateData.station_id, companyId]
      );

      if (station.length === 0) {
        console.log(`[Personnel] Station ${updateData.station_id} does not exist for company ${companyId}`);
        return res.status(400).json({
          message: 'Station invalide'
        });
      }
    }

    // Construire la requête de mise à jour
    const updates = [];
    const values = [];

    // Liste des champs pouvant être mis à jour
    const updatableFields = [
      'type',
      'first_name',
      'last_name',
      'email',
      'password',
      'phone',
      'address',
      'birth_date',
      'hire_date',
      'status',
      'license_number',
      'license_expiry_date',
      'license_type',
      'role',
      'station_id'
    ];

    updatableFields.forEach(field => {
      if (field in updateData) {
        updates.push(`${field} = ?`);
        values.push(updateData[field] === '' ? null : updateData[field]);
      }
    });

    if (updates.length === 0) {
      console.log(`[Personnel] No data to update for personnel ${personnelId}`);
      return res.status(400).json({
        message: 'Aucune donnée à mettre à jour'
      });
    }

    // Ajouter les paramètres pour la clause WHERE
    values.push(personnelId, companyId);

    // Exécuter la mise à jour
    await pool.execute(`
      UPDATE personnel 
      SET ${updates.join(', ')}
      WHERE id = ? AND company_id = ?
    `, values);

    // Récupérer le personnel mis à jour
    const [updatedPersonnel] = await pool.execute(`
      SELECT 
        p.*,
        s.name as station_name
      FROM personnel p
      LEFT JOIN stations s ON p.station_id = s.id
      WHERE p.id = ?
    `, [personnelId]);

    console.log(`[Personnel] Successfully updated personnel ${personnelId}`);
    res.json(updatedPersonnel[0]);

  } catch (error) {
    console.error(`[Personnel] Error updating personnel ${personnelId}: ${error.message}`);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du personnel',
      error: error.message
    });
  }
});

// Route pour supprimer un membre du personnel
router.delete('/:companyId/personnel/:personnelId', async (req, res) => {
  console.log(`[Personnel] Deleting personnel ${req.params.personnelId} from company ${req.params.companyId}`);

  try {
    const { companyId, personnelId } = req.params;

    // Vérifier que le personnel existe
    const [existingPersonnel] = await pool.execute(
      'SELECT * FROM personnel WHERE id = ? AND company_id = ?',
      [personnelId, companyId]
    );

    if (!existingPersonnel.length) {
      console.log(`[Personnel] Personnel ${personnelId} not found for company ${companyId}`);
      return res.status(404).json({
        message: 'Personnel non trouvé'
      });
    }

    // Vérifier les dépendances
    if (existingPersonnel[0].type === 'driver') {
      // Vérifier les voyages en cours
      const [activeTrips] = await pool.execute(`
        SELECT COUNT(*) as count
        FROM trips
        WHERE driver_id = ?
        AND status = 'in_progress'
      `, [personnelId]);

      if (activeTrips[0].count > 0) {
        console.log(`[Personnel] Driver ${personnelId} has active trips`);
        return res.status(400).json({
          message: 'Impossible de supprimer un chauffeur ayant des voyages en cours'
        });
      }
    }

    // Supprimer le membre du personnel
    await pool.execute(
      'DELETE FROM personnel WHERE id = ? AND company_id = ?',
      [personnelId, companyId]
    );

    console.log(`[Personnel] Successfully deleted personnel ${personnelId}`);
    res.json({
      message: 'Personnel supprimé avec succès'
    });

  } catch (error) {
    console.error(`[Personnel] Error deleting personnel ${personnelId}: ${error.message}`);
    res.status(500).json({
      message: 'Erreur lors de la suppression du personnel',
      error: error.message
    });
  }
});

module.exports = router;
