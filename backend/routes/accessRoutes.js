const express = require('express');
const router = express.Router();
const { requestAccess, getPendingRequests, approveRequest } = require('../controllers/accessController');
const { protect } = require('../middleware/auth');

router.post('/request', protect, requestAccess);
router.get('/pending', protect, getPendingRequests);
router.post('/approve/:requestId', protect, approveRequest);

module.exports = router;
