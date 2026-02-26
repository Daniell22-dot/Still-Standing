const { promisePool } = require('../config/database');

// @desc    Get dashboard statistics
exports.getStats = async (req, res) => {
    try {
        // Run multiple counts in parallel for performance
        const [userCount] = await promisePool.query('SELECT COUNT(*) as total FROM users');
        const [bookingCount] = await promisePool.query('SELECT COUNT(*) as total FROM bookings');
        const [storyCount] = await promisePool.query('SELECT COUNT(*) as total FROM stories');
        const [pendingBookings] = await promisePool.query('SELECT COUNT(*) as total FROM bookings WHERE status = "pending"');

        res.status(200).json({
            success: true,
            data: {
                users: userCount[0].total,
                bookings: bookingCount[0].total,
                stories: storyCount[0].total,
                pendingAction: pendingBookings[0].total
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
};

// @desc    Get all users (with pagination)
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await promisePool.query(
            'SELECT id, email, name, role, status, created_at FROM users ORDER BY created_at DESC'
        );
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
};

// @desc    Get all bookings with user details
exports.getAllBookings = async (req, res) => {
    try {
        const query = `
            SELECT b.*, u.name as user_name, u.email as user_email 
            FROM bookings b 
            JOIN users u ON b.user_id = u.id 
            ORDER BY b.booking_date DESC, b.booking_time DESC`;
        
        const [bookings] = await promisePool.query(query);
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
    }
};