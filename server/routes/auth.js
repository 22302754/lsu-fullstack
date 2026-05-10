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

    // Debug: show OTP in terminal (remove after testing)
    console.log('✅ OTP from DB :', user.otp?.code);
    console.log('✅ OTP from user:', otp);

    // Convert both to string for safe comparison
    const savedOTP   = String(user.otp?.code || '').trim();
    const enteredOTP = String(otp || '').trim();

    if (!savedOTP || savedOTP !== enteredOTP)
      return res.status(400).json({ success: false, message: 'الرمز غير صحيح' });
    if (new Date() > user.otp.expiresAt)
      return res.status(400).json({ success: false, message: 'انتهت صلاحية الرمز، اطلب رمزاً جديداً' });

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
    const user = await User.findOne({ email }).select('+password');
    
    console.log('🔍 Login attempt:', email);
    console.log('🔍 User found:', user ? 'YES' : 'NO');
    if (user) {
      const match = await user.matchPassword(password);
      console.log('🔍 Password match:', match);
      console.log('🔍 isVerified:', user.isVerified);
      console.log('🔍 status:', user.status);
    }

    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    
    // Allow login even if not verified (just send OTP again)
    if (user.status === 'suspended')
      return res.status(403).json({ success: false, message: 'تم تعليق هذا الحساب' });

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
