const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, enum: ['PDF', 'Image'], required: true },
  category: { type: String, enum: ['Lab Report', 'Prescription', 'Scan', 'Other'], required: true },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
