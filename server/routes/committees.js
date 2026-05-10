const express   = require('express');
const CommReq   = require('../models/CommitteeRequest');
const sendEmail = require('../utils/email');
const router    = express.Router();

const COMMITTEE_HEADS = {
  media:        { name: 'ياسين عقيل',   phone: '905428742246', email: 'yaseenaqeel20@gmail.com' },
  organization: { name: 'محمد القمودي', phone: '218926131442', email: 'nory9071@gmail.com' },
};

router.post('/join', async (req, res) => {
  try {
    const { fullName, studentId, uniMajor, phone, reason, committee } = req.body;

    // Validate
    if (!fullName || !phone || !reason || !committee)
      return res.status(400).json({ success: false, message: 'يرجى ملء جميع الحقول' });

    // Save request
    const request = await CommReq.create({
      fullName,
      studentId: studentId || 'N/A',
      uniMajor:  uniMajor  || 'N/A',
      phone,
      reason,
      committee
    });

    const commName = committee === 'media' ? 'لجنة الإعلام والتصوير' : 'لجنة الإشراف والتنظيم';
    const head = COMMITTEE_HEADS[committee] || COMMITTEE_HEADS.media;
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // WhatsApp link to committee head
    const waMsg = encodeURIComponent(
      `📋 طلب انضمام - ${commName}\n👤 ${fullName}\n🏛 ${uniMajor}\n📞 ${phone}\n💬 ${reason}`
    );
    const waLink = `https://wa.me/${head.phone}?text=${waMsg}`;

    // Email to committee head
    try {
      await sendEmail({
        to: head.email,
        subject: `📋 طلب انضمام جديد - ${commName}`,
        html: `<div dir="rtl" style="font-family:Arial;padding:20px;max-width:600px">
          <h3 style="color:#1a7a2e">مرحباً ${head.name}،</h3>
          <p>وصل طلب انضمام جديد لـ${commName}:</p>
          <p><b>الاسم:</b> ${fullName}</p>
          <p><b>رقم الطالب:</b> ${studentId || 'غير محدد'}</p>
          <p><b>الجامعة والتخصص:</b> ${uniMajor}</p>
          <p><b>الهاتف:</b> ${phone}</p>
          <p><b>السبب:</b> ${reason}</p>
          <br>
          <a href="https://wa.me/${cleanPhone}" style="background:#25D366;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">
            💬 تواصل مع الطالب (${phone})
          </a>
        </div>`
      });
    } catch(emailErr) {
      console.error('Email error (non-fatal):', emailErr.message);
    }

    // Email to admin
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `📋 طلب انضمام - ${commName}`,
        html: `<div dir="rtl" style="font-family:Arial;padding:20px">
          <h3>${commName} - طلب جديد</h3>
          <p><b>الاسم:</b> ${fullName}</p>
          <p><b>الهاتف:</b> ${phone}</p>
          <a href="${waLink}" style="background:#25D366;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">
            واتساب ${head.name}
          </a>
        </div>`
      });
    } catch(emailErr) {
      console.error('Admin email error (non-fatal):', emailErr.message);
    }

    console.log(`✅ Committee request saved: ${fullName} → ${commName}`);

    res.status(201).json({
      success: true,
      message: 'تم إرسال طلبك بنجاح! سيتواصل معك رئيس اللجنة قريباً'
    });

  } catch (err) {
    console.error('Committee join error:', err.message);
    res.status(500).json({ success: false, message: 'خطأ في الخادم: ' + err.message });
  }
});

module.exports = router;
