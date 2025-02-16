const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all bookings
router.get('/', async (req, res) => {
    console.log('📋 GET /api/bookings - Récupération de toutes les réservations');
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
                b.created_at,
                b.updated_at,
                c.first_name,
                c.last_name,
                c.email,
                c.phone,
                t.departure_time,
                t.arrival_time,
                t.price,
                t.status as trip_status,
                ds.name as departure_city,
                ds.address as departure_address,
                arr_s.name as arrival_city,
                arr_s.address as arrival_address,
                v.registration_number,
                v.model,
                v.brand,
                r.distance,
                r.duration
            FROM bookings b 
            JOIN customers c ON b.customer_id = c.id
            JOIN trips t ON b.trip_id = t.id
            JOIN routes r ON t.route_id = r.id
            JOIN stations ds ON r.departure_station_id = ds.id
            JOIN stations arr_s ON r.arrival_station_id = arr_s.id
            LEFT JOIN vehicles v ON t.vehicle_id = v.id
            ORDER BY b.created_at DESC
        `);

        console.log(`📊 ${bookings.length} réservations trouvées`);

        // Format passenger info if it's stored as a JSON string
        const formattedBookings = bookings.map(booking => ({
            ...booking,
            passenger_info: typeof booking.passenger_info === 'string' 
                ? JSON.parse(booking.passenger_info)
                : booking.passenger_info
        }));

        res.json({
            status: 'success',
            data: formattedBookings
        });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des réservations:', error);
        res.status(500).json({
            status: 'error',
            message: 'Une erreur est survenue lors de la récupération des réservations',
            error: error.message
        });
    }
});

// Get booking by ID
router.get('/:id', async (req, res) => {
    console.log(`🔍 GET /api/bookings/${req.params.id} - Récupération d'une réservation`);
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
                b.created_at,
                b.updated_at,
                c.first_name,
                c.last_name,
                c.email,
                c.phone,
                t.departure_time,
                t.arrival_time,
                t.price,
                t.status as trip_status,
                ds.name as departure_city,
                ds.address as departure_address,
                arr_s.name as arrival_city,
                arr_s.address as arrival_address,
                v.registration_number,
                v.model,
                v.brand,
                r.distance,
                r.duration
            FROM bookings b 
            JOIN customers c ON b.customer_id = c.id
            JOIN trips t ON b.trip_id = t.id
            JOIN routes r ON t.route_id = r.id
            JOIN stations ds ON r.departure_station_id = ds.id
            JOIN stations arr_s ON r.arrival_station_id = arr_s.id
            LEFT JOIN vehicles v ON t.vehicle_id = v.id
            WHERE b.booking_id = ?
        `, [req.params.id]);

        if (bookings.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Réservation non trouvée'
            });
        }

        // Format passenger info if it's stored as a JSON string
        const booking = {
            ...bookings[0],
            passenger_info: typeof bookings[0].passenger_info === 'string'
                ? JSON.parse(bookings[0].passenger_info)
                : bookings[0].passenger_info
        };

        console.log('✅ Réservation trouvée');
        res.json({
            status: 'success',
            data: booking
        });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de la réservation:', error);
        res.status(500).json({
            status: 'error',
            message: 'Une erreur est survenue lors de la récupération de la réservation',
            error: error.message
        });
    }
});

// Update booking status
router.put('/:id/status', async (req, res) => {
    console.log(`🔄 PUT /api/bookings/${req.params.id}/status - Mise à jour du statut`);
    try {
        const { status } = req.body;
        const [result] = await pool.execute(
            'UPDATE bookings SET status = ?, updated_at = NOW() WHERE booking_id = ?',
            [status, req.params.id]
        );

        if (result.affectedRows === 0) {
            console.log('❌ Réservation non trouvée');
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Récupérer la réservation mise à jour avec toutes les informations
        const [updatedBooking] = await pool.execute(`
            SELECT 
                b.booking_id,
                b.trip_id,
                b.customer_id,
                b.total_amount,
                b.seats_booked,
                b.passenger_info,
                b.status as booking_status,
                b.created_at,
                b.updated_at,
                c.first_name,
                c.last_name,
                c.email,
                c.phone,
                t.departure_time,
                t.arrival_time,
                t.price,
                ds.name as departure_city,
                arr_s.name as arrival_city
            FROM bookings b 
            JOIN customers c ON b.customer_id = c.id
            JOIN trips t ON b.trip_id = t.id
            JOIN routes r ON t.route_id = r.id
            JOIN stations ds ON r.departure_station_id = ds.id
            JOIN stations arr_s ON r.arrival_station_id = arr_s.id
            WHERE b.booking_id = ?
        `, [req.params.id]);

        console.log('✅ Statut mis à jour avec succès');
        res.json(updatedBooking[0]);
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du statut:', error);
        res.status(500).json({ message: 'Error updating booking status', error: error.message });
    }
});

module.exports = router;
