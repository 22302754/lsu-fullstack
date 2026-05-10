const mongoose = require('mongoose');

const CommitteeRequestSchema = new mongoose.Schema({
  fullName:   { type: String, required: true },
  studentId:  { type: String, required: true },
  uniMajor:   { type: String, required: true },
  phone:      { type: String, required: true },
  reason:     { type: String, required: true },
  committee:  { type: String, enum: ['media','organization'], required: true },
  status:     { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNote: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('CommitteeRequest', CommitteeRequestSchema);
