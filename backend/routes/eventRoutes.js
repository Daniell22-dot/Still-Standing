const express = require('express');
const router = express.Router();
const { getEvents, registerForEvent } = require('../controllers/eventController');

router.get('/', getEvents);
router.post('/register', registerForEvent);

module.exports = router;
