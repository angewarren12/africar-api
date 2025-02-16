const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('\n=== TENTATIVE DE CONNEXION ===');
    console.log('Email:', email);
    console.log('Mot de passe fourni:', '****' + password.slice(-4));
    console.log('Date:', new Date().toLocaleString());
    console.log('===============================\n');
    
    // Vérifier si l'email existe
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log('\n=== UTILISATEUR NON TROUVÉ ===');
      console.log('Email:', email);
      console.log('Erreur: Email non trouvé dans la base de données');
      console.log('===============================\n');
      
      return res.status(401).json({ 
        message: 'Adresse email non trouvée',
        error: 'EMAIL_NOT_FOUND'
      });
    }

    const user = users[0];
    console.log('\n=== UTILISATEUR TROUVÉ ===');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Nom:', user.full_name);
    console.log('Rôle:', user.role);
    console.log('=========================\n');

    // Comparaison directe des mots de passe (temporaire, pour test)
    const isValidPassword = password === user.password;
    
    if (!isValidPassword) {
      console.log('\n=== MOT DE PASSE INCORRECT ===');
      console.log('Email:', email);
      console.log('Mot de passe fourni:', '****' + password.slice(-4));
      console.log('Mot de passe stocké:', '****' + user.password.slice(-4));
      console.log('Date:', new Date().toLocaleString());
      console.log('==============================\n');

      return res.status(401).json({ 
        message: 'Mot de passe incorrect',
        error: 'INVALID_PASSWORD'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('\n=== CONNEXION RÉUSSIE ===');
    console.log('Utilisateur:', {
      id: user.id,
      email: user.email,
      nom: user.full_name,
      role: user.role
    });
    console.log('Token expire dans:', '24h');
    console.log('Date:', new Date().toLocaleString());
    console.log('========================\n');

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.log('\n=== ERREUR SERVEUR ===');
    console.log('Message:', error.message);
    console.log('Stack:', error.stack);
    console.log('Date:', new Date().toLocaleString());
    console.log('=====================\n');

    res.status(500).json({ 
      message: 'Une erreur est survenue lors de la connexion',
      error: 'SERVER_ERROR'
    });
  }
});

module.exports = router;
