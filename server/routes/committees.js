const express   = require('express');
const CommReq   = require('../models/CommitteeRequest');
const sendEmail = require('../utils/email');
const router    = express.Router();

// WhatsApp numbers for committee heads
const COMMITTEE_HEADS = {
  media:        { name: 'ياسين عقيل',    phone: '905428742246'  }, // Media Committee
  organization: { name: 'محمد القمودي', phone: '218926131442'  }, // Org Committee
};

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
    const head = COMMITTEE_HEADS[committee] || COMMITTEE_HEADS.media;

    // WhatsApp message to committee head
    const waMessage = encodeURIComponent(
      `📋 طلب انضمام جديد - ${commName}\n\n` +
      `👤 الاسم: ${fullName}\n` +
      `🎓 رقم الطالب: ${studentId}\n` +
      `🏛 الجامعة والتخصص: ${uniMajor}\n` +
      `📞 الهاتف: ${phone}\n` +
      `💬 السبب: ${reason}\n\n` +
      `يرجى التواصل مع الطالب في أقرب وقت.`
    );
    const waLink = `https://wa.me/${head.phone}?text=${waMessage}`;

    // Send email to admin with WhatsApp link
    sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `📋 طلب انضمام جديد - ${commName}`,
      html: `<div dir="rtl" style="font-family:Arial;padding:20px;max-width:600px">
        <h3 style="color:#1a7a2e">طلب انضمام جديد للجنة</h3>
        <p><b>اللجنة:</b> ${commName}</p>
        <p><b>رئيس اللجنة:</b> ${head.name}</p>
        <hr>
        <p><b>الاسم:</b> ${fullName}</p>
        <p><b>رقم الطالب:</b> ${studentId}</p>
        <p><b>الجامعة والتخصص:</b> ${uniMajor}</p>
        <p><b>الهاتف:</b> ${phone}</p>
        <p><b>السبب:</b> ${reason}</p>
        <br>
        <a href="${waLink}" style="background:#25D366;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-left:10px">
          💬 واتساب ${head.name}
        </a>
        <a href="${process.env.FRONTEND_URL}/admin" style="background:#1a7a2e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
          📊 لوحة التحكم
        </a>
      </div>`
    });

    // Send email directly to committee head
    sendEmail({
      to: committee === 'media' ? 'yaseenaqeel20@gmail.com' : 'nory9071@gmail.com',
      subject: `📋 طلب انضمام جديد لـ${commName}`,
      html: `<div dir="rtl" style="font-family:Arial;padding:20px;max-width:600px">
        <h3 style="color:#1a7a2e">مرحباً ${head.name}،</h3>
        <p>وصل طلب انضمام جديد لـ${commName}:</p>
        <p><b>الاسم:</b> ${fullName}</p>
        <p><b>الجامعة والتخصص:</b> ${uniMajor}</p>
        <p><b>الهاتف:</b> ${phone}</p>
        <p><b>السبب:</b> ${reason}</p>
        <br>
        <a href="https://wa.me/${phone.replace(/[^0-9]/g,'')}" style="background:#25D366;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">
          💬 تواصل مع الطالب عبر واتساب
        </a>
      </div>`
    });

    console.log(`📋 New ${commName} request from ${fullName}`);
    console.log(`💬 WhatsApp link for ${head.name}: ${waLink}`);

    res.status(201).json({ success: true, message: 'تم إرسال طلبك بنجاح! سيتواصل معك رئيس اللجنة قريباً', data: request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

module.exports = router;
