// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    updateProfile,
    forgotPassword,
    resetPassword,
    logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { checkAccountLockout } = require('../middleware/securityMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', checkAccountLockout, login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update', protect, updateProfile);
router.post('/logout', protect, logout);

module.exports = router;