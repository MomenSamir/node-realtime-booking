const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ========== SERVICES ROUTES ==========

// Get all services
app.get('/api/services', async (req, res) => {
  try {
    const [services] = await db.query('SELECT * FROM services ORDER BY name');
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get single service
app.get('/api/services/:id', async (req, res) => {
  try {
    const [services] = await db.query('SELECT * FROM services WHERE id = ?', [req.params.id]);
    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json(services[0]);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// ========== TIME SLOTS ROUTES ==========

// Get all time slots for a service
app.get('/api/services/:serviceId/slots', async (req, res) => {
  try {
    const [slots] = await db.query(`
      SELECT 
        ts.*,
        s.name as service_name,
        s.duration_minutes,
        s.price,
        b.customer_name,
        b.customer_email,
        b.status as booking_status
      FROM time_slots ts
      JOIN services s ON ts.service_id = s.id
      LEFT JOIN bookings b ON ts.id = b.time_slot_id AND b.status = 'confirmed'
      WHERE ts.service_id = ?
      ORDER BY ts.slot_date, ts.slot_time
    `, [req.params.serviceId]);
    
    res.json(slots);
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Failed to fetch time slots' });
  }
});

// Get all available slots (not booked)
app.get('/api/slots/available', async (req, res) => {
  try {
    const [slots] = await db.query(`
      SELECT 
        ts.*,
        s.name as service_name,
        s.duration_minutes,
        s.price
      FROM time_slots ts
      JOIN services s ON ts.service_id = s.id
      WHERE ts.is_available = TRUE
      AND ts.slot_date >= CURDATE()
      ORDER BY ts.slot_date, ts.slot_time
    `);
    
    res.json(slots);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

// ========== BOOKINGS ROUTES ==========

// Get all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const [bookings] = await db.query(`
      SELECT 
        b.*,
        ts.slot_date,
        ts.slot_time,
        s.name as service_name,
        s.duration_minutes,
        s.price
      FROM bookings b
      JOIN time_slots ts ON b.time_slot_id = ts.id
      JOIN services s ON ts.service_id = s.id
      ORDER BY ts.slot_date DESC, ts.slot_time DESC
    `);
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create a new booking
app.post('/api/bookings', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { time_slot_id, customer_name, customer_email, customer_phone, notes } = req.body;
    
    // Check if slot is still available
    const [slots] = await connection.query(
      'SELECT * FROM time_slots WHERE id = ? AND is_available = TRUE FOR UPDATE',
      [time_slot_id]
    );
    
    if (slots.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Time slot is no longer available' });
    }
    
    // Create booking
    const [bookingResult] = await connection.query(
      'INSERT INTO bookings (time_slot_id, customer_name, customer_email, customer_phone, notes) VALUES (?, ?, ?, ?, ?)',
      [time_slot_id, customer_name, customer_email, customer_phone, notes]
    );
    
    // Mark slot as unavailable
    await connection.query(
      'UPDATE time_slots SET is_available = FALSE WHERE id = ?',
      [time_slot_id]
    );
    
    await connection.commit();
    
    // Fetch the complete booking data
    const [newBooking] = await db.query(`
      SELECT 
        b.*,
        ts.slot_date,
        ts.slot_time,
        s.id as service_id,
        s.name as service_name,
        s.duration_minutes,
        s.price
      FROM bookings b
      JOIN time_slots ts ON b.time_slot_id = ts.id
      JOIN services s ON ts.service_id = s.id
      WHERE b.id = ?
    `, [bookingResult.insertId]);
    
    // Emit real-time event
    io.emit('booking_created', newBooking[0]);
    
    res.status(201).json(newBooking[0]);
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  } finally {
    connection.release();
  }
});

// Cancel a booking
app.patch('/api/bookings/:id/cancel', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Get booking info
    const [bookings] = await connection.query(
      'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
      [id]
    );
    
    if (bookings.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = bookings[0];
    
    // Update booking status
    await connection.query(
      'UPDATE bookings SET status = ? WHERE id = ?',
      ['cancelled', id]
    );
    
    // Make slot available again
    await connection.query(
      'UPDATE time_slots SET is_available = TRUE WHERE id = ?',
      [booking.time_slot_id]
    );
    
    await connection.commit();
    
    // Fetch updated booking
    const [updatedBooking] = await db.query(`
      SELECT 
        b.*,
        ts.slot_date,
        ts.slot_time,
        s.id as service_id,
        s.name as service_name,
        s.duration_minutes,
        s.price
      FROM bookings b
      JOIN time_slots ts ON b.time_slot_id = ts.id
      JOIN services s ON ts.service_id = s.id
      WHERE b.id = ?
    `, [id]);
    
    // Emit real-time event
    io.emit('booking_cancelled', updatedBooking[0]);
    
    res.json(updatedBooking[0]);
    
  } catch (error) {
    await connection.rollback();
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  } finally {
    connection.release();
  }
});

// Get booking statistics
app.get('/api/stats', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(*) as total_bookings
      FROM bookings
    `);
    
    const [availableSlots] = await db.query(`
      SELECT COUNT(*) as count
      FROM time_slots
      WHERE is_available = TRUE AND slot_date >= CURDATE()
    `);
    
    const [serviceStats] = await db.query(`
      SELECT 
        s.name,
        COUNT(b.id) as booking_count,
        SUM(s.price) as total_revenue
      FROM services s
      LEFT JOIN time_slots ts ON s.id = ts.service_id
      LEFT JOIN bookings b ON ts.id = b.time_slot_id AND b.status = 'confirmed'
      GROUP BY s.id, s.name
    `);
    
    res.json({
      summary: stats[0],
      available_slots: availableSlots[0].count,
      by_service: serviceStats
    });
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Booking system server running on port ${PORT}`);
});
