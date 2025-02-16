const express = require('express');
const serverless = require('serverless-http');
const app = express();
const cors = require('cors');
const pool = require('../../src/config/database');

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());

// Routes
const router = express.Router();

// Companies routes
router.get('/companies', async (req, res) => {
  try {
    const [companies] = await pool.execute(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM stations WHERE company_id = c.id) as stations_count,
        (SELECT COUNT(*) FROM personnel WHERE company_id = c.id AND type = 'driver') as drivers_count,
        (SELECT COUNT(*) FROM vehicles WHERE company_id = c.id) as vehicles_count
      FROM companies c
      ORDER BY c.created_at DESC
    `);
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Error fetching companies' });
  }
});

// Bookings routes
router.get('/bookings', async (req, res) => {
  try {
    const [bookings] = await pool.execute(`
      SELECT 
        b.booking_id,
        b.trip_id,
        b.customer_id,
        b.total_amount,
        b.seats_booked,
        b.passenger_info,
        b.status as booking_status,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        t.departure_time,
        t.arrival_time,
        ds.name as departure_city,
        arr_s.name as arrival_city
      FROM bookings b 
      JOIN customers c ON b.customer_id = c.id
      JOIN trips t ON b.trip_id = t.id
      JOIN routes r ON t.route_id = r.id
      JOIN stations ds ON r.departure_station_id = ds.id
      JOIN stations arr_s ON r.arrival_station_id = arr_s.id
      ORDER BY b.created_at DESC
    `);
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Add more routes as needed...

app.use('/api', router);

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
