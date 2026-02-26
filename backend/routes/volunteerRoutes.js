// routes/volunteerRoutes.js
const express = require('express');
const router = express.Router();
const {
    submitApplication,
    getAllApplications,
    updateApplicationStatus,
    deleteApplication
} = require('../controllers/volunteerController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/apply', submitApplication);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllApplications);
router.put('/admin/:id', protect, authorize('admin'), updateApplicationStatus);
router.delete('/admin/:id', protect, authorize('admin'), deleteApplication);

module.exports = router;
