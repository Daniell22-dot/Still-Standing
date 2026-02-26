// routes/storyRoutes.js
const express = require('express');
const router = express.Router();
const {
    createStory,
    getStories,
    getStory,
    likeStory,
    getMyStories,
    updateStory,
    deleteStory,

    getStoryStats,
    commentOnStory,
    getStoryComments,
    getPendingStories,
    moderateStory
} = require('../controllers/storyController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getStories);
router.get('/stats', getStoryStats);
router.get('/:id/comments', getStoryComments);
router.get('/:id', getStory);

// Protected routes
router.use(protect);
router.post('/', createStory);
router.post('/:id/like', likeStory);
router.post('/:id/comment', commentOnStory);
router.get('/my-stories', getMyStories);
router.put('/:id', updateStory);
router.delete('/:id', deleteStory);

module.exports = router;