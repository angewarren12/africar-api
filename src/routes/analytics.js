const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token non fourni' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide' });
  }
};

// Get booking statistics
router.get('/booking-stats', verifyToken, async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(total_price) as revenue,
        AVG(total_price) as averagePrice,
        SUM(commission_amount) as totalCommission,
        AVG(commission_amount) as averageCommission
      FROM bookings
      WHERE booking_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
    `);

    res.json({
      total: stats[0].total || 0,
      completed: stats[0].completed || 0,
      cancelled: stats[0].cancelled || 0,
      pending: stats[0].pending || 0,
      revenue: stats[0].revenue || 0,
      averagePrice: stats[0].averagePrice || 0,
      commission: {
        percentage: 15,
        totalAmount: stats[0].totalCommission || 0,
        averagePerBooking: stats[0].averageCommission || 0
      }
    });
  } catch (error) {
    console.error('Error getting booking stats:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
});

// Get company performance
router.get('/company-performance', verifyToken, async (req, res) => {
  try {
    const [companies] = await pool.execute(`
      SELECT 
        c.id as companyId,
        c.name as companyName,
        COUNT(b.id) as totalBookings,
        SUM(b.total_price) as revenue,
        AVG(r.rating) as rating,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) / COUNT(*) as completionRate
      FROM companies c
      LEFT JOIN routes rt ON rt.company_id = c.id
      LEFT JOIN bookings b ON b.route_id = rt.id
      LEFT JOIN reviews r ON r.booking_id = b.id
      GROUP BY c.id
      ORDER BY revenue DESC
      LIMIT 5
    `);

    res.json(companies);
  } catch (error) {
    console.error('Error getting company performance:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des performances' });
  }
});

// Get revenue over time
router.get('/revenue-over-time', verifyToken, async (req, res) => {
  try {
    const [revenue] = await pool.execute(`
      SELECT 
        DATE(booking_date) as date,
        SUM(total_price) as amount,
        SUM(commission_amount) as commission
      FROM bookings
      WHERE booking_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
      GROUP BY DATE(booking_date)
      ORDER BY date
    `);

    res.json(revenue);
  } catch (error) {
    console.error('Error getting revenue over time:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des revenus' });
  }
});

module.exports = router;
