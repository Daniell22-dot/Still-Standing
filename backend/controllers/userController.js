// controllers/userController.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// @desc    Update user progress
// @route   POST /api/users/progress
// @access  Private
exports.updateProgress = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { date, mood, recovery_day, journal_entry, self_care_score } = req.body;

        // Validate date
        const progressDate = date || new Date().toISOString().split('T')[0];

        // Check if progress entry already exists for this date
        const [existingEntries] = await db.promise().query(
            'SELECT id FROM progress WHERE user_id = ? AND date = ?',
            [userId, progressDate]
        );

        let result;
        
        if (existingEntries.length > 0) {
            // Update existing entry
            const updates = [];
            const values = [];

            if (mood !== undefined) {
                updates.push('mood = ?');
                values.push(mood);
            }
            if (recovery_day !== undefined) {
                updates.push('recovery_day = ?');
                values.push(recovery_day);
            }
            if (journal_entry !== undefined) {
                updates.push('journal_entry = ?');
                values.push(journal_entry);
            }
            if (self_care_score !== undefined) {
                if (self_care_score < 0 || self_care_score > 100) {
                    return res.status(400).json({
                        success: false,
                        error: 'Self-care score must be between 0 and 100'
                    });
                }
                updates.push('self_care_score = ?');
                values.push(self_care_score);
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No progress data to update'
                });
            }

            values.push(existingEntries[0].id);

            const query = `UPDATE progress SET ${updates.join(', ')} WHERE id = ?`;
            [result] = await db.promise().query(query, values);
        } else {
            // Create new entry
            [result] = await db.promise().query(
                `INSERT INTO progress 
                 (user_id, date, mood, recovery_day, journal_entry, self_care_score) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    progressDate,
                    mood || null,
                    recovery_day || false,
                    journal_entry || null,
                    self_care_score || null
                ]
            );
        }

        // Update user's recovery days count if recovery_day is true
        if (recovery_day === true) {
            const [recoveryDays] = await db.promise().query(
                `SELECT COUNT(DISTINCT date) as days 
                 FROM progress 
                 WHERE user_id = ? AND recovery_day = TRUE`,
                [userId]
            );

            await db.promise().query(
                'UPDATE users SET recovery_days = ? WHERE id = ?',
                [recoveryDays[0].days, userId]
            );
        }

        // Get the updated/created progress entry
        const [progressEntries] = await db.promise().query(
            'SELECT * FROM progress WHERE user_id = ? AND date = ?',
            [userId, progressDate]
        );

        res.status(200).json({
            success: true,
            progress: progressEntries[0] || null,
            message: existingEntries.length > 0 ? 'Progress updated' : 'Progress saved'
        });

    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error saving progress'
        });
    }
};

// @desc    Get user progress
// @route   GET /api/users/progress
// @access  Private
exports.getProgress = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { start_date, end_date, limit = 30 } = req.query;

        let query = 'SELECT * FROM progress WHERE user_id = ?';
        const queryParams = [userId];

        if (start_date && end_date) {
            query += ' AND date BETWEEN ? AND ?';
            queryParams.push(start_date, end_date);
        }

        query += ' ORDER BY date DESC LIMIT ?';
        queryParams.push(parseInt(limit));

        const [progressEntries] = await db.promise().query(query, queryParams);

        // Calculate statistics
        const moodCounts = { terrible: 0, bad: 0, okay: 0, good: 0, great: 0 };
        let recoveryDays = 0;
        let totalSelfCareScore = 0;
        let selfCareEntries = 0;

        progressEntries.forEach(entry => {
            if (entry.mood) moodCounts[entry.mood]++;
            if (entry.recovery_day) recoveryDays++;
            if (entry.self_care_score !== null) {
                totalSelfCareScore += entry.self_care_score;
                selfCareEntries++;
            }
        });

        const averageSelfCareScore = selfCareEntries > 0 
            ? Math.round(totalSelfCareScore / selfCareEntries) 
            : 0;

        // Get current streak (consecutive recovery days)
        const [streakResult] = await db.promise().query(
            `WITH RECURSIVE dates AS (
                SELECT CURDATE() as date
                UNION ALL
                SELECT DATE_SUB(date, INTERVAL 1 DAY)
                FROM dates
                WHERE date > DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            )
            SELECT MAX(streak) as current_streak
            FROM (
                SELECT COUNT(*) as streak
                FROM dates d
                WHERE EXISTS (
                    SELECT 1 
                    FROM progress p 
                    WHERE p.user_id = ? 
                    AND p.date = d.date 
                    AND p.recovery_day = TRUE
                )
                GROUP BY (
                    SELECT COUNT(*) 
                    FROM dates d2 
                    WHERE d2.date > d.date 
                    AND NOT EXISTS (
                        SELECT 1 
                        FROM progress p2 
                        WHERE p2.user_id = ? 
                        AND p2.date = d2.date 
                        AND p2.recovery_day = TRUE
                    )
                )
            ) streaks`,
            [userId, userId]
        );

        res.status(200).json({
            success: true,
            count: progressEntries.length,
            progress: progressEntries,
            statistics: {
                mood_distribution: moodCounts,
                recovery_days: recoveryDays,
                average_self_care_score: averageSelfCareScore,
                current_streak: streakResult[0].current_streak || 0
            }
        });

    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching progress'
        });
    }
};

// @desc    Get user dashboard statistics
// @route   GET /api/users/dashboard
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Get user info
        const [users] = await db.promise().query(
            'SELECT name, email, recovery_days, created_at FROM users WHERE id = ?',
            [userId]
        );

        // Get upcoming bookings
        const [upcomingBookings] = await db.promise().query(
            `SELECT COUNT(*) as upcoming 
             FROM bookings 
             WHERE user_id = ? 
             AND status IN ('pending', 'confirmed')
             AND (booking_date > CURDATE() OR (booking_date = CURDATE() AND booking_time > CURTIME()))`,
            [userId]
        );

        // Get completed sessions
        const [completedSessions] = await db.promise().query(
            `SELECT COUNT(*) as completed 
             FROM bookings 
             WHERE user_id = ? AND status = 'completed'`,
            [userId]
        );

        // Get journal entries count
        const [journalEntries] = await db.promise().query(
            'SELECT COUNT(*) as entries FROM progress WHERE user_id = ? AND journal_entry IS NOT NULL',
            [userId]
        );

        // Get recent progress
        const [recentProgress] = await db.promise().query(
            `SELECT date, mood, recovery_day 
             FROM progress 
             WHERE user_id = ? 
             ORDER BY date DESC 
             LIMIT 7`,
            [userId]
        );

        // Get next booking
        const [nextBooking] = await db.promise().query(
            `SELECT b.*, c.name as counselor_name 
             FROM bookings b
             LEFT JOIN users c ON b.counselor_id = c.id
             WHERE b.user_id = ? 
             AND b.status IN ('pending', 'confirmed')
             AND (b.booking_date > CURDATE() OR (b.booking_date = CURDATE() AND b.booking_time > CURTIME()))
             ORDER BY b.booking_date, b.booking_time
             LIMIT 1`,
            [userId]
        );

        res.status(200).json({
            success: true,
            dashboard: {
                user: users[0],
                statistics: {
                    recovery_days: users[0].recovery_days,
                    upcoming_sessions: upcomingBookings[0].upcoming,
                    completed_sessions: completedSessions[0].completed,
                    journal_entries: journalEntries[0].entries
                },
                recent_progress: recentProgress,
                next_booking: nextBooking[0] || null,
                joined_date: new Date(users[0].created_at).toLocaleDateString()
            }
        });

    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching dashboard'
        });
    }
};

// @desc    Update user settings
// @route   PUT /api/users/settings
// @access  Private
exports.updateSettings = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { 
            notifications, 
            privacy, 
            theme, 
            language,
            emergency_contacts 
        } = req.body;

        // In a real app, you would have a user_settings table
        // For now, we'll store settings in a JSON column or separate table
        // This is a simplified version

        // Update basic user info if provided
        const updates = [];
        const values = [];

        // Handle emergency contacts
        if (emergency_contacts && Array.isArray(emergency_contacts)) {
            // First, delete existing emergency contacts
            await db.promise().query(
                'DELETE FROM emergency_contacts WHERE user_id = ?',
                [userId]
            );

            // Then insert new ones
            for (const contact of emergency_contacts) {
                if (contact.name && contact.phone) {
                    await db.promise().query(
                        `INSERT INTO emergency_contacts 
                         (user_id, name, relationship, phone, is_primary) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            userId,
                            contact.name,
                            contact.relationship || null,
                            contact.phone,
                            contact.is_primary || false
                        ]
                    );
                }
            }
        }

        // Note: For other settings (notifications, privacy, etc.), 
        // you would need a user_settings table

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully'
        });

    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error updating settings'
        });
    }
};

// @desc    Get emergency contacts
// @route   GET /api/users/emergency-contacts
// @access  Private
exports.getEmergencyContacts = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [contacts] = await db.promise().query(
            'SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY is_primary DESC',
            [userId]
        );

        // Always include STILL STANDING emergency contacts
        const defaultContacts = [
            {
                id: 'system-1',
                name: 'STILL STANDING Crisis Line',
                relationship: '24/7 Support',
                phone: process.env.EMERGENCY_PHONE || '+254112219135',
                is_primary: true,
                is_system: true
            },
            {
                id: 'system-2',
                name: 'STILL STANDING WhatsApp',
                relationship: 'Text Support',
                phone: process.env.EMERGENCY_WHATSAPP || '+25496874539',
                is_primary: false,
                is_system: true
            }
        ];

        res.status(200).json({
            success: true,
            contacts: [...defaultContacts, ...contacts]
        });

    } catch (error) {
        console.error('Get emergency contacts error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching emergency contacts'
        });
    }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { current_password, new_password } = req.body;

        // Get current password
        const [users] = await db.promise().query(
            'SELECT password FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Verify current password
        const isPasswordMatch = await bcrypt.compare(current_password, users[0].password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        // Update password
        await db.promise().query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );

        // Send email notification
        try {
            const [userInfo] = await db.promise().query(
                'SELECT name, email FROM users WHERE id = ?',
                [userId]
            );

            if (userInfo.length > 0) {
                const message = `
                    <h2>Password Changed Successfully</h2>
                    <p>Hello ${userInfo[0].name},</p>
                    <p>Your STILL STANDING account password has been changed successfully.</p>
                    <p>If you did not make this change, please contact our support team immediately.</p>
                    <br>
                    <p>With support,</p>
                    <p>The STILL STANDING Team</p>
                `;

                // You would call your email service here
                // await sendEmail({ ... });
            }
        } catch (emailError) {
            console.error('Password change notification email error:', emailError);
            // Don't fail the password change if email fails
        }

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error changing password'
        });
    }
};