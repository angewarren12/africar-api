const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/dashboard/stats - Statistiques globales
router.get('/stats', async (req, res) => {
  try {
    // Statistiques des clients
    const [customerStats] = await pool.execute(`
      SELECT
        COUNT(*) as total_customers,
        COUNT(CASE WHEN account_status = 'active' THEN 1 END) as active_customers,
        COUNT(CASE WHEN email_verified = TRUE THEN 1 END) as verified_customers,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_customers_30d
      FROM customers
    `);

    // Statistiques des entreprises
    const [companyStats] = await pool.execute(`
      SELECT
        COUNT(*) as total_companies,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_companies,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_companies_30d
      FROM companies
    `);

    // Statistiques des trajets
    const [tripStats] = await pool.execute(`
      SELECT
        COUNT(*) as total_trips,
        COUNT(CASE WHEN departure_time >= NOW() THEN 1 END) as upcoming_trips,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_trips_30d
      FROM trips
    `);

    // Statistiques des réservations (à implémenter plus tard)
    const bookingStats = {
      total_bookings: 0,
      pending_bookings: 0,
      completed_bookings: 0,
      revenue_30d: 0
    };

    res.json({
      customers: customerStats[0],
      companies: companyStats[0],
      trips: tripStats[0],
      bookings: bookingStats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

// GET /api/dashboard/customer-growth - Croissance des clients par mois
router.get('/customer-growth', async (req, res) => {
  try {
    const [results] = await pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as new_customers,
        COUNT(CASE WHEN account_status = 'active' THEN 1 END) as active_customers
      FROM customers
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    res.json(results);
  } catch (error) {
    console.error('Erreur lors de la récupération de la croissance:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de la croissance',
      error: error.message
    });
  }
});

// GET /api/dashboard/company-stats - Statistiques des entreprises
router.get('/company-stats', async (req, res) => {
  try {
    const [results] = await pool.execute(`
      SELECT 
        c.id,
        c.name,
        c.city,
        COUNT(DISTINCT t.id) as total_trips,
        COUNT(DISTINCT p.id) as total_personnel
      FROM companies c
      LEFT JOIN trips t ON t.company_id = c.id
      LEFT JOIN personnel p ON p.company_id = c.id
      WHERE c.status = 'active'
      GROUP BY c.id
      ORDER BY total_trips DESC
      LIMIT 5
    `);

    res.json(results);
  } catch (error) {
    console.error('Erreur lors de la récupération des stats entreprises:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des stats entreprises',
      error: error.message
    });
  }
});

// GET /api/dashboard/trip-stats - Statistiques des trajets par jour
router.get('/trip-stats', async (req, res) => {
  try {
    const [results] = await pool.execute(`
      SELECT 
        DATE_FORMAT(departure_time, '%Y-%m-%d') as date,
        COUNT(*) as total_trips,
        COUNT(DISTINCT company_id) as companies_count
      FROM trips
      WHERE departure_time BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND DATE_ADD(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE_FORMAT(departure_time, '%Y-%m-%d')
      ORDER BY date ASC
    `);

    res.json(results);
  } catch (error) {
    console.error('Erreur lors de la récupération des stats trajets:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des stats trajets',
      error: error.message
    });
  }
});

// GET /api/dashboard/recent-activities - Activités récentes
router.get('/recent-activities', async (req, res) => {
  try {
    // Nouveaux clients
    const [newCustomers] = await pool.execute(`
      SELECT 
        'new_customer' as type,
        id,
        CONCAT(first_name, ' ', last_name) as name,
        created_at as date
      FROM customers
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Nouvelles entreprises
    const [newCompanies] = await pool.execute(`
      SELECT 
        'new_company' as type,
        id,
        name,
        created_at as date
      FROM companies
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Nouveaux trajets
    const [newTrips] = await pool.execute(`
      SELECT 
        'new_trip' as type,
        t.id,
        CONCAT(c.name, ' - ', ds.city, ' → ', as.city) as name,
        t.created_at as date
      FROM trips t
      JOIN companies c ON t.company_id = c.id
      JOIN stations ds ON t.departure_station_id = ds.id
      JOIN stations as ON t.arrival_station_id = as.id
      WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY t.created_at DESC
      LIMIT 5
    `);

    // Combiner et trier toutes les activités
    const allActivities = [...newCustomers, ...newCompanies, ...newTrips]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    res.json(allActivities);
  } catch (error) {
    console.error('Erreur lors de la récupération des activités:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des activités',
      error: error.message
    });
  }
});

module.exports = router;
