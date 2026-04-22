const express = require('express');
const router = express.Router();
const { getPosts, getPost, subscribeNewsletter } = require('../controllers/blogController');

router.get('/', getPosts);
router.get('/:id', getPost);
router.post('/newsletter', subscribeNewsletter);

module.exports = router;
