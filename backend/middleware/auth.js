// middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // Check for token in cookies (if using cookies)
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        // Make sure token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if user still exists
            const [users] = await db.promise().query(
                'SELECT id, email, role, status FROM users WHERE id = ?',
                [decoded.id]
            );

            if (users.length === 0) {
                return res.status(401).json({
                    success: false,
                    error: 'User no longer exists'
                });
            }

            const user = users[0];

            // Check if user is active
            if (user.status !== 'active') {
                return res.status(401).json({
                    success: false,
                    error: 'User account is not active'
                });
            }

            // Add user to request object
            req.user = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Server authentication error'
        });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

// Check if user is counselor or admin
exports.isCounselor = (req, res, next) => {
    if (req.user.role !== 'counselor' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Only counselors and admins can access this route'
        });
    }
    next();
};