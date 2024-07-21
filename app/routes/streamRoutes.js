const express = require('express');
const { streamAudio, getLog, uploadPlaylist, getCurrentTitle } = require('../controllers/streamController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', streamAudio);
router.get('/log', getLog);
router.post('/upload', authenticateToken, uploadPlaylist);
router.get('/current-title', getCurrentTitle);

module.exports = router;
