const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  action:  { type: String, required: true },
  target:  { type: String },
  by:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ip:      { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Activity', ActivitySchema);
