// controllers/groupController.js
const { promisePool } = require('../config/database');

// @desc    Create new support group
// @route   POST /api/groups
// @access  Private
exports.createGroup = async (req, res) => {
    try {
        const { name, description, topic, isPrivate } = req.body;
        const userId = req.user.id;

        if (!name || !topic) {
            return res.status(400).json({
                success: false,
                error: 'Please provide group name and topic'
            });
        }

        // Create group
        const [result] = await promisePool.query(
            `INSERT INTO support_groups (name, description, topic, is_private, created_by, member_count) 
             VALUES (?, ?, ?, ?, ?, 1)`,
            [name, description || null, topic, isPrivate || false, userId]
        );

        const groupId = result.insertId;

        // Add creator as admin member
        await promisePool.query(
            `INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'admin')`,
            [groupId, userId]
        );

        res.status(201).json({
            success: true,
            message: 'Support group created successfully',
            groupId
        });

    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error creating group'
        });
    }
};

// @desc    Get all support groups
// @route   GET /api/groups
// @access  Public
exports.getAllGroups = async (req, res) => {
    try {
        const { topic } = req.query;

        let query = `
            SELECT 
                sg.*,
                u.name as creator_name,
                (SELECT COUNT(*) FROM group_members WHERE group_id = sg.id) as actual_member_count
            FROM support_groups sg
            JOIN users u ON sg.created_by = u.id
            WHERE sg.is_private = FALSE
        `;
        const params = [];

        if (topic) {
            query += ' AND sg.topic = ?';
            params.push(topic);
        }

        query += ' ORDER BY sg.created_at DESC';

        const [groups] = await promisePool.query(query, params);

        res.status(200).json({
            success: true,
            count: groups.length,
            groups
        });

    } catch (error) {
        console.error('Get groups error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving groups'
        });
    }
};

// @desc    Get group details
// @route   GET /api/groups/:id
// @access  Public
exports.getGroup = async (req, res) => {
    try {
        const { id } = req.params;

        const [group] = await promisePool.query(
            `SELECT 
                sg.*,
                u.name as creator_name
            FROM support_groups sg
            JOIN users u ON sg.created_by = u.id
            WHERE sg.id = ?`,
            [id]
        );

        if (group.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Group not found'
            });
        }

        // Get members
        const [members] = await promisePool.query(
            `SELECT 
                gm.role,
                u.name,
                gm.joined_at
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = ?
            ORDER BY gm.joined_at ASC`,
            [id]
        );

        res.status(200).json({
            success: true,
            group: {
                ...group[0],
                members
            }
        });

    } catch (error) {
        console.error('Get group error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving group'
        });
    }
};

// @desc    Join a group
// @route    POST /api/groups/:id/join
// @access  Private
exports.joinGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if already a member
        const [existing] = await promisePool.query(
            'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'You are already a member of this group'
            });
        }

        // Add member
        await promisePool.query(
            `INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'member')`,
            [id, userId]
        );

        // Update member count
        await promisePool.query(
            'UPDATE support_groups SET member_count = member_count + 1 WHERE id = ?',
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Successfully joined group'
        });

    } catch (error) {
        console.error('Join group error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error joining group'
        });
    }
};

// @desc    Leave a group
// @route   DELETE /api/groups/:id/leave
// @access  Private
exports.leaveGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if creator (can't leave own group)
        const [group] = await promisePool.query(
            'SELECT created_by FROM support_groups WHERE id = ?',
            [id]
        );

        if (group.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Group not found'
            });
        }

        if (group[0].created_by === userId) {
            return res.status(400).json({
                success: false,
                error: 'Group creators cannot leave. Delete the group instead.'
            });
        }

        // Remove member
        await promisePool.query(
            'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
            [id, userId]
        );

        // Update member count
        await promisePool.query(
            'UPDATE support_groups SET member_count = member_count - 1 WHERE id = ?',
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Successfully left group'
        });

    } catch (error) {
        console.error('Leave group error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error leaving group'
        });
    }
};

// @desc    Get group posts
// @route   GET /api/groups/:id/posts
// @access  Public
exports.getGroupPosts = async (req, res) => {
    try {
        const { id } = req.params;

        const [posts] = await promisePool.query(
            `SELECT 
                gp.*,
                u.name as author_name
            FROM group_posts gp
            LEFT JOIN users u ON gp.user_id = u.id AND gp.is_anonymous = FALSE
            WHERE gp.group_id = ?
            ORDER BY gp.created_at DESC
            LIMIT 50`,
            [id]
        );

        // Format posts
        const formattedPosts = posts.map(post => ({
            ...post,
            author_name: post.is_anonymous ? 'Anonymous' : post.author_name
        }));

        res.status(200).json({
            success: true,
            posts: formattedPosts
        });

    } catch (error) {
        console.error('Get group posts error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving posts'
        });
    }
};

// @desc    Create group post
// @route   POST /api/groups/:id/posts
// @access  Private
exports.createGroupPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, isAnonymous } = req.body;
        const userId = req.user.id;

        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'Please provide content'
            });
        }

        // Check if member
        const [member] = await promisePool.query(
            'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
            [id, userId]
        );

        if (member.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'You must be a member to post'
            });
        }

        // Create post
        await promisePool.query(
            `INSERT INTO group_posts (group_id, user_id, content, is_anonymous) 
             VALUES (?, ?, ?, ?)`,
            [id, userId, content, isAnonymous || false]
        );

        res.status(201).json({
            success: true,
            message: 'Post created successfully'
        });

    } catch (error) {
        console.error('Create group post error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error creating post'
        });
    }
};
