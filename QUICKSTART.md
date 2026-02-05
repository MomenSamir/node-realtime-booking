# Quick Start Guide - Booking System

## 🚀 Get Running in 5 Minutes

### Step 1: Setup MySQL Database

```bash
mysql -u root -p
```

Then run:
```sql
SOURCE /path/to/backend/schema.sql;
```

Or copy-paste the SQL from `backend/schema.sql`

### Step 2: Configure & Start Backend

```bash
cd backend

# Edit .env file - change your MySQL password
nano .env

# Install dependencies
npm install

# Start server
npm start
```

✅ You should see: "Booking system server running on port 5000"

### Step 3: Start Frontend

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Start React app
npm start
```

✅ Browser opens at http://localhost:3000

## 🎯 Test Real-Time Features

1. Open http://localhost:3000 in **TWO browser windows**
2. Select "Haircut & Styling" in both windows
3. Click an available time slot in window 1
4. Fill the form and click "Confirm Booking"
5. **Watch window 2** - the slot turns red instantly! 🎉

## 📊 Sample Data Included

- ✅ 5 services (Haircut, Massage, Training, Yoga, Dental)
- ✅ 25+ time slots for today and tomorrow
- ✅ 3 pre-existing bookings

## 🎨 What You Can Do

- 📅 **View services** - Click any service card
- ⏰ **See time slots** - Available in green, booked in red
- ✅ **Book appointment** - Click available slot, fill form
- ❌ **Cancel booking** - Click "Cancel Booking" button
- 🔴 **Real-time sync** - All changes appear instantly everywhere

## 🐛 Common Issues

**Port 5000 in use?**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

**MySQL error?**
- Check credentials in `backend/.env`
- Make sure MySQL is running
- Verify database was created

**No slots showing?**
- Check if today's date has slots
- Run the schema.sql again to regenerate

## 🎓 Understanding the Flow

```
1. User clicks available slot
   ↓
2. Form opens with service details
   ↓
3. User fills name, email, phone, notes
   ↓
4. Click "Confirm Booking"
   ↓
5. Backend creates booking in MySQL
   ↓
6. Slot marked as unavailable (transaction)
   ↓
7. Socket.IO broadcasts to ALL clients
   ↓
8. Everyone sees the slot as booked!
```

## 📱 What to Try

1. ✅ Book multiple appointments
2. ✅ Cancel a booking (watch it become available)
3. ✅ Open in 2 windows (see real-time magic)
4. ✅ Try different services
5. ✅ Check the statistics cards update

Enjoy! 🎉
