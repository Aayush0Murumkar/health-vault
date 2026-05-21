const express = require('express');
const router = express.Router();
const { getNominees, addNominee, removeNominee } = require('../controllers/nomineeController');
const { protect } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');
const { body } = require('express-validator');

const nomineeValidation = [
  body('name').trim().notEmpty().escape(),
  body('relationship').trim().notEmpty().escape(),
  body('phone').trim().notEmpty().escape()
];

router.route('/')
  .get(protect, getNominees)
  .post(protect, nomineeValidation, auditLogger('ADD_NOMINEE'), addNominee);
router.route('/:id').delete(protect, auditLogger('REMOVE_NOMINEE'), removeNominee);
module.exports = router;
