const express = require('express');
const router = express.Router();
const { generateQR, scanQR } = require('../controllers/qrController');
const { protect } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

router.post('/generate', protect, generateQR);
router.post('/scan', auditLogger('QR_SCANNED'), scanQR); // No auth for emergency access

module.exports = router;
