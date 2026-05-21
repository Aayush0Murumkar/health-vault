const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const registerDoctor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, phone, password, email, licenseNumber, hospital, specialization } = req.body;

    const userExists = await User.findOne({ phone });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      phone,
      password: hashedPassword,
      email,
      role: 'doctor',
      licenseNumber,
      hospital,
      specialization,
      isVerified: false
    });

    if (user) {
      const token = generateToken(user._id);
      res.status(201).json({
        success: true,
        token
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid doctor data' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerDoctor,
};
