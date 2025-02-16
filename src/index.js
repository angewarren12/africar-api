require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');
const dashboardRoutes = require('./routes/dashboard');
const companiesRoutes = require('./routes/companies');
const personnelRoutes = require('./routes/personnel');
const routesRoutes = require('./routes/routes');
const tripsRoutes = require('./routes/trips');
const tripStopsRouter = require('./routes/tripStops');
const customersRouter = require('./routes/customers');
const dashboardRouter = require('./routes/dashboard');
const bookingsRoutes = require('./routes/bookings');
const pool = require('./config/database');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'], // URLs du frontend Vite
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Test de la connexion à la base de données
pool.getConnection()
  .then(connection => {
    console.log('\n✅ Connecté à la base de données MySQL');
    console.log('📊 Configuration de la base de données:');
    console.log('  - Host:', process.env.DB_HOST || 'localhost');
    console.log('  - User:', process.env.DB_USER || 'africar_user');
    console.log('  - Database:', process.env.DB_NAME || 'africar_db');
    connection.release();
  })
  .catch(err => {
    console.error('\n❌ Erreur de connexion à la base de données:');
    console.error(err);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('\n❌ Erreur globale:');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({
    message: 'Une erreur est survenue',
    error: err.message
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/companies', companiesRoutes);
app.use('/api/companies', personnelRoutes); // Les routes du personnel sont sous /api/companies/:companyId/personnel
app.use('/api/companies', routesRoutes); // Les routes de transport sont sous /api/companies/:companyId/routes
app.use('/api/companies', tripsRoutes); // Les routes des trajets sont sous /api/companies/:companyId/trips
app.use('/api/companies', tripStopsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/bookings', bookingsRoutes);

const PORT = process.env.PORT || 3002;

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré sur le port ${PORT}`);
  console.log('\n📍 Routes disponibles:');
  console.log('  /api/auth');
  console.log('  /api/analytics');
  console.log('  /api/dashboard');
  console.log('  /api/companies');
  console.log('  /api/companies/:companyId/personnel');
  console.log('  /api/companies/:companyId/routes');
  console.log('  /api/companies/:companyId/trips');
  console.log('  /api/customers');
  console.log('  /api/bookings');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Le port ${PORT} est déjà utilisé`);
  } else {
    console.error('❌ Erreur lors du démarrage du serveur:', err);
  }
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  server.close(() => {
    process.exit(1);
  });
});
