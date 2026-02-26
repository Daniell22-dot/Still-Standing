// routes/qaRoutes.js
const express = require('express');
const router = express.Router();
const {
    submitQuestion,
    getAllQuestions,
    getQuestion,
    submitAnswer,
    toggleUpvote
} = require('../controllers/qaController');
const { protect } = require('../middleware/auth');

// Questions
router.post('/questions', protect, submitQuestion);
router.get('/questions', getAllQuestions);
router.get('/questions/:id', getQuestion);

// Answers
router.post('/questions/:id/answers', protect, submitAnswer);

// Upvotes
router.post('/upvote', protect, toggleUpvote);

module.exports = router;
