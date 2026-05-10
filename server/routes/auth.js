const express = require('express');

const router = express.Router();

// LOGIN
router.post('/login', async (req, res) => {

  try {

    const { email, password } = req.body;

    console.log('LOGIN:', email);

    if (!email || !password) {

      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال البريد وكلمة المرور'
      });

    }

    // ADMIN LOGIN
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

    console.error('LOGIN ERROR:', err);

    return res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

module.exports = router;