// controllers/storyController.js
const { promisePool } = require('../config/database');

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
exports.createStory = async (req, res, next) => {
    try {
        const { title, content, category, is_anonymous, allow_comments } = req.body;
        const userId = req.user.id;

        // Validate content length
        if (content.length < 50) {
            return res.status(400).json({
                success: false,
                error: 'Story content must be at least 50 characters'
            });
        }

        // Check for trigger warnings
        const triggerWords = ['suicide', 'self-harm', 'abuse', 'trauma'];
        const hasTriggerWarning = triggerWords.some(word =>
            content.toLowerCase().includes(word.toLowerCase())
        );

        // Perform AI Analysis
        let sentimentData = { polarity: 0, risk_score: 0 };
        try {
            const { analyzeSentiment } = require('../utils/aiService');
            sentimentData = await analyzeSentiment(content);
        } catch (aiError) {
            console.error('AI Analysis failed, proceeding with defaults:', aiError);
        }

        // Insert story
        const [result] = await promisePool.query(
            `INSERT INTO stories 
             (user_id, title, content, category, is_anonymous, allow_comments, sentiment_polarity, risk_score) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                is_anonymous ? null : userId,
                title || null,
                content,
                category,
                is_anonymous !== false,
                allow_comments !== false,
                sentimentData.polarity,
                sentimentData.risk_score
            ]
        );

        // Get created story
        const [stories] = await promisePool.query(
            `SELECT s.*, 
                    CASE 
                        WHEN s.is_anonymous THEN 'Anonymous' 
                        ELSE u.name 
                    END as author_name
             FROM stories s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE s.id = ?`,
            [result.insertId]
        );

        const story = stories[0];

        res.status(201).json({
            success: true,
            story,
            triggerWarning: hasTriggerWarning ?
                'This story may contain triggering content. Please read with care.' : null
        });

    } catch (error) {
        console.error('Create story error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error creating story'
        });
    }
};

// @desc    Get all stories
// @route   GET /api/stories
// @access  Public
exports.getStories = async (req, res, next) => {
    try {
        const {
            category,
            page = 1,
            limit = 10,
            sort = 'newest',
            search
        } = req.query;

        let query = `
            SELECT s.*, 
                   CASE 
                       WHEN s.is_anonymous THEN 'Anonymous' 
                       ELSE u.name 
                   END as author_name,
                   COUNT(DISTINCT c.id) as comment_count
            FROM stories s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN story_comments c ON s.id = c.story_id
            WHERE s.status = 'approved'
        `;
        const queryParams = [];

        // Apply filters
        if (category) {
            query += ' AND s.category = ?';
            queryParams.push(category);
        }

        if (search) {
            query += ' AND (s.title LIKE ? OR s.content LIKE ?)';
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm);
        }

        // Group by story id
        query += ' GROUP BY s.id';

        // Apply sorting
        switch (sort) {
            case 'newest':
                query += ' ORDER BY s.created_at DESC';
                break;
            case 'oldest':
                query += ' ORDER BY s.created_at ASC';
                break;
            case 'most_liked':
                query += ' ORDER BY s.likes DESC';
                break;
            case 'most_commented':
                query += ' ORDER BY comment_count DESC';
                break;
            default:
                query += ' ORDER BY s.created_at DESC';
        }

        // Add pagination
        const offset = (page - 1) * limit;
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));

        const [stories] = await promisePool.query(query, queryParams);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM stories WHERE status = "approved"';
        const countParams = [];

        if (category) {
            countQuery += ' AND category = ?';
            countParams.push(category);
        }

        if (search) {
            countQuery += ' AND (title LIKE ? OR content LIKE ?)';
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm);
        }

        const [countResult] = await promisePool.query(countQuery, countParams);
        const total = countResult[0].total;

        res.status(200).json({
            success: true,
            count: stories.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            stories
        });

    } catch (error) {
        console.error('Get stories error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching stories'
        });
    }
};

// @desc    Get single story
// @route   GET /api/stories/:id
// @access  Public
exports.getStory = async (req, res, next) => {
    try {
        const storyId = req.params.id;

        const [stories] = await promisePool.query(
            `SELECT s.*, 
                    CASE 
                        WHEN s.is_anonymous THEN 'Anonymous' 
                        ELSE u.name 
                    END as author_name
             FROM stories s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE s.id = ? AND s.status = 'approved'`,
            [storyId]
        );

        if (stories.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Story not found'
            });
        }

        // Increment view count (you could add a views column to the stories table)
        // For now, we'll just return the story

        res.status(200).json({
            success: true,
            story: stories[0]
        });

    } catch (error) {
        console.error('Get story error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching story'
        });
    }
};

// @desc    Like a story
// @route   POST /api/stories/:id/like
// @access  Private
exports.likeStory = async (req, res, next) => {
    try {
        const storyId = req.params.id;
        const userId = req.user.id;

        // Check if story exists and is approved
        const [stories] = await promisePool.query(
            'SELECT id, likes FROM stories WHERE id = ? AND status = "approved"',
            [storyId]
        );

        if (stories.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Story not found'
            });
        }

        // Check if user already liked this story
        // (You would need a story_likes table for this in production)
        // For now, we'll just increment the like count

        // Update like count
        await promisePool.query(
            'UPDATE stories SET likes = likes + 1 WHERE id = ?',
            [storyId]
        );

        // Get updated like count
        const [updatedStories] = await promisePool.query(
            'SELECT likes FROM stories WHERE id = ?',
            [storyId]
        );

        res.status(200).json({
            success: true,
            likes: updatedStories[0].likes,
            message: 'Story liked successfully'
        });

    } catch (error) {
        console.error('Like story error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error liking story'
        });
    }
};

// @desc    Get user's stories
// @route   GET /api/stories/my-stories
// @access  Private
exports.getMyStories = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        const [stories] = await promisePool.query(
            `SELECT s.*, 
                    CASE 
                        WHEN s.is_anonymous THEN 'Anonymous' 
                        ELSE u.name 
                    END as author_name
             FROM stories s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE s.user_id = ?
             ORDER BY s.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), (page - 1) * limit]
        );

        // Get total count
        const [countResult] = await promisePool.query(
            'SELECT COUNT(*) as total FROM stories WHERE user_id = ?',
            [userId]
        );
        const total = countResult[0].total;

        res.status(200).json({
            success: true,
            count: stories.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            stories
        });

    } catch (error) {
        console.error('Get my stories error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching your stories'
        });
    }
};

// @desc    Update story
// @route   PUT /api/stories/:id
// @access  Private
exports.updateStory = async (req, res, next) => {
    try {
        const storyId = req.params.id;
        const userId = req.user.id;
        const { title, content, category, is_anonymous, allow_comments } = req.body;

        // Check if story exists and belongs to user
        const [stories] = await promisePool.query(
            'SELECT * FROM stories WHERE id = ? AND user_id = ?',
            [storyId, userId]
        );

        if (stories.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Story not found or not authorized'
            });
        }

        // Build update query
        const updates = [];
        const values = [];

        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
        }

        if (content !== undefined) {
            if (content.length < 50) {
                return res.status(400).json({
                    success: false,
                    error: 'Story content must be at least 50 characters'
                });
            }
            updates.push('content = ?');
            values.push(content);
        }

        if (category !== undefined) {
            updates.push('category = ?');
            values.push(category);
        }

        if (is_anonymous !== undefined) {
            updates.push('is_anonymous = ?');
            values.push(is_anonymous);
        }

        if (allow_comments !== undefined) {
            updates.push('allow_comments = ?');
            values.push(allow_comments);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        updates.push('status = "pending"'); // Reset to pending for moderation
        values.push(storyId);

        const query = `UPDATE stories SET ${updates.join(', ')} WHERE id = ?`;
        await promisePool.query(query, values);

        // Get updated story
        const [updatedStories] = await promisePool.query(
            `SELECT s.*, 
                    CASE 
                        WHEN s.is_anonymous THEN 'Anonymous' 
                        ELSE u.name 
                    END as author_name
             FROM stories s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE s.id = ?`,
            [storyId]
        );

        res.status(200).json({
            success: true,
            story: updatedStories[0],
            message: 'Story updated successfully. It will be reviewed again by moderators.'
        });

    } catch (error) {
        console.error('Update story error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error updating story'
        });
    }
};

// @desc    Delete story
// @route   DELETE /api/stories/:id
// @access  Private
exports.deleteStory = async (req, res, next) => {
    try {
        const storyId = req.params.id;
        const userId = req.user.id;

        // Check if story exists and belongs to user
        const [stories] = await promisePool.query(
            'SELECT id FROM stories WHERE id = ? AND user_id = ?',
            [storyId, userId]
        );

        if (stories.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Story not found or not authorized'
            });
        }

        // Delete story
        await promisePool.query(
            'DELETE FROM stories WHERE id = ?',
            [storyId]
        );

        res.status(200).json({
            success: true,
            message: 'Story deleted successfully'
        });

    } catch (error) {
        console.error('Delete story error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error deleting story'
        });
    }
};

// @desc    Get story statistics
// @route   GET /api/stories/stats
// @access  Public
exports.getStoryStats = async (req, res, next) => {
    try {
        // Get total stories
        const [totalResult] = await promisePool.query(
            'SELECT COUNT(*) as total FROM stories WHERE status = "approved"'
        );

        // Get stories by category
        const [categoryResult] = await promisePool.query(
            `SELECT category, COUNT(*) as count 
             FROM stories 
             WHERE status = "approved"
             GROUP BY category`
        );

        // Get today's stories
        const [todayResult] = await promisePool.query(
            `SELECT COUNT(*) as today 
             FROM stories 
             WHERE status = "approved" 
             AND DATE(created_at) = CURDATE()`
        );

        // Get total likes
        const [likesResult] = await promisePool.query(
            'SELECT SUM(likes) as total_likes FROM stories WHERE status = "approved"'
        );

        res.status(200).json({
            success: true,
            stats: {
                total: totalResult[0].total,
                today: todayResult[0].today,
                total_likes: likesResult[0].total_likes || 0,
                by_category: categoryResult.reduce((acc, curr) => {
                    acc[curr.category] = curr.count;
                    return acc;
                }, {})
            }
        });

    } catch (error) {
        console.error('Get story stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching story statistics'
        });
    }
};

// @desc    Comment on a story
// @route   POST /api/stories/:id/comment
// @access  Private
exports.commentOnStory = async (req, res, next) => {
    try {
        const storyId = req.params.id;
        const userId = req.user.id;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'Comment content is required'
            });
        }

        // Check if story exists
        const [stories] = await promisePool.query(
            'SELECT * FROM stories WHERE id = ? AND status = "approved"',
            [storyId]
        );

        if (stories.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Story not found'
            });
        }

        if (!stories[0].allow_comments) {
            return res.status(400).json({
                success: false,
                error: 'Comments are disabled for this story'
            });
        }

        // Add comment
        const [result] = await promisePool.query(
            'INSERT INTO story_comments (story_id, user_id, content) VALUES (?, ?, ?)',
            [storyId, userId, content]
        );

        // Get created comment
        const [comments] = await promisePool.query(
            `SELECT c.*, u.name as author_name 
             FROM story_comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            comment: comments[0]
        });

    } catch (error) {
        console.error('Comment error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error adding comment'
        });
    }
};

// @desc    Get comments for a story
// @route   GET /api/stories/:id/comments
// @access  Public
exports.getStoryComments = async (req, res, next) => {
    try {
        const storyId = req.params.id;

        const [comments] = await promisePool.query(
            `SELECT c.*, u.name as author_name 
             FROM story_comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.story_id = ?
             ORDER BY c.created_at DESC`,
            [storyId]
        );

        res.status(200).json({
            success: true,
            count: comments.length,
            comments
        });

    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching comments'
        });
    }
};

// @desc    Admin: Get pending stories
// @route   GET /api/admin/stories/pending
// @access  Private (Admin)
exports.getPendingStories = async (req, res, next) => {
    try {
        const [stories] = await promisePool.query(
            `SELECT s.*, u.name as author_name, u.email as author_email
             FROM stories s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE s.status = 'pending'
             ORDER BY s.created_at ASC`
        );

        res.status(200).json({
            success: true,
            count: stories.length,
            stories
        });
    } catch (error) {
        console.error('Get pending stories error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching pending stories'
        });
    }
};

// @desc    Admin: Moderate story (Approve/Reject)
// @route   PUT /api/admin/stories/:id/moderate
// @access  Private (Admin)
exports.moderateStory = async (req, res, next) => {
    try {
        const storyId = req.params.id;
        const { status } = req.body; // 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }

        const [result] = await promisePool.query(
            'UPDATE stories SET status = ? WHERE id = ?',
            [status, storyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Story not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `Story ${status} successfully`
        });

    } catch (error) {
        console.error('Moderate story error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error moderating story'
        });
    }
};