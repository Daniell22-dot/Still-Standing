// controllers/reactionController.js
const { promisePool } = require('../config/database');

// @desc    Add or update reaction to a story
// @route   POST /api/reactions/story/:storyId
// @access  Private
exports.toggleReaction = async (req, res) => {
    try {
        const { storyId } = req.params;
        const { reactionType } = req.body;
        const userId = req.user.id;

        // Valid reaction types
        const validTypes = ['love', 'support', 'strength', 'gratitude'];
        if (!validTypes.includes(reactionType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid reaction type'
            });
        }

        // Check if story exists
        const [story] = await promisePool.query(
            'SELECT id FROM stories WHERE id = ?',
            [storyId]
        );

        if (story.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Story not found'
            });
        }

        // Check if user already reacted
        const [existing] = await promisePool.query(
            'SELECT id, reaction_type FROM story_reactions WHERE story_id = ? AND user_id = ?',
            [storyId, userId]
        );

        if (existing.length > 0) {
            // If same reaction, remove it (toggle off)
            if (existing[0].reaction_type === reactionType) {
                await promisePool.query(
                    'DELETE FROM story_reactions WHERE id = ?',
                    [existing[0].id]
                );

                return res.status(200).json({
                    success: true,
                    message: 'Reaction removed',
                    action: 'removed'
                });
            } else {
                // Update to new reaction type
                await promisePool.query(
                    'UPDATE story_reactions SET reaction_type = ? WHERE id = ?',
                    [reactionType, existing[0].id]
                );

                return res.status(200).json({
                    success: true,
                    message: 'Reaction updated',
                    action: 'updated',
                    reactionType
                });
            }
        } else {
            // Add new reaction
            await promisePool.query(
                'INSERT INTO story_reactions (story_id, user_id, reaction_type) VALUES (?, ?, ?)',
                [storyId, userId, reactionType]
            );

            return res.status(201).json({
                success: true,
                message: 'Reaction added',
                action: 'added',
                reactionType
            });
        }

    } catch (error) {
        console.error('Toggle reaction error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error toggling reaction'
        });
    }
};

// @desc    Get reaction counts for a story
// @route   GET /api/reactions/story/:storyId
// @access  Public
exports.getStoryReactions = async (req, res) => {
    try {
        const { storyId } = req.params;

        const [reactions] = await promisePool.query(
            `SELECT 
                reaction_type,
                COUNT(*) as count
            FROM story_reactions
            WHERE story_id = ?
            GROUP BY reaction_type`,
            [storyId]
        );

        // Get user's reaction if authenticated
        let userReaction = null;
        if (req.user) {
            const [user] = await promisePool.query(
                'SELECT reaction_type FROM story_reactions WHERE story_id = ? AND user_id = ?',
                [storyId, req.user.id]
            );
            userReaction = user.length > 0 ? user[0].reaction_type : null;
        }

        // Format response
        const reactionCounts = {
            love: 0,
            support: 0,
            strength: 0,
            gratitude: 0
        };

        reactions.forEach(r => {
            reactionCounts[r.reaction_type] = parseInt(r.count);
        });

        res.status(200).json({
            success: true,
            reactions: reactionCounts,
            userReaction,
            total: reactions.reduce((sum, r) => sum + parseInt(r.count), 0)
        });

    } catch (error) {
        console.error('Get story reactions error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving reactions'
        });
    }
};

// @desc    Get all reactions with pagination
// @route   GET /api/reactions/story/:storyId/details
// @access  Public
exports.getReactionDetails = async (req, res) => {
    try {
        const { storyId } = req.params;
        const { type } = req.query;

        let query = `
            SELECT 
                sr.reaction_type,
                sr.created_at,
                u.name as user_name
            FROM story_reactions sr
            JOIN users u ON sr.user_id = u.id
            WHERE sr.story_id = ?
        `;
        const params = [storyId];

        if (type) {
            query += ' AND sr.reaction_type = ?';
            params.push(type);
        }

        query += ' ORDER BY sr.created_at DESC LIMIT 50';

        const [details] = await promisePool.query(query, params);

        res.status(200).json({
            success: true,
            details
        });

    } catch (error) {
        console.error('Get reaction details error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving reaction details'
        });
    }
};
