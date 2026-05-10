const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  firstName:    { type: String, required: true, trim: true },
  lastName:     { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  password:     { type: String, required: true, minlength: 6, select: false },
  phone:        { type: String, required: true },
  dob:          { type: Date },
  nationality:  { type: String, default: 'ليبي' },
  university:   { type: String, required: true },
  major:        { type: String, required: true },
  year:         { type: String },
  studentId:    { type: String, required: true, unique: true },
  role:         { type: String, enum: ['member','committee','admin'], default: 'member' },
  status:       { type: String, enum: ['pending','active','suspended'], default: 'pending' },
  membershipId: { type: String, unique: true, sparse: true },
  otp:          { code: String, expiresAt: Date },
  isVerified:   { type: Boolean, default: false },
  committee:    { type: String, enum: ['media','organization','none'], default: 'none' },
  lastLogin:    { type: Date },
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.membershipId) {
    this.membershipId = 'LSU-' + Date.now().toString(36).toUpperCase();
  }
  next();
});

UserSchema.methods.matchPassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

UserSchema.methods.generateOTP = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = { code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
  return code;
};

module.exports = mongoose.model('User', UserSchema);
