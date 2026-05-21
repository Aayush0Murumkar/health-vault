const express = require('express');
const router = express.Router();
const { registerDoctor } = require('../controllers/doctorController');
const { body } = require('express-validator');

const doctorValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').escape(),
  body('phone').trim().matches(/^\d{10}$/).withMessage('Phone must be 10 digits'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('licenseNumber').trim().notEmpty().withMessage('License number is required').escape(),
  body('hospital').trim().notEmpty().withMessage('Hospital is required').escape(),
  body('specialization').trim().notEmpty().withMessage('Specialization is required').escape(),
];

router.post('/register', doctorValidation, registerDoctor);

module.exports = router;
