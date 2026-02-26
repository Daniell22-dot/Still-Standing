// controllers/volunteerController.js
const { promisePool } = require('../config/database');

// @desc    Submit volunteer application
// @route   POST /api/volunteers/apply
// @access  Public
exports.submitApplication = async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            age,
            location,
            roles,
            experience,
            motivation,
            skills,
            hoursPerWeek,
            availableDays,
            references
        } = req.body;

        // Validate required fields
        if (!fullName || !email || !phone || !location || !motivation || !hoursPerWeek) {
            return res.status(400).json({
                success: false,
                error: 'Please provide all required fields'
            });
        }

        // Check if email already exists
        const [existing] = await promisePool.query(
            'SELECT id FROM volunteers WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'An application with this email already exists'
            });
        }

        // Insert volunteer application
        const [result] = await promisePool.query(
            `INSERT INTO volunteers 
            (full_name, email, phone, age, location, roles, experience, motivation, 
             skills, hours_per_week, available_days, references) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                fullName,
                email,
                phone,
                age || null,
                location,
                JSON.stringify(roles || []),
                experience || null,
                motivation,
                skills || null,
                hoursPerWeek,
                JSON.stringify(availableDays || []),
                JSON.stringify(references || {})
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Volunteer application submitted successfully',
            applicationId: result.insertId
        });

    } catch (error) {
        console.error('Submit volunteer application error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error submitting application'
        });
    }
};

// @desc    Get all volunteer applications (admin only)
// @route   GET /api/admin/volunteers
// @access  Private/Admin
exports.getAllApplications = async (req, res) => {
    try {
        const { status } = req.query;

        let query = 'SELECT * FROM volunteers';
        const params = [];

        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const [applications] = await promisePool.query(query, params);

        // Parse JSON fields
        const formattedApps = applications.map(app => ({
            ...app,
            roles: JSON.parse(app.roles || '[]'),
            available_days: JSON.parse(app.available_days || '[]'),
            references: JSON.parse(app.references || '{}')
        }));

        res.status(200).json({
            success: true,
            count: formattedApps.length,
            volunteers: formattedApps
        });

    } catch (error) {
        console.error('Get volunteer applications error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving applications'
        });
    }
};

// @desc    Update volunteer application status
// @route   PUT /api/admin/volunteers/:id
// @access  Private/Admin
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes, backgroundCheckStatus, trainingCompleted } = req.body;
        const adminId = req.user.id;

        const updates = [];
        const values = [];

        if (status) {
            updates.push('status = ?');
            values.push(status);
        }
        if (adminNotes !== undefined) {
            updates.push('admin_notes = ?');
            values.push(adminNotes);
        }
        if (backgroundCheckStatus) {
            updates.push('background_check_status = ?');
            values.push(backgroundCheckStatus);
        }
        if (trainingCompleted !== undefined) {
            updates.push('training_completed = ?');
            values.push(trainingCompleted);
        }

        updates.push('reviewed_at = NOW()');
        updates.push('reviewed_by = ?');
        values.push(adminId);
        values.push(id);

        await promisePool.query(
            `UPDATE volunteers SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.status(200).json({
            success: true,
            message: 'Application updated successfully'
        });

    } catch (error) {
        console.error('Update volunteer application error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error updating application'
        });
    }
};

// @desc    Delete volunteer application
// @route   DELETE /api/admin/volunteers/:id
// @access  Private/Admin
exports.deleteApplication = async (req, res) => {
    try {
        const { id } = req.params;

        await promisePool.query('DELETE FROM volunteers WHERE id = ?', [id]);

        res.status(200).json({
            success: true,
            message: 'Application deleted successfully'
        });

    } catch (error) {
        console.error('Delete volunteer application error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error deleting application'
        });
    }
};
