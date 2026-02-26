const jwt = require('jsonwebtoken');
const { promisePool } = require('../config/database');

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) return res.status(401).json({ success: false, error: 'Not authorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [users] = await promisePool.query('SELECT id, name, role FROM users WHERE id = ?', [decoded.id]);
        
        if (users.length === 0) return res.status(401).json({ success: false, error: 'User no longer exists' });
        
        req.user = users[0];
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: 'Access denied: Admins only' });
        }
        next();
    };
};