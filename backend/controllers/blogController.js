const { promisePool } = require('../config/database');

// @desc    Get all blog posts
// @route   GET /api/v1/blog
exports.getPosts = async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = 'SELECT * FROM blog_posts WHERE status = "published"';
        let params = [];

        if (category && category !== 'all') {
            query += ' AND category = ?';
            params.push(category);
        }

        if (search) {
            query += ' AND (title LIKE ? OR content LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY created_at DESC';

        const [posts] = await promisePool.query(query, params);

        res.status(200).json({
            success: true,
            count: posts.length,
            data: posts
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single blog post
// @route   GET /api/v1/blog/:id
exports.getPost = async (req, res) => {
    try {
        const [posts] = await promisePool.query('SELECT * FROM blog_posts WHERE id = ?', [req.params.id]);

        if (posts.length === 0) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.status(200).json({ success: true, data: posts[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Subscribe to newsletter
// @route   POST /api/v1/blog/newsletter
exports.subscribeNewsletter = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        await promisePool.query('INSERT IGNORE INTO newsletter_subs (email) VALUES (?)', [email]);

        res.status(201).json({ success: true, message: 'Subscribed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
