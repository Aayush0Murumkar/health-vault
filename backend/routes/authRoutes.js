const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

const registerValidation = [
  body('name').trim().notEmpty().escape(),
  body('phone').trim().matches(/^\d{10}$/),
  body('password').isLength({ min: 6 })
];

const loginValidation = [
  body('phone').trim().matches(/^\d{10}$/),
  body('password').isLength({ min: 6 })
];

router.post('/register', authLimiter, registerValidation, auditLogger('REGISTER'), registerUser);
router.post('/login', authLimiter, loginValidation, auditLogger('LOGIN'), loginUser);
router.get('/me', protect, getMe);

module.exports = router;
