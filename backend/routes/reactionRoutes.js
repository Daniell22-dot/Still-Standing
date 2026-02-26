// routes/reactionRoutes.js
const express = require('express');
const router = express.Router();
const {
    toggleReaction,
    getStoryReactions,
    getReactionDetails
} = require('../controllers/reactionController');
const { protect } = require('../middleware/auth');

// Story reactions
router.post('/story/:storyId', protect, toggleReaction);
router.get('/story/:storyId', getStoryReactions);
router.get('/story/:storyId/details', getReactionDetails);

module.exports = router;
