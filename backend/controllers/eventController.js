const { promisePool } = require('../config/database');

// @desc    Get all events
// @route   GET /api/v1/events
exports.getEvents = async (req, res) => {
    try {
        const [events] = await promisePool.query('SELECT * FROM events ORDER BY event_date ASC');
        res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Register for an event
// @route   POST /api/v1/events/register
exports.registerForEvent = async (req, res) => {
    try {
        const { event_id, name, email, phone, source } = req.body;

        if (!event_id || !name || !email) {
            return res.status(400).json({ success: false, message: 'Event ID, name and email are required' });
        }

        // Check if event exists and has space
        const [events] = await promisePool.query('SELECT * FROM events WHERE id = ?', [event_id]);
        if (events.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const event = events[0];
        if (event.max_participants && event.current_participants >= event.max_participants) {
            return res.status(400).json({ success: false, message: 'Event is full' });
        }

        // Register
        await promisePool.query(
            'INSERT INTO event_registrations (event_id, name, email, phone, source) VALUES (?, ?, ?, ?, ?)',
            [event_id, name, email, phone, source]
        );

        // Update participant count
        await promisePool.query('UPDATE events SET current_participants = current_participants + 1 WHERE id = ?', [event_id]);

        res.status(201).json({
            success: true,
            message: 'Successfully registered for event'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
