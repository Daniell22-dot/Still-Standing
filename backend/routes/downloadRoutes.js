const express = require('express');
const router = express.Router();
const { getDownloads, trackDownload } = require('../controllers/downloadController');

router.get('/', getDownloads);
router.post('/track', trackDownload);

module.exports = router;
