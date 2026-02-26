// routes/apiRoutes.js
const express = require('express');
const router = express.Router();
const { 
    updateProgress, 
    getProgress, 
    getDashboardStats, 
    updateSettings, 
    getEmergencyContacts,
    changePassword 
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Progress tracking
router.post('/progress', updateProgress);
router.get('/progress', getProgress);

// User dashboard and settings
router.get('/dashboard', getDashboardStats);
router.put('/settings', updateSettings);
router.get('/emergency-contacts', getEmergencyContacts);
router.put('/change-password', changePassword);

module.exports = router;