-- Create database
CREATE DATABASE IF NOT EXISTS booking_system;

USE booking_system;

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create time_slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE KEY unique_slot (service_id, slot_date, slot_time)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  time_slot_id INT NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  notes TEXT,
  status ENUM('confirmed', 'cancelled', 'completed') DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (time_slot_id) REFERENCES time_slots(id) ON DELETE CASCADE
);

-- Insert sample services
INSERT INTO services (name, description, duration_minutes, price) VALUES
('Haircut & Styling', 'Professional haircut and styling service', 45, 35.00),
('Massage Therapy', 'Relaxing full body massage', 60, 80.00),
('Personal Training', 'One-on-one fitness training session', 60, 50.00),
('Yoga Class', 'Group yoga session for all levels', 90, 25.00),
('Dental Checkup', 'Comprehensive dental examination', 30, 120.00);

-- Generate time slots for the next 7 days (9 AM to 5 PM)
-- For service 1 (Haircut)
INSERT INTO time_slots (service_id, slot_date, slot_time) VALUES
(1, CURDATE(), '09:00:00'),
(1, CURDATE(), '10:00:00'),
(1, CURDATE(), '11:00:00'),
(1, CURDATE(), '14:00:00'),
(1, CURDATE(), '15:00:00'),
(1, CURDATE(), '16:00:00'),
(1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00'),
(1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00'),
(1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00'),
(1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:00:00');

-- For service 2 (Massage)
INSERT INTO time_slots (service_id, slot_date, slot_time) VALUES
(2, CURDATE(), '10:00:00'),
(2, CURDATE(), '12:00:00'),
(2, CURDATE(), '14:00:00'),
(2, CURDATE(), '16:00:00'),
(2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00'),
(2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:00:00'),
(2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00');

-- For service 3 (Personal Training)
INSERT INTO time_slots (service_id, slot_date, slot_time) VALUES
(3, CURDATE(), '08:00:00'),
(3, CURDATE(), '09:00:00'),
(3, CURDATE(), '10:00:00'),
(3, CURDATE(), '15:00:00'),
(3, CURDATE(), '16:00:00'),
(3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00:00'),
(3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00'),
(3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:00:00');

-- Sample bookings (some slots already booked)
INSERT INTO bookings (time_slot_id, customer_name, customer_email, customer_phone, notes) VALUES
(1, 'John Smith', 'john@example.com', '555-0101', 'First time customer'),
(5, 'Sarah Johnson', 'sarah@example.com', '555-0102', 'Regular customer'),
(11, 'Mike Davis', 'mike@example.com', '555-0103', 'Prefer deep tissue massage');

-- Mark booked slots as unavailable
UPDATE time_slots SET is_available = FALSE WHERE id IN (1, 5, 11);
