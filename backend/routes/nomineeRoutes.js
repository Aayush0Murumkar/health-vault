const express = require('express');
const router = express.Router();
const { getNominees, addNominee, removeNominee } = require('../controllers/nomineeController');
const { protect } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

router.route('/')
  .get(protect, getNominees)
  .post(protect, auditLogger('ADD_NOMINEE'), addNominee);

router.route('/:id')
  .delete(protect, auditLogger('REMOVE_NOMINEE'), removeNominee);

module.exports = router;
