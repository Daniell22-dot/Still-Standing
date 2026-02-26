// controllers/bookingController.js
const db = require('../config/database');
const { sendEmail } = require('../utils/emailService');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
    try {
        const {
            booking_date,
            booking_time,
            session_type,
            counselor_id,
            notes
        } = req.body;

        const userId = req.user.id;

        // Validate date and time
        const bookingDateTime = new Date(`${booking_date} ${booking_time}`);
        const now = new Date();
        
        if (bookingDateTime < now) {
            return res.status(400).json({
                success: false,
                error: 'Cannot book a session in the past'
            });
        }

        // Check if user has existing booking at same time
        const [existingBookings] = await db.promise().query(
            `SELECT id FROM bookings 
             WHERE user_id = ? 
             AND booking_date = ? 
             AND booking_time = ? 
             AND status IN ('pending', 'confirmed')`,
            [userId, booking_date, booking_time]
        );

        if (existingBookings.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'You already have a booking at this time'
            });
        }

        // Check counselor availability
        if (counselor_id) {
            const [counselorBookings] = await db.promise().query(
                `SELECT id FROM bookings 
                 WHERE counselor_id = ? 
                 AND booking_date = ? 
                 AND booking_time = ? 
                 AND status IN ('pending', 'confirmed')`,
                [counselor_id, booking_date, booking_time]
            );

            if (counselorBookings.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Counselor is not available at this time'
                });
            }
        }

        // Create booking
        const [result] = await db.promise().query(
            `INSERT INTO bookings 
             (user_id, counselor_id, booking_date, booking_time, session_type, notes) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, counselor_id || null, booking_date, booking_time, session_type, notes || null]
        );

        // Get created booking with user details
        const [bookings] = await db.promise().query(
            `SELECT b.*, u.name as user_name, u.email as user_email, 
                    c.name as counselor_name, c.email as counselor_email
             FROM bookings b
             LEFT JOIN users u ON b.user_id = u.id
             LEFT JOIN users c ON b.counselor_id = c.id
             WHERE b.id = ?`,
            [result.insertId]
        );

        const booking = bookings[0];

        // Send confirmation email to user
        try {
            const userMessage = `
                <h2>Booking Confirmation</h2>
                <p>Hello ${booking.user_name},</p>
                <p>Your support session has been booked successfully.</p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Booking Details:</strong></p>
                    <p>Date: ${new Date(booking.booking_date).toLocaleDateString()}</p>
                    <p>Time: ${booking.booking_time}</p>
                    <p>Session Type: ${booking.session_type.replace('-', ' ')}</p>
                    <p>Booking ID: STBK${booking.id.toString().padStart(6, '0')}</p>
                </div>
                <p>You will receive a reminder 24 hours before your session.</p>
                <p>To reschedule or cancel, please visit your booking portal.</p>
                <br>
                <p>With support,</p>
                <p>The STILL STANDING Team</p>
            `;

            await sendEmail({
                to: booking.user_email,
                subject: 'Booking Confirmation - STILL STANDING',
                html: userMessage
            });
        } catch (emailError) {
            console.error('Confirmation email error:', emailError);
            // Don't fail the booking if email fails
        }

        // Send notification to counselor if assigned
        if (booking.counselor_email) {
            try {
                const counselorMessage = `
                    <h2>New Session Booking</h2>
                    <p>Hello ${booking.counselor_name},</p>
                    <p>You have been assigned a new support session.</p>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Session Details:</strong></p>
                        <p>Date: ${new Date(booking.booking_date).toLocaleDateString()}</p>
                        <p>Time: ${booking.booking_time}</p>
                        <p>Session Type: ${booking.session_type.replace('-', ' ')}</p>
                        <p>Client: ${booking.user_name}</p>
                        ${booking.notes ? `<p>Notes: ${booking.notes}</p>` : ''}
                    </div>
                    <p>Please prepare for the session and ensure you're available.</p>
                    <br>
                    <p>Thank you,</p>
                    <p>The STILL STANDING Team</p>
                `;

                await sendEmail({
                    to: booking.counselor_email,
                    subject: 'New Session Assignment - STILL STANDING',
                    html: counselorMessage
                });
            } catch (emailError) {
                console.error('Counselor notification email error:', emailError);
            }
        }

        res.status(201).json({
            success: true,
            booking
        });

    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error creating booking'
        });
    }
};

// @desc    Get all bookings for user
// @route   GET /api/bookings/my-bookings
// @access  Private
exports.getMyBookings = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { status, page = 1, limit = 10 } = req.query;

        let query = `
            SELECT b.*, u.name as user_name, c.name as counselor_name
            FROM bookings b
            LEFT JOIN users u ON b.user_id = u.id
            LEFT JOIN users c ON b.counselor_id = c.id
            WHERE b.user_id = ?
        `;
        const queryParams = [userId];

        if (status) {
            query += ' AND b.status = ?';
            queryParams.push(status);
        }

        // Order by date (upcoming first)
        query += ' ORDER BY b.booking_date DESC, b.booking_time DESC';

        // Add pagination
        const offset = (page - 1) * limit;
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));

        const [bookings] = await db.promise().query(query, queryParams);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM bookings WHERE user_id = ?';
        const countParams = [userId];

        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }

        const [countResult] = await db.promise().query(countQuery, countParams);
        const total = countResult[0].total;

        res.status(200).json({
            success: true,
            count: bookings.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            bookings
        });

    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching bookings'
        });
    }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res, next) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.id;

        const [bookings] = await db.promise().query(
            `SELECT b.*, u.name as user_name, u.email as user_email, 
                    u.phone as user_phone, c.name as counselor_name, 
                    c.email as counselor_email, c.phone as counselor_phone
             FROM bookings b
             LEFT JOIN users u ON b.user_id = u.id
             LEFT JOIN users c ON b.counselor_id = c.id
             WHERE b.id = ? AND (b.user_id = ? OR b.counselor_id = ? OR ? = 'admin')`,
            [bookingId, userId, userId, req.user.role]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        // Check if user is authorized (owner, assigned counselor, or admin)
        const booking = bookings[0];
        const isOwner = booking.user_id === userId;
        const isCounselor = booking.counselor_id === userId;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isCounselor && !isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to view this booking'
            });
        }

        res.status(200).json({
            success: true,
            booking
        });

    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching booking'
        });
    }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBooking = async (req, res, next) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.id;
        const { status, notes, rating, feedback } = req.body;

        // First, get the booking to check permissions
        const [bookings] = await db.promise().query(
            'SELECT * FROM bookings WHERE id = ?',
            [bookingId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        const booking = bookings[0];

        // Check permissions
        const isOwner = booking.user_id === userId;
        const isCounselor = booking.counselor_id === userId;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isCounselor && !isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to update this booking'
            });
        }

        // Build update query
        const updates = [];
        const values = [];

        if (status !== undefined) {
            // Validate status transition
            const validTransitions = {
                'pending': ['confirmed', 'cancelled'],
                'confirmed': ['completed', 'cancelled', 'no-show'],
                'completed': [],
                'cancelled': [],
                'no-show': []
            };

            if (!validTransitions[booking.status]?.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid status transition from ${booking.status} to ${status}`
                });
            }

            updates.push('status = ?');
            values.push(status);
        }

        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes);
        }

        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    error: 'Rating must be between 1 and 5'
                });
            }
            updates.push('rating = ?');
            values.push(rating);
        }

        if (feedback !== undefined) {
            updates.push('feedback = ?');
            values.push(feedback);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        values.push(bookingId);

        const query = `UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`;
        await db.promise().query(query, values);

        // Get updated booking
        const [updatedBookings] = await db.promise().query(
            `SELECT b.*, u.name as user_name, c.name as counselor_name 
             FROM bookings b
             LEFT JOIN users u ON b.user_id = u.id
             LEFT JOIN users c ON b.counselor_id = c.id
             WHERE b.id = ?`,
            [bookingId]
        );

        res.status(200).json({
            success: true,
            booking: updatedBookings[0]
        });

    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error updating booking'
        });
    }
};

// @desc    Cancel booking
// @route   DELETE /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res, next) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.id;

        // First, get the booking
        const [bookings] = await db.promise().query(
            'SELECT * FROM bookings WHERE id = ?',
            [bookingId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        const booking = bookings[0];

        // Check if user is the owner
        if (booking.user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to cancel this booking'
            });
        }

        // Check if booking can be cancelled
        if (booking.status === 'completed' || booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                error: `Booking is already ${booking.status}`
            });
        }

        // Calculate if within cancellation window (24 hours before)
        const bookingDateTime = new Date(`${booking.booking_date} ${booking.booking_time}`);
        const now = new Date();
        const hoursDifference = (bookingDateTime - now) / (1000 * 60 * 60);

        if (hoursDifference < 24) {
            return res.status(400).json({
                success: false,
                error: 'Bookings can only be cancelled at least 24 hours in advance'
            });
        }

        // Update booking status to cancelled
        await db.promise().query(
            'UPDATE bookings SET status = "cancelled" WHERE id = ?',
            [bookingId]
        );

        // Send cancellation emails
        try {
            // Get booking details with user info
            const [bookingDetails] = await db.promise().query(
                `SELECT b.*, u.name as user_name, u.email as user_email, 
                        c.name as counselor_name, c.email as counselor_email
                 FROM bookings b
                 LEFT JOIN users u ON b.user_id = u.id
                 LEFT JOIN users c ON b.counselor_id = c.id
                 WHERE b.id = ?`,
                [bookingId]
            );

            const detailedBooking = bookingDetails[0];

            // Send to user
            const userMessage = `
                <h2>Booking Cancelled</h2>
                <p>Hello ${detailedBooking.user_name},</p>
                <p>Your booking has been cancelled successfully.</p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Cancelled Booking Details:</strong></p>
                    <p>Date: ${new Date(detailedBooking.booking_date).toLocaleDateString()}</p>
                    <p>Time: ${detailedBooking.booking_time}</p>
                    <p>Session Type: ${detailedBooking.session_type.replace('-', ' ')}</p>
                    <p>Booking ID: STBK${detailedBooking.id.toString().padStart(6, '0')}</p>
                </div>
                <p>You can book a new session anytime through your portal.</p>
                <br>
                <p>With support,</p>
                <p>The STILL STANDING Team</p>
            `;

            await sendEmail({
                to: detailedBooking.user_email,
                subject: 'Booking Cancelled - STILL STANDING',
                html: userMessage
            });

            // Send to counselor if assigned
            if (detailedBooking.counselor_email) {
                const counselorMessage = `
                    <h2>Session Cancelled</h2>
                    <p>Hello ${detailedBooking.counselor_name},</p>
                    <p>A session you were assigned to has been cancelled.</p>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Cancelled Session Details:</strong></p>
                        <p>Date: ${new Date(detailedBooking.booking_date).toLocaleDateString()}</p>
                        <p>Time: ${detailedBooking.booking_time}</p>
                        <p>Session Type: ${detailedBooking.session_type.replace('-', ' ')}</p>
                        <p>Client: ${detailedBooking.user_name}</p>
                    </div>
                    <p>Your schedule has been updated accordingly.</p>
                    <br>
                    <p>Thank you,</p>
                    <p>The STILL STANDING Team</p>
                `;

                await sendEmail({
                    to: detailedBooking.counselor_email,
                    subject: 'Session Cancelled - STILL STANDING',
                    html: counselorMessage
                });
            }
        } catch (emailError) {
            console.error('Cancellation email error:', emailError);
            // Don't fail the cancellation if email fails
        }

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully'
        });

    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error cancelling booking'
        });
    }
};

// @desc    Get available time slots for a date
// @route   GET /api/bookings/availability/:date
// @access  Private
exports.getAvailability = async (req, res, next) => {
    try {
        const { date } = req.params;
        const { counselor_id } = req.query;

        // Validate date
        const selectedDate = new Date(date);
        if (isNaN(selectedDate.getTime())) {
            return res.status(400).json({
                success: false,
                error: 'Invalid date format'
            });
        }

        // Define working hours (9 AM to 6 PM)
        const workingHours = [
            '09:00:00', '10:00:00', '11:00:00',
            '12:00:00', '13:00:00', '14:00:00',
            '15:00:00', '16:00:00', '17:00:00'
        ];

        // Get booked slots
        let query = `
            SELECT booking_time 
            FROM bookings 
            WHERE booking_date = ? 
            AND status IN ('pending', 'confirmed')
        `;
        const queryParams = [date];

        if (counselor_id) {
            query += ' AND counselor_id = ?';
            queryParams.push(counselor_id);
        }

        const [bookedSlots] = await db.promise().query(query, queryParams);
        const bookedTimes = bookedSlots.map(slot => slot.booking_time);

        // Calculate available slots
        const availableSlots = workingHours.filter(time => !bookedTimes.includes(time));

        // Format slots for frontend
        const formattedSlots = availableSlots.map(time => {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return {
                time: time,
                display: `${displayHour}:${minutes} ${ampm}`
            };
        });

        res.status(200).json({
            success: true,
            date,
            availableSlots: formattedSlots,
            totalSlots: workingHours.length,
            bookedSlots: bookedTimes.length
        });

    } catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error checking availability'
        });
    }
};

// @desc    Get counselor bookings (for counselors/admins)
// @route   GET /api/bookings/counselor/schedule
// @access  Private (Counselor/Admin only)
exports.getCounselorSchedule = async (req, res, next) => {
    try {
        const counselorId = req.user.id;
        const { start_date, end_date } = req.query;

        let query = `
            SELECT b.*, u.name as user_name, u.phone as user_phone
            FROM bookings b
            LEFT JOIN users u ON b.user_id = u.id
            WHERE b.counselor_id = ?
        `;
        const queryParams = [counselorId];

        if (start_date && end_date) {
            query += ' AND b.booking_date BETWEEN ? AND ?';
            queryParams.push(start_date, end_date);
        }

        query += ' ORDER BY b.booking_date, b.booking_time';

        const [bookings] = await db.promise().query(query, queryParams);

        res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });

    } catch (error) {
        console.error('Get counselor schedule error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching schedule'
        });
    }
};