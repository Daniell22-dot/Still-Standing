// middleware/securityMiddleware.js
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');

// XSS Protection
exports.xssClean = xss();

// Parameter Pollution Protection
exports.preventHpp = hpp();

// Stricter Rate Limiter for Auth Routes
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 attempts per window
    message: {
        success: false,
        error: 'Too many login attempts, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Request Logger (for security monitoring)
exports.securityLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (res.statusCode >= 400) {
            console.warn(`[SECURITY] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms) IP: ${req.ip}`);
        }
    });
    next();
};

// Account Lockout Middleware (Simplified logic to be integrated with Auth Controller)
// In a real app, this would use Redis or DB to track failed attempts
const failedAttempts = new Map();

exports.checkAccountLockout = (req, res, next) => {
    const { email } = req.body;
    if (!email) return next();

    const attempts = failedAttempts.get(email) || { count: 0, lastFailure: null };

    // Lock for 30 minutes after 5 failed attempts
    const lockTime = 30 * 60 * 1000;
    if (attempts.count >= 5 && (Date.now() - attempts.lastFailure < lockTime)) {
        const remainingMinutes = Math.ceil((lockTime - (Date.now() - attempts.lastFailure)) / 60000);
        return res.status(423).json({
            success: false,
            error: `Account is temporarily locked. Try again in ${remainingMinutes} minutes.`
        });
    }

    next();
};

// Helper for Auth Controller to record failures
exports.recordLoginFailure = (email) => {
    const attempts = failedAttempts.get(email) || { count: 0, lastFailure: null };
    attempts.count += 1;
    attempts.lastFailure = Date.now();
    failedAttempts.set(email, attempts);
};

// Helper for Auth Controller to clear failures on success
exports.clearLoginFailures = (email) => {
    failedAttempts.delete(email);
};
