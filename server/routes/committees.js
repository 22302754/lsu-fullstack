const express  = require('express');
const CommReq  = require('../models/CommitteeRequest');
const sendEmail = require('../utils/email');
const router   = express.Router();

// Submit committee join request
router.post('/join', async (req, res) => {
  try {
    const { fullName, studentId, uniMajor, phone, reason, committee } = req.body;
    if (!fullName || !studentId || !phone || !reason || !committee)
      return res.status(400).json({ success: false, message: 'يرجى ملء جميع الحقول' });

    const existing = await CommReq.findOne({ studentId, committee, status: { $in: ['pending','approved'] } });
    if (existing)
      return res.status(400).json({ success: false, message: 'لديك طلب مسجل مسبقاً لهذه اللجنة' });

    const request = await CommReq.create({ fullName, studentId, uniMajor, phone, reason, committee });

    const commName = committee === 'media' ? 'لجنة الإعلام والتصوير' : 'لجنة الإشراف والتنظيم';
    sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `📋 طلب انضمام جديد - ${commName}`,
      html: `<div dir="rtl" style="font-family:Arial;padding:20px">
        <h3 style="color:#1a7a2e">طلب انضمام جديد للجنة</h3>
        <p><b>اللجنة:</b> ${commName}</p>
        <p><b>الاسم:</b> ${fullName}</p>
        <p><b>رقم الطالب:</b> ${studentId}</p>
        <p><b>الجامعة والتخصص:</b> ${uniMajor}</p>
        <p><b>الهاتف:</b> ${phone}</p>
        <p><b>السبب:</b> ${reason}</p>
        <br><a href="${process.env.FRONTEND_URL}/admin" style="background:#1a7a2e;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">مراجعة في لوحة التحكم</a>
      </div>`
    });

    res.status(201).json({ success: true, message: 'تم إرسال طلبك بنجاح! سيتواصل معك رئيس اللجنة قريباً', data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

module.exports = router;
