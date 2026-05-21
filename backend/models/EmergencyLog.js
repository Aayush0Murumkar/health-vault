const mongoose = require('mongoose');

const emergencyLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scannedBy: { type: String },
  location: { type: String },
  timestamp: { type: Date, default: Date.now },
  accessedData: { type: Object }
});

module.exports = mongoose.model('EmergencyLog', emergencyLogSchema);
