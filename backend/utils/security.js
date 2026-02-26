// utils/security.js
const crypto = require('crypto');

// Generate random token
const generateRandomToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

// Sanitize user input
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        // Remove potentially dangerous characters
        return input
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
            .replace(/on\w+='[^']*'/gi, '') // Remove event handlers
            .trim();
    }
    return input;
};

// Validate email
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Validate phone number (basic validation)
const validatePhone = (phone) => {
    const re = /^\+?[\d\s\-\(\)]{10,}$/;
    return re.test(phone);
};

// Password strength validation
const validatePasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return {
        isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
        requirements: {
            minLength: password.length >= minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar
        }
    };
};

// Rate limiting helper
const rateLimitKey = (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
};

// CSRF token generation and validation
const generateCSRFToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const validateCSRFToken = (token, sessionToken) => {
    return token && sessionToken && token === sessionToken;
};

// Input validation middleware helper
const validateRequest = (validationRules) => {
    return (req, res, next) => {
        const errors = [];
        
        for (const [field, rules] of Object.entries(validationRules)) {
            const value = req.body[field];
            
            if (rules.required && (!value || value.trim() === '')) {
                errors.push(`${field} is required`);
                continue;
            }
            
            if (value) {
                if (rules.type === 'email' && !validateEmail(value)) {
                    errors.push(`${field} must be a valid email address`);
                }
                
                if (rules.type === 'phone' && !validatePhone(value)) {
                    errors.push(`${field} must be a valid phone number`);
                }
                
                if (rules.minLength && value.length < rules.minLength) {
                    errors.push(`${field} must be at least ${rules.minLength} characters`);
                }
                
                if (rules.maxLength && value.length > rules.maxLength) {
                    errors.push(`${field} must be at most ${rules.maxLength} characters`);
                }
                
                if (rules.pattern && !rules.pattern.test(value)) {
                    errors.push(`${field} format is invalid`);
                }
            }
        }
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                errors
            });
        }
        
        next();
    };
};

module.exports = {
    generateRandomToken,
    sanitizeInput,
    validateEmail,
    validatePhone,
    validatePasswordStrength,
    rateLimitKey,
    generateCSRFToken,
    validateCSRFToken,
    validateRequest
};