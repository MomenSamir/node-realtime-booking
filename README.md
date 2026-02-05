# Real-Time Booking System

A real-time service booking system built with Node.js, Express, Socket.IO, MySQL, and React.

## 🎯 Features

✨ **Real-Time Updates** - See bookings instantly across all connected clients
📅 **Service Management** - Multiple services with different durations and prices
⏰ **Time Slot System** - Fixed date and time slots for each service
🔴 **Live Availability** - Slots automatically marked as unavailable when booked
👥 **Customer Information** - Collect customer details for each booking
❌ **Cancel Bookings** - Cancel and free up slots in real-time
📊 **Statistics Dashboard** - Live booking statistics
🔔 **Notifications** - Instant notifications for all booking activities

## 💡 Use Cases

Perfect for:
- Hair salons / Barbershops
- Massage therapy centers
- Personal training sessions
- Yoga/Fitness classes
- Dental/Medical appointments
- Consulting services
- Any time-based service booking

## 🛠️ Tech Stack

### Backend
- Node.js + Express.js
- Socket.IO (real-time communication)
- MySQL2 (database with transactions)
- CORS middleware

### Frontend
- React 18
- Socket.IO Client
- Axios (HTTP client)
- Modern CSS3

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## 🚀 Installation

### 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Run the schema file
mysql -u root -p < backend/schema.sql
```

This creates:
- `booking_system` database
- `services` table (5 sample services)
- `time_slots` table (pre-generated slots)
- `bookings` table (3 sample bookings)

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure .env file
# Edit backend/.env with your MySQL credentials:
# DB_USER=root
# DB_PASSWORD=your_password

# Start server
npm start
```

Server runs on http://localhost:5000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start React app
npm start
```

Frontend runs on http://localhost:3000

## 📊 Database Schema

### Services Table
```sql
- id (Primary Key)
- name (Service name)
- description
- duration_minutes (Service duration)
- price (Service cost)
```

### Time Slots Table
```sql
- id (Primary Key)
- service_id (Foreign Key → services)
- slot_date (Date of the slot)
- slot_time (Time of the slot)
- is_available (Boolean - true/false)
```

### Bookings Table
```sql
- id (Primary Key)
- time_slot_id (Foreign Key → time_slots)
- customer_name
- customer_email
- customer_phone
- notes
- status (confirmed/cancelled/completed)
```

## 🔌 API Endpoints

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get single service

### Time Slots
- `GET /api/services/:serviceId/slots` - Get all slots for a service
- `GET /api/slots/available` - Get all available slots

### Bookings
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create new booking
- `PATCH /api/bookings/:id/cancel` - Cancel booking

### Statistics
- `GET /api/stats` - Get booking statistics

## 🔄 Real-Time Events

### Server Emits
- `booking_created` - When a new booking is created
- `booking_cancelled` - When a booking is cancelled

### How It Works

1. **User books a slot** → Backend creates booking
2. **Transaction ensures** → Slot is marked unavailable atomically
3. **Socket.IO broadcasts** → All connected clients notified
4. **UI updates instantly** → Slot shows as booked everywhere

## 🎨 Features Breakdown

### 1. Service Selection
- View all available services
- See duration and price
- Click to view time slots

### 2. Time Slot Calendar
- Grouped by date
- Color-coded availability
- Shows who booked (if booked)
- Click available slot to book

### 3. Booking Form
- Customer name (required)
- Email (required)
- Phone (optional)
- Notes (optional)
- Instant confirmation

### 4. Real-Time Updates
- Open in multiple windows
- Book in one → See update in all
- Cancel → Slot becomes available instantly

### 5. Statistics Dashboard
- Total bookings
- Confirmed count
- Available slots
- Cancelled count

## 🔐 Transaction Safety

The system uses **MySQL transactions** to ensure:
- No double bookings (slot checked and locked)
- Atomic operations (booking + slot update together)
- Data consistency across all tables

## 📱 Responsive Design

Works perfectly on:
- Desktop browsers
- Tablets
- Mobile devices

## 🧪 Testing Real-Time Features

1. Open http://localhost:3000 in **2 browser windows**
2. Select same service in both
3. Book a slot in window 1
4. Watch it appear as "booked" in window 2 **instantly**!

## 🎓 Learning Points for Node.js

### 1. Database Transactions
```javascript
const connection = await db.getConnection();
await connection.beginTransaction();
// ... operations ...
await connection.commit();
```

### 2. Socket.IO Broadcasting
```javascript
io.emit('booking_created', bookingData);
```

### 3. Foreign Keys & Joins
```sql
JOIN time_slots ts ON b.time_slot_id = ts.id
JOIN services s ON ts.service_id = s.id
```

### 4. Optimistic Locking
```sql
SELECT * FROM time_slots WHERE id = ? AND is_available = TRUE FOR UPDATE
```

## 🚀 Customization Ideas

### Easy Additions
1. **Email notifications** - Send confirmation emails
2. **SMS reminders** - Text message 24h before
3. **Recurring slots** - Auto-generate weekly slots
4. **Multi-day calendar** - Week/month view
5. **Payment integration** - Stripe/PayPal
6. **User accounts** - Customer login system
7. **Admin dashboard** - Manage services and slots
8. **Reviews/Ratings** - Customer feedback

### Advanced Features
1. **Waiting list** - Queue for fully booked services
2. **Dynamic pricing** - Peak hours cost more
3. **Multi-location** - Different branches
4. **Staff assignment** - Specific staff per slot
5. **Group bookings** - Multiple slots at once
6. **Cancellation policy** - Time-based rules

## 🐛 Troubleshooting

### Backend won't start
- Check MySQL is running
- Verify .env credentials
- Ensure database exists

### Slots not showing
- Check if time_slots table has data
- Verify service_id exists
- Check dates are current/future

### Real-time not working
- Verify Socket.IO connection status (header)
- Check browser console for errors
- Ensure both backend and frontend running

### Double booking happens
- This shouldn't happen due to transactions
- Check MySQL supports InnoDB (transactions)
- Verify `FOR UPDATE` lock is working

## 📦 Project Structure

```
booking-system/
├── backend/
│   ├── server.js          # Main server + Socket.IO
│   ├── db.js              # MySQL connection
│   ├── schema.sql         # Database schema
│   ├── .env               # Configuration
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.js         # Main component
    │   ├── App.css        # Styles
    │   ├── index.js       # Entry point
    │   └── index.css      # Global styles
    ├── public/
    │   └── index.html
    └── package.json
```

## 🎯 Next Steps

1. **Run the system locally**
2. **Test real-time with multiple windows**
3. **Add your own services**
4. **Generate more time slots**
5. **Customize the design**
6. **Add authentication**
7. **Deploy to production**

## 📝 Sample Data

The schema includes:
- **5 services** (Haircut, Massage, Training, Yoga, Dental)
- **25+ time slots** (for today and tomorrow)
- **3 sample bookings** (to show booked slots)

## 🔒 Production Recommendations

- Add user authentication (JWT)
- Implement rate limiting
- Use environment variables properly
- Enable HTTPS
- Add input validation
- Set up logging
- Implement backup system
- Add error monitoring (Sentry)

## 📄 License

MIT

---

**Happy Booking! 🎉**

Built with ❤️ using Node.js, React, and Socket.IO
