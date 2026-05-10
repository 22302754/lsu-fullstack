const express   = require('express');
const jwt       = require('jsonwebtoken');
const User      = require('../models/User');
const CommReq   = require('../models/CommitteeRequest');
const Activity  = require('../models/Activity');
const sendEmail = require('../utils/email');
const { protect, adminOnly } = require('../middleware/auth');
const router    = express.Router();

// ── ADMIN LOGIN ──
router.post('/login', async (req, res) => {
  try {
    const { email, password, secretKey } = req.body;
    if (secretKey !== process.env.ADMIN_SECRET_KEY)
      return res.status(403).json({ success: false, message: 'المفتاح السري غير صحيح' });
    const admin = await User.findOne({ email, role: 'admin' }).select('+password');
    if (!admin || !(await admin.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'بيانات خاطئة' });
    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, token, admin: { name: `${admin.firstName} ${admin.lastName}`, email: admin.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// All routes below require admin auth
router.use(protect, adminOnly);

// ── DASHBOARD ──
router.get('/dashboard', async (req, res) => {
  try {
    const [totalMembers, activeMembers, pendingMembers, pendingRequests,
           recentMembers, recentActivities, byUniversity] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ status: 'active', role: { $ne: 'admin' } }),
      User.countDocuments({ status: 'pending' }),
      CommReq.countDocuments({ status: 'pending' }),
      User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 }).limit(5).select('firstName lastName university status membershipId createdAt'),
      Activity.find().sort({ createdAt: -1 }).limit(10).populate('by', 'firstName lastName'),
      User.aggregate([
        { $match: { role: { $ne: 'admin' } } },
        { $group: { _id: '$university', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 8 }
      ])
    ]);
    res.json({ success: true, data: { stats: { totalMembers, activeMembers, pendingMembers, pendingRequests }, recentMembers, recentActivities, byUniversity } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ALL MEMBERS ──
router.get('/members', async (req, res) => {
  try {
    const { page = 1, limit = 15, status, search } = req.query;
    const q = { role: { $ne: 'admin' } };
    if (status) q.status = status;
    if (search) q.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName:  { $regex: search, $options: 'i' } },
      { email:     { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
    ];
    const total   = await User.countDocuments(q);
    const members = await User.find(q).select('-password -otp').sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit));
    res.json({ success: true, data: members, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── UPDATE MEMBER STATUS ──
router.patch('/members/:id/status', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'غير موجود' });
    await Activity.create({ action: `تغيير حالة العضو إلى "${req.body.status}"`, target: `${user.firstName} ${user.lastName}`, by: req.user._id });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE MEMBER ──
router.delete('/members/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'غير موجود' });
    await Activity.create({ action: 'حذف عضو', target: `${user.firstName} ${user.lastName}`, by: req.user._id });
    res.json({ success: true, message: 'تم حذف العضو' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── COMMITTEE REQUESTS ──
router.get('/committee-requests', async (req, res) => {
  try {
    const q = req.query.status ? { status: req.query.status } : {};
    const requests = await CommReq.find(q).sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── REVIEW COMMITTEE REQUEST ──
router.patch('/committee-requests/:id', async (req, res) => {
  try {
    const { status, note } = req.body;
    const request = await CommReq.findByIdAndUpdate(req.params.id,
      { status, reviewNote: note, reviewedBy: req.user._id }, { new: true });
    await Activity.create({ action: `${status === 'approved' ? 'قبول' : 'رفض'} طلب لجنة`, target: request.fullName, by: req.user._id });
    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
