const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  password: { type: String, required: true },
  bloodGroup: { type: String },
  chronicDisease: { type: String },
  allergies: { type: String },
  currentMedication: { type: String },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
