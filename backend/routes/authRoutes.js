const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');
const { body } = require('express-validator');

// Validation array example to satisfy express-validator usage
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidation, auditLogger('REGISTER'), registerUser);
router.post('/login', auditLogger('LOGIN'), loginUser);
router.get('/me', protect, getMe);

module.exports = router;
