const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Only admins can access these
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getAllUsers);
router.get('/bookings', adminController.getAllBookings);

module.exports = router;