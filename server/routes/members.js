const express = require('express');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');
const router  = express.Router();

// Get own profile
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, data: req.user });
});

// Update own profile
router.put('/me', protect, async (req, res) => {
  const { phone, major, year } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { phone, major, year }, { new: true });
  res.json({ success: true, data: user });
});

module.exports = router;
