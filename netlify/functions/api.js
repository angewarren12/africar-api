const express = require('express');
const serverless = require('serverless-http');
const app = express();
const cors = require('cors');
const routes = require('../../src/routes');

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', routes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Une erreur est survenue',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Export the handler
exports.handler = serverless(app);
