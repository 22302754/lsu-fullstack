const express   = require('express');
const CommReq   = require('../models/CommitteeRequest');
const sendEmail = require('../utils/email');
const router    = express.Router();

const COMMITTEE_HEADS = {
  media:        { name: 'ياسين عقيل',   phone: '905428742246', email: 'yaseenaqeel20@gmail.com' },
  organization: { name: 'محمد القمودي', phone: '218926131442', email: 'nory9071@gmail.com' },
};

router.post('/login', async (req, res) => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال البيانات'
      });
    }

    // Admin login
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {

      return res.json({
        success: true,
        token: 'admin-token',
        user: {
          email,
          role: 'admin'
        }
      });

    }

    return res.status(401).json({
      success: false,
      message: 'بيانات الدخول غير صحيحة'
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message
    });

  }
});
module.exports = router;
