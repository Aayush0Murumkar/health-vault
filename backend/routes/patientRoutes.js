const express = require('express');
const router = express.Router();
const { getPatientEmergencyData } = require('../controllers/patientController');
const { protect } = require('../middleware/auth');

router.get('/:id/emergency', protect, getPatientEmergencyData);

module.exports = router;
