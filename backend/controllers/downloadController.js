const { promisePool } = require('../config/database');

// @desc    Get all downloads
// @route   GET /api/v1/downloads
exports.getDownloads = async (req, res) => {
    try {
        const [downloads] = await promisePool.query('SELECT * FROM resources WHERE category != "emergency" ORDER BY downloads DESC');
        res.status(200).json({
            success: true,
            count: downloads.length,
            data: downloads
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Track download
// @route   POST /api/v1/downloads/track
exports.trackDownload = async (req, res) => {
    try {
        const { resource_id } = req.body;
        if (!resource_id) {
            return res.status(400).json({ success: false, message: 'Resource ID is required' });
        }

        await promisePool.query('UPDATE resources SET downloads = downloads + 1 WHERE id = ?', [resource_id]);

        res.status(200).json({ success: true, message: 'Download tracked' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
