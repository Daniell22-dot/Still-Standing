// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const { 
    createBooking, 
    getMyBookings, 
    getBooking, 
    updateBooking, 
    cancelBooking, 
    getAvailability,
    getCounselorSchedule 
} = require('../controllers/bookingController');
const { protect, authorize, isCounselor } = require('../middleware/auth');

// All booking routes are protected
router.use(protect);

// User booking routes
router.post('/', createBooking);
router.get('/my-bookings', getMyBookings);
router.get('/availability/:date', getAvailability);
router.get('/:id', getBooking);
router.put('/:id', updateBooking);
router.delete('/:id/cancel', cancelBooking);

// Counselor routes
router.get('/counselor/schedule', isCounselor, getCounselorSchedule);

// Admin routes (you would add more admin routes here)
// router.get('/', authorize('admin'), getAllBookings);

module.exports = router;