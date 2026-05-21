const mongoose = require('mongoose');

const nomineeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  relationship: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String }
});

module.exports = mongoose.model('Nominee', nomineeSchema);
