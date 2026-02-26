// routes/groupRoutes.js
const express = require('express');
const router = express.Router();
const {
    createGroup,
    getAllGroups,
    getGroup,
    joinGroup,
    leaveGroup,
    getGroupPosts,
    createGroupPost
} = require('../controllers/groupController');
const { protect } = require('../middleware/auth');

// Group management
router.post('/', protect, createGroup);
router.get('/', getAllGroups);
router.get('/:id', getGroup);
router.post('/:id/join', protect, joinGroup);
router.delete('/:id/leave', protect, leaveGroup);

// Group posts
router.get('/:id/posts', getGroupPosts);
router.post('/:id/posts', protect, createGroupPost);

module.exports = router;
