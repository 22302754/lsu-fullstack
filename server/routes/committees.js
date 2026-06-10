const express  = require('express');
const router   = express.Router();

const HEADS = {
  media:        { name: 'ياسين عقيل',   phone: '905428742246', email: 'yaseenaqeel20@gmail.com', prefix: 'LSU-MED' },
  organization: { name: 'محمد القمودي', phone: '218926131442', email: 'nory9071@gmail.com',       prefix: 'LSU-ORG' },
};

// Generate membership ID
function generateMembershipId(prefix) {
  const num = Math.floor(100 + Math.random() * 900);
  const year = new Date().getFullYear().toString().slice(-2);
  return `${prefix}-${year}${num}`;
}

router.post('/join', async (req, res) => {
  try {
    const { fullName, studentId, uniMajor, phone, reason, committee } = req.body;

    if (!fullName || !phone || !reason || !committee)
      return res.status(400).json({ success: false, message: 'يرجى ملء جميع الحقول' });

    const commName = committee === 'media' ? 'لجنة الإعلام والتصوير' : 'لجنة الإشراف والتنظيم';
    const head = HEADS[committee] || HEADS.media;
    const cleanPhone = phone.replace(/[^0-9]/g,'');

    // Generate membership ID for this committee member
    const membershipId = generateMembershipId(head.prefix);

    console.log(`📋 New request: ${fullName} → ${commName} | ID: ${membershipId}`);

    // Save to DB
    try {
      const CommReq = require('../models/CommitteeRequest');
      await CommReq.create({
        fullName,
        studentId: studentId || 'N/A',
        uniMajor:  uniMajor  || 'N/A',
        phone, reason, committee,
        membershipId
      });
    } catch(dbErr) {
      console.error('DB error (non-fatal):', dbErr.message);
    }

    // Send emails
    try {
      const sendEmail = require('../utils/email');

      // Email to committee head ONLY
      await sendEmail({
        to: head.email,
        subject: `📋 طلب انضمام جديد - ${commName}`,
        html: `<div dir="rtl" style="font-family:Arial;padding:20px;max-width:600px">
          <h3 style="color:#1a7a2e">مرحباً ${head.name}،</h3>
          <p>وصل طلب انضمام جديد لـ${commName}:</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px;border:1px solid #ddd"><b>رقم العضوية المؤقت</b></td>
                <td style="padding:8px;border:1px solid #ddd;color:#1a7a2e;font-weight:bold">${membershipId}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><b>الاسم</b></td><td style="padding:8px;border:1px solid #ddd">${fullName}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><b>رقم الطالب</b></td><td style="padding:8px;border:1px solid #ddd">${studentId||'غير محدد'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><b>الجامعة والتخصص</b></td><td style="padding:8px;border:1px solid #ddd">${uniMajor}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><b>الهاتف</b></td><td style="padding:8px;border:1px solid #ddd">${phone}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><b>السبب</b></td><td style="padding:8px;border:1px solid #ddd">${reason}</td></tr>
          </table>
          <br>
          <a href="https://wa.me/${cleanPhone}" style="background:#25D366;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
            💬 تواصل مع الطالب (${phone})
          </a>
        </div>`
      });

      // Email to applicant with their membership ID
      const applicantEmailMatch = reason.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (!applicantEmailMatch) {
        console.log('No email in reason field for applicant notification');
      }

    } catch(emailErr) {
      console.error('Email error (non-fatal):', emailErr.message);
    }

    res.status(201).json({
      success: true,
      membershipId,
      message: `✓ تم إرسال طلبك بنجاح!\nرقم عضويتك المؤقت: ${membershipId}\nسيتواصل معك رئيس اللجنة قريباً`
    });

  } catch (err) {
    console.error('Committee FATAL:', err.message);
    res.status(500).json({ success: false, message: 'خطأ في الخادم: ' + err.message });
  }
});

module.exports = router;
