const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// POST /api/customers/register - Inscription d'un nouveau client
router.post('/register', async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    password,
    date_of_birth,
    gender,
    address,
    city,
    country,
    id_card_number,
    id_card_type
  } = req.body;

  try {
    // Vérifier si l'email existe déjà
    const [existingEmail] = await pool.execute(
      'SELECT id FROM customers WHERE email = ?',
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        message: 'Cet email est déjà utilisé'
      });
    }

    // Vérifier si le téléphone existe déjà
    const [existingPhone] = await pool.execute(
      'SELECT id FROM customers WHERE phone = ?',
      [phone]
    );

    if (existingPhone.length > 0) {
      return res.status(400).json({
        message: 'Ce numéro de téléphone est déjà utilisé'
      });
    }

    // Insérer le nouveau client
    const [result] = await pool.execute(`
      INSERT INTO customers (
        first_name,
        last_name,
        email,
        phone,
        password,
        date_of_birth,
        gender,
        address,
        city,
        country,
        id_card_number,
        id_card_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      first_name,
      last_name,
      email,
      phone,
      password, // À hasher plus tard
      date_of_birth,
      gender,
      address,
      city,
      country,
      id_card_number,
      id_card_type
    ]);

    // Récupérer le client créé
    const [newCustomer] = await pool.execute(
      'SELECT id, first_name, last_name, email, phone FROM customers WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newCustomer[0]);
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
});

// POST /api/customers/login - Connexion d'un client
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Rechercher le client par email
    const [customers] = await pool.execute(
      'SELECT * FROM customers WHERE email = ?',
      [email]
    );

    if (customers.length === 0) {
      return res.status(401).json({
        message: 'Email ou mot de passe incorrect'
      });
    }

    const customer = customers[0];

    // Vérifier le mot de passe (à améliorer plus tard avec le hachage)
    if (password !== customer.password) {
      return res.status(401).json({
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Mettre à jour la date de dernière connexion
    await pool.execute(
      'UPDATE customers SET last_login = NOW() WHERE id = ?',
      [customer.id]
    );

    // Ne pas renvoyer le mot de passe
    delete customer.password;

    res.json(customer);
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
});

// GET /api/customers/profile - Récupérer le profil du client connecté
router.get('/profile', async (req, res) => {
  // À implémenter avec l'authentification
  const customerId = req.customerId; // À récupérer du token plus tard

  try {
    const [customers] = await pool.execute(
      'SELECT * FROM customers WHERE id = ?',
      [customerId]
    );

    if (customers.length === 0) {
      return res.status(404).json({
        message: 'Client non trouvé'
      });
    }

    const customer = customers[0];
    delete customer.password;

    res.json(customer);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
});

// PUT /api/customers/profile - Mettre à jour le profil du client
router.put('/profile', async (req, res) => {
  // À implémenter avec l'authentification
  const customerId = req.customerId; // À récupérer du token plus tard

  const {
    first_name,
    last_name,
    date_of_birth,
    gender,
    address,
    city,
    country,
    id_card_number,
    id_card_type
  } = req.body;

  try {
    await pool.execute(`
      UPDATE customers
      SET 
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        date_of_birth = COALESCE(?, date_of_birth),
        gender = COALESCE(?, gender),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        country = COALESCE(?, country),
        id_card_number = COALESCE(?, id_card_number),
        id_card_type = COALESCE(?, id_card_type)
      WHERE id = ?
    `, [
      first_name,
      last_name,
      date_of_birth,
      gender,
      address,
      city,
      country,
      id_card_number,
      id_card_type,
      customerId
    ]);

    // Récupérer le profil mis à jour
    const [updatedCustomer] = await pool.execute(
      'SELECT * FROM customers WHERE id = ?',
      [customerId]
    );

    delete updatedCustomer[0].password;
    res.json(updatedCustomer[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message
    });
  }
});

// GET /api/customers - Liste des clients (pour l'admin)
router.get('/', async (req, res) => {
  try {
    const [customers] = await pool.execute(`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        phone,
        profile_photo,
        city,
        country,
        account_status,
        email_verified,
        phone_verified,
        last_login,
        created_at
      FROM customers
      ORDER BY created_at DESC
    `);

    res.json(customers);
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des clients',
      error: error.message
    });
  }
});

// PUT /api/customers/:id/status - Modifier le statut d'un client (pour l'admin)
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await pool.execute(
      'UPDATE customers SET account_status = ? WHERE id = ?',
      [status, id]
    );

    res.json({ message: 'Statut mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
});

module.exports = router;
