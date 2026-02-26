// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { promisePool } = require('../config/database');
const { sendEmail } = require('../utils/emailService');
const {
    recordLoginFailure,
    clearLoginFailures
} = require('../middleware/securityMiddleware');

// Generate JWT Token
const generateToken = (id, role) => {
    return jwt.sign(
        { id, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { email, password, name, phone, termsAccepted } = req.body;

        // Validate terms acceptance
        if (!termsAccepted) {
            return res.status(400).json({
                success: false,
                error: 'You must accept the Terms and Conditions to register'
            });
        }

        // Check if user exists
        const [existingUser] = await promisePool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'User already exists with this email'
            });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user with terms acceptance timestamp
        const [result] = await promisePool.query(
            'INSERT INTO users (email, password, name, phone, terms_accepted_at) VALUES (?, ?, ?, ?, NOW())',
            [email, hashedPassword, name, phone]
        );

        // Generate token
        const token = generateToken(result.insertId, 'user');

        // Create response
        const user = {
            id: result.insertId,
            email,
            name,
            phone,
            role: 'user',
            recovery_days: 0
        };

        res.status(201).json({
            success: true,
            token,
            user
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during registration'
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const [users] = await promisePool.query(
            'SELECT * FROM users WHERE email = ? AND status = "active"',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const user = users[0];

        // Check password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            // Record failure for lockout
            recordLoginFailure(email);

            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Clear failures on successful login
        clearLoginFailures(email);

        // Update last login
        await promisePool.query(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );

        // Generate token
        const token = generateToken(user.id, user.role);

        // Remove password from response
        delete user.password;

        res.status(200).json({
            success: true,
            token,
            user
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during login'
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const [users] = await promisePool.query(
            'SELECT id, email, name, phone, role, recovery_days, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/update
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        const { name, phone, recovery_days } = req.body;
        const userId = req.user.id;

        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            values.push(phone);
        }
        if (recovery_days !== undefined) {
            updates.push('recovery_days = ?');
            values.push(recovery_days);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        values.push(userId);

        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        await db.promise().query(query, values);

        // Get updated user
        const [users] = await promisePool.query(
            'SELECT id, email, name, phone, role, recovery_days FROM users WHERE id = ?',
            [userId]
        );

        res.status(200).json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error updating profile'
        });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const [users] = await promisePool.query(
            'SELECT id, name FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            // Don't reveal that user doesn't exist for security
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, you will receive a password reset link'
            });
        }

        const user = users[0];

        // Generate reset token (valid for 1 hour)
        const resetToken = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET + '_reset',
            { expiresIn: '1h' }
        );

        // Save reset token to database (in real app, you'd store this)
        // For now, we'll just generate the token

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // Send email
        const message = `
            <h2>Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>You have requested to reset your password for your STILL STANDING account.</p>
            <p>Please click the link below to reset your password:</p>
            <a href="${resetUrl}" style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
            </a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <br>
            <p>With support,</p>
            <p>The STILL STANDING Team</p>
        `;

        try {
            await sendEmail({
                to: email,
                subject: 'Password Reset Request - STILL STANDING',
                html: message
            });

            res.status(200).json({
                success: true,
                message: 'Password reset email sent'
            });

        } catch (emailError) {
            console.error('Email error:', emailError);
            res.status(500).json({
                success: false,
                error: 'Error sending email. Please try again later.'
            });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET + '_reset');
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password
        await promisePool.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, decoded.id]
        );

        res.status(200).json({
            success: true,
            message: 'Password reset successful'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Logout user (client-side)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
    try {
        // In JWT-based auth, logout is handled client-side by removing the token
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};