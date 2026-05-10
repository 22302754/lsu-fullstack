const express  = require('express');
const jwt      = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User     = require('../models/User');
const sendEmail = require('../utils/email');
const router   = express.Router();

// ── REGISTER ──
router.post('/register', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('studentId').notEmpty(),
  body('university').notEmpty(),
  body('major').notEmpty(),
  body('phone').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, message: 'يرجى ملء جميع الحقول', errors: errors.array() });

  try {
    const { firstName, lastName, email, password, studentId,
            university, major, year, phone, dob, nationality } = req.body;

    const exists = await User.findOne({ $or: [{ email }, { studentId }] });
    if (exists)
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني أو رقم الطالب مسجل مسبقاً' });

    const user = await User.create({ firstName, lastName, email, password, studentId, university, major, year, phone, dob, nationality });

    const otp = user.generateOTP();
    await user.save();

    // Show OTP in terminal (for testing when email not configured)
    console.log('\n🔐 ============================');
    console.log(`🔐 REGISTER OTP for ${email}: ${otp}`);
    console.log('🔐 ============================\n');

    await sendEmail({
      to: email,
      subject: 'رمز التحقق - اتحاد الطلبة الليبيين',
      html: `<div dir="rtl" style="font-family:Arial;max-width:500px;margin:auto;padding:20px">
        <h2 style="color:#1a7a2e">اتحاد الطلبة الليبيين في قبرص التركية</h2>
        <p>مرحباً ${firstName}،</p>
        <p>رمز التحقق الخاص بك:</p>
        <div style="font-size:40px;font-weight:bold;color:#1a7a2e;letter-spacing:10px;text-align:center;padding:24px;background:#f0f9f0;border-radius:12px;margin:20px 0">${otp}</div>
        <p style="color:#888">هذا الرمز صالح لمدة 10 دقائق فقط</p>
      </div>`
    });

    res.status(201).json({ success: true, message: 'تم إنشاء الحساب، تحقق من بريدك الإلكتروني', userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// ── VERIFY OTP ──
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

    // Check OTP exists
    if (!user.otp || !user.otp.code) {
      return res.status(400).json({ success: false, message: 'لا يوجد رمز تحقق، اطلب رمزاً جديداً' });
    }

    // Check expiry first
    if (new Date() > new Date(user.otp.expiresAt)) {
      return res.status(400).json({ success: false, message: 'انتهت صلاحية الرمز، اطلب رمزاً جديداً' });
    }

    // Strict comparison - both as strings, remove any spaces
    const savedOTP   = String(user.otp.code).replace(/\s/g, '');
    const enteredOTP = String(otp).replace(/\s/g, '');

    console.log('🔐 OTP check → DB:', savedOTP, '| Entered:', enteredOTP, '| Match:', savedOTP === enteredOTP);

    if (savedOTP !== enteredOTP) {
      return res.status(400).json({ success: false, message: 'الرمز غير صحيح' });
    }

    user.isVerified = true;
    user.status = 'active';
    user.otp = undefined;
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

    // Notify admin of new member
    sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: '🎓 عضو جديد انضم للاتحاد',
      html: `<div dir="rtl" style="font-family:Arial;padding:20px">
        <h3 style="color:#1a7a2e">عضو جديد انضم للاتحاد!</h3>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;border:1px solid #ddd"><b>الاسم</b></td><td style="padding:8px;border:1px solid #ddd">${user.firstName} ${user.lastName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><b>الجامعة</b></td><td style="padding:8px;border:1px solid #ddd">${user.university}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><b>التخصص</b></td><td style="padding:8px;border:1px solid #ddd">${user.major}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><b>رقم الطالب</b></td><td style="padding:8px;border:1px solid #ddd">${user.studentId}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><b>الهاتف</b></td><td style="padding:8px;border:1px solid #ddd">${user.phone}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><b>رقم العضوية</b></td><td style="padding:8px;border:1px solid #ddd;color:#1a7a2e;font-weight:bold">${user.membershipId}</td></tr>
        </table>
      </div>`
    });

    res.json({ success: true, token, user: { id: user._id, name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role, membershipId: user.membershipId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// ── LOGIN ──
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'يرجى إدخال البيانات' });

    // Find by EMAIL or STUDENT ID
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { studentId: email.trim() }
      ]
    }).select('+password');

    console.log('🔍 Login attempt:', email, '| Found:', user ? 'YES' : 'NO');

    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'البيانات غير صحيحة — تحقق من الإيميل أو رقم الطالب وكلمة المرور' });

    if (user.status === 'suspended')
      return res.status(403).json({ success: false, message: 'تم تعليق هذا الحساب' });

    // ── SKIP 2FA if last login was within 1 hour ──
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (user.lastLogin && new Date(user.lastLogin) > oneHourAgo) {
      user.lastLogin = new Date();
      await user.save();
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
      console.log('✅ Session valid (<1hr) - skipping 2FA');
      return res.json({
        success: true,
        skipOTP: true,
        token,
        user: { id: user._id, name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role, membershipId: user.membershipId }
      });
    }

    const otp = user.generateOTP();
    await user.save();

    // Show OTP in terminal (for testing when email not configured)
    console.log('\n🔐 ============================');
    console.log(`🔐 LOGIN OTP for ${email}: ${otp}`);
    console.log('🔐 ============================\n');

    await sendEmail({
      to: email,
      subject: 'رمز الدخول - اتحاد الطلبة الليبيين',
      html: `<div dir="rtl" style="font-family:Arial;max-width:500px;margin:auto;padding:20px">
        <h2 style="color:#1a7a2e">رمز تسجيل الدخول</h2>
        <p>مرحباً ${user.firstName}،</p>
        <div style="font-size:40px;font-weight:bold;color:#1a7a2e;letter-spacing:10px;text-align:center;padding:24px;background:#f0f9f0;border-radius:12px;margin:20px 0">${otp}</div>
        <p style="color:#888">صالح لمدة 10 دقائق</p>
      </div>`
    });

    res.json({ success: true, message: 'تم إرسال رمز التحقق إلى بريدك', userId: user._id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// ── RESEND OTP ──
router.post('/resend-otp', async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    if (!user) return res.status(404).json({ success: false, message: 'غير موجود' });
    const otp = user.generateOTP();
    await user.save();
    await sendEmail({
      to: user.email,
      subject: 'رمز تحقق جديد',
      html: `<div dir="rtl" style="font-family:Arial;padding:20px"><h2 style="color:#1a7a2e">رمز جديد</h2>
        <div style="font-size:40px;font-weight:bold;color:#1a7a2e;letter-spacing:10px;text-align:center;padding:24px;background:#f0f9f0;border-radius:12px">${otp}</div></div>`
    });
    res.json({ success: true, message: 'تم إعادة إرسال الرمز' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ' });
  }
});

module.exports = router;

// ── FORGOT PASSWORD ──
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success (security - don't reveal if email exists)
    if (!user) {
      return res.json({ success: true, message: 'إذا كان البريد مسجلاً ستصلك رسالة' });
    }

    // Generate reset token (OTP as reset code)
    const resetCode = user.generateOTP();
    await user.save();

    console.log('\n🔑 ============================');
    console.log(`🔑 RESET CODE for ${email}: ${resetCode}`);
    console.log('🔑 ============================\n');

    await sendEmail({
      to: email,
      subject: 'إعادة تعيين كلمة المرور - اتحاد الطلبة الليبيين',
      html: `<div dir="rtl" style="font-family:Arial;max-width:500px;margin:auto;padding:20px">
        <h2 style="color:#1a7a2e">إعادة تعيين كلمة المرور</h2>
        <p>مرحباً ${user.firstName}،</p>
        <p>رمز إعادة تعيين كلمة المرور:</p>
        <div style="font-size:40px;font-weight:bold;color:#1a7a2e;letter-spacing:10px;text-align:center;padding:24px;background:#f0f9f0;border-radius:12px;margin:20px 0">${resetCode}</div>
        <p style="color:#888">صالح لمدة 10 دقائق فقط</p>
        <p style="color:#888">إذا لم تطلب هذا، تجاهل الرسالة</p>
      </div>`
    });

    res.json({ success: true, message: 'إذا كان البريد مسجلاً ستصلك رسالة', userId: user._id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});
