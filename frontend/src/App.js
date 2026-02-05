import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

function App() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ summary: {}, available_slots: 0, by_service: [] });
  const [socket, setSocket] = useState(null);
  const [notification, setNotification] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    notes: ''
  });

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchServices();
    fetchBookings();
    fetchStats();
  }, []);

  // Listen to socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('booking_created', (booking) => {
      setBookings(prev => [booking, ...prev]);
      showNotification(`✅ New booking: ${booking.customer_name} - ${booking.service_name}`);
      fetchStats();
      
      // Refresh slots if we're viewing the same service
      if (selectedService && booking.service_id === selectedService.id) {
        fetchSlots(selectedService.id);
      }
    });

    socket.on('booking_cancelled', (booking) => {
      setBookings(prev => prev.map(b => b.id === booking.id ? booking : b));
      showNotification(`❌ Booking cancelled: ${booking.customer_name}`);
      fetchStats();
      
      // Refresh slots if we're viewing the same service
      if (selectedService && booking.service_id === selectedService.id) {
        fetchSlots(selectedService.id);
      }
    });

    return () => {
      socket.off('booking_created');
      socket.off('booking_cancelled');
    };
  }, [socket, selectedService]);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API_URL}/services`);
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchSlots = async (serviceId) => {
    try {
      const response = await axios.get(`${API_URL}/services/${serviceId}/slots`);
      setSlots(response.data);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API_URL}/bookings`);
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    fetchSlots(service.id);
  };

  const handleSlotClick = (slot) => {
    if (!slot.is_available) {
      showNotification('This slot is already booked!');
      return;
    }
    
    setSelectedSlot(slot);
    setShowBookingForm(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API_URL}/bookings`, {
        time_slot_id: selectedSlot.id,
        ...formData
      });
      
      setShowBookingForm(false);
      setSelectedSlot(null);
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        notes: ''
      });
      
      showNotification('✅ Booking confirmed!');
      
    } catch (error) {
      console.error('Error creating booking:', error);
      showNotification('❌ ' + (error.response?.data?.error || 'Failed to create booking'));
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    
    try {
      await axios.patch(`${API_URL}/bookings/${bookingId}/cancel`);
      showNotification('✅ Booking cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showNotification('❌ Failed to cancel booking');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const groupSlotsByDate = (slots) => {
    return slots.reduce((acc, slot) => {
      const date = slot.slot_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(slot);
      return acc;
    }, {});
  };

  return (
    <div className="App">
      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}

      <header className="header">
        <h1>📅 Real-Time Booking System</h1>
        <div className="connection-status">
          {socket?.connected ? '🟢 Live' : '🔴 Offline'}
        </div>
      </header>

      <div className="container">
        {/* Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Bookings</h3>
            <p className="stat-value">{stats.summary.total_bookings || 0}</p>
          </div>
          <div className="stat-card confirmed">
            <h3>Confirmed</h3>
            <p className="stat-value">{stats.summary.confirmed_bookings || 0}</p>
          </div>
          <div className="stat-card available">
            <h3>Available Slots</h3>
            <p className="stat-value">{stats.available_slots || 0}</p>
          </div>
          <div className="stat-card cancelled">
            <h3>Cancelled</h3>
            <p className="stat-value">{stats.summary.cancelled_bookings || 0}</p>
          </div>
        </div>

        {/* Services */}
        <div className="services-section">
          <h2>Select a Service</h2>
          <div className="services-grid">
            {services.map(service => (
              <div 
                key={service.id} 
                className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                onClick={() => handleServiceSelect(service)}
              >
                <h3>{service.name}</h3>
                <p className="service-description">{service.description}</p>
                <div className="service-details">
                  <span className="duration">⏱️ {service.duration_minutes} min</span>
                  <span className="price">${service.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        {selectedService && (
          <div className="slots-section">
            <h2>Available Time Slots for {selectedService.name}</h2>
            {Object.entries(groupSlotsByDate(slots)).map(([date, dateSlots]) => (
              <div key={date} className="date-group">
                <h3 className="date-header">{formatDate(date)}</h3>
                <div className="slots-grid">
                  {dateSlots.map(slot => (
                    <div 
                      key={slot.id}
                      className={`slot-card ${!slot.is_available ? 'booked' : ''}`}
                      onClick={() => handleSlotClick(slot)}
                    >
                      <div className="slot-time">{formatTime(slot.slot_time)}</div>
                      {slot.is_available ? (
                        <div className="slot-status available">✅ Available</div>
                      ) : (
                        <div className="slot-status booked">
                          🔴 Booked
                          {slot.customer_name && (
                            <div className="booked-by">by {slot.customer_name}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking Form Modal */}
        {showBookingForm && selectedSlot && (
          <div className="modal-overlay" onClick={() => setShowBookingForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Book Appointment</h2>
              <div className="booking-details">
                <p><strong>Service:</strong> {selectedSlot.service_name}</p>
                <p><strong>Date:</strong> {formatDate(selectedSlot.slot_date)}</p>
                <p><strong>Time:</strong> {formatTime(selectedSlot.slot_time)}</p>
                <p><strong>Duration:</strong> {selectedSlot.duration_minutes} minutes</p>
                <p><strong>Price:</strong> ${selectedSlot.price}</p>
              </div>
              
              <form onSubmit={handleBookingSubmit}>
                <input
                  type="text"
                  placeholder="Your Name *"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                />
                <textarea
                  placeholder="Additional Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                />
                
                <div className="modal-actions">
                  <button type="submit" className="btn-primary">Confirm Booking</button>
                  <button type="button" onClick={() => setShowBookingForm(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Recent Bookings */}
        <div className="bookings-section">
          <h2>Recent Bookings ({bookings.length})</h2>
          <div className="bookings-list">
            {bookings.map(booking => (
              <div key={booking.id} className={`booking-card status-${booking.status}`}>
                <div className="booking-header">
                  <h3>{booking.customer_name}</h3>
                  <span className={`status-badge ${booking.status}`}>
                    {booking.status.toUpperCase()}
                  </span>
                </div>
                <div className="booking-details">
                  <p><strong>Service:</strong> {booking.service_name}</p>
                  <p><strong>Date:</strong> {formatDate(booking.slot_date)}</p>
                  <p><strong>Time:</strong> {formatTime(booking.slot_time)}</p>
                  <p><strong>Email:</strong> {booking.customer_email}</p>
                  {booking.customer_phone && <p><strong>Phone:</strong> {booking.customer_phone}</p>}
                  {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}
                </div>
                {booking.status === 'confirmed' && (
                  <button 
                    className="btn-cancel"
                    onClick={() => handleCancelBooking(booking.id)}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
