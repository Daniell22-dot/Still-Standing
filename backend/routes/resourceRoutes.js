const express = require('express');
const router = express.Router();
const { getResources, suggestResource } = require('../controllers/resourceController');

router.get('/', getResources);
router.post('/suggest', suggestResource);

module.exports = router;
