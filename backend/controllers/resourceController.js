const { promisePool } = require('../config/database');

// @desc    Get all resources from directory
// @route   GET /api/v1/resources
exports.getResources = async (req, res) => {
    try {
        const { type, location, search } = req.query;
        let query = 'SELECT * FROM resource_directory WHERE status = "approved"';
        let params = [];

        if (type && type !== 'all') {
            query += ' AND type = ?';
            params.push(type);
        }

        if (location) {
            query += ' AND location LIKE ?';
            params.push(`%${location}%`);
        }

        if (search) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        const [resources] = await promisePool.query(query, params);

        res.status(200).json({
            success: true,
            count: resources.length,
            data: resources
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Suggest a resource
// @route   POST /api/v1/resources/suggest
exports.suggestResource = async (req, res) => {
    try {
        const { name, type, location, phone, website, description } = req.body;
        
        if (!name || !type) {
            return res.status(400).json({ success: false, message: 'Name and type are required' });
        }

        const query = `
            INSERT INTO resource_directory (name, type, location, phone, website, description, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `;
        
        await promisePool.query(query, [name, type, location, phone, website, description]);

        res.status(201).json({
            success: true,
            message: 'Resource suggestion submitted for review'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
