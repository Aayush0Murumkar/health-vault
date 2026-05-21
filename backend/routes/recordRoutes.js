const express = require('express');
const router = express.Router();
const { getRecords, uploadRecord, deleteRecord, downloadRecord } = require('../controllers/recordController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const auditLogger = require('../middleware/auditLogger');

router.route('/')
  .get(protect, getRecords)
  .post(protect, upload.single('file'), auditLogger('UPLOAD_RECORD'), uploadRecord);

router.route('/:id')
  .delete(protect, auditLogger('DELETE_RECORD'), deleteRecord);

router.get('/:id/download', protect, downloadRecord);

module.exports = router;
