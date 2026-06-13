const express   = require('express');
const sendEmail = require('../utils/email');
const router    = express.Router();

router.post('/submit', async (req, res) => {
  try {
    const {
      nameAr, nameEn, dob, gender, cityCy,
      university, faculty, major, degree, studentId, startYear,
      phoneCy, whatsapp, email, notes
    } = req.body;

    // Validate required fields
    if (!nameAr || !nameEn || !dob || !gender || !university || !faculty || !major || !degree || !studentId || !phoneCy || !email)
      return res.status(400).json({ success: false, message: 'يرجى ملء جميع الحقول الإلزامية' });

    console.log(`🎓 New graduate registration: ${nameAr} (${nameEn}) — ${university}`);

    // Email to union
    await sendEmail({
      to: process.env.ADMIN_EMAIL || 'libyanittihad@gmail.com',
      subject: `🎓 تسجيل خريج جديد — ${nameAr}`,
      html: `
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:20px;background:#f9f9f9;border-radius:12px">
          <div style="background:linear-gradient(135deg,#1a7a2e,#0f5a20);color:#fff;padding:24px;border-radius:10px;margin-bottom:20px;text-align:center">
            <h2 style="margin:0;font-size:22px">🎓 استمارة تسجيل خريج جديد</h2>
            <p style="margin:8px 0 0;opacity:.85">فصل الربيع 2025/2026 — Spring Semester</p>
          </div>

          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e0e0e0">
            <tr style="background:#f0f7f2"><td colspan="2" style="padding:10px 16px;font-weight:700;color:#1a7a2e">البيانات الشخصية</td></tr>
            <tr><td style="padding:8px 16px;color:#666;border-bottom:1px solid #eee;width:40%">الاسم (عربي)</td><td style="padding:8px 16px;border-bottom:1px solid #eee;font-weight:600">${nameAr}</td></tr>
            <tr><td style="padding:8px 16px;color:#666;border-bottom:1px solid #eee">الاسم (English)</td><td style="padding:8px 16px;border-bottom:1px solid #eee;font-weight:600">${nameEn}</td></tr>
            <tr><td style="padding:8px 16px;color:#666;border-bottom:1px solid #eee">تاريخ الميلاد</td><td style="padding:8px 16px;border-bottom:1px solid #eee">${dob}</td></tr>
            <tr><td style="padding:8px 16px;color:#666;border-bottom:1px solid #eee">الجنس</td><td style="padding:8px 16px;border-bottom:1px solid #eee">${gender}</td></tr>
            <tr><td style="padding:8px 16px;color:#666;border-bottom:1px solid #eee">مدينة الإقامة</td><td style="padding:8px 16px;border-bottom:1px solid #eee">${cityCy || '-'}</td></tr>

            <tr style="background:#f0f7f2"><td colspan="2" style="padding:10px 16px;font-weight:700;color:#1a7a2e">البيانات الأكاديمية</td></tr>
            <tr><td style="padding:8px 16px;color:#666;border-bottom:1px solid #eee">الجامعة</td><td style="padding:8px 16px;border-bottom:1px solid #eee;font-weight:600">${university}</td></tr>
            <tr><td style="padding:8px 16px;color:#666;border-bottom:1px solid #eee">الكلية</td><td style="padding:8px 16px;border-bottom:1px solid #eee">${faculty}</td></tr>
            <tr><td style="padding:8px 16px;color:#666;border-bottom:1px solid #eee">التخصص</td><td style="padding:8px 16px;border-bottom:1px solid #eee">${major}</td></tr>
            <tr><td style="padding:8px 16px;color:#666;border-bottom:1px solid #eee">الدرجة العلمية</td><td style="padding:8px 16px;border-bottom:1px solid #eee">${degree}</td></tr>
            <tr><td style="padding:8px 16px;color:#666;border-bottom:1px solid #eee">الرقم الجامعي</td><td style="padding:8px 16px;border-bottom:1px solid #eee;direction:ltr;text-align:right">${studentId}</td></tr>
            <tr><td style="padding:8px 16px;color:#666;border-bottom:1px solid #eee">سنة الالتحاق</td><td style="padding:8px 16px;border-bottom:1px solid #eee">${startYear || '-'}</td></tr>
            <tr><td style="padding:8px 16px;color:#666;border-bottom:1px solid #eee">فصل التخرج</td><td style="padding:8px 16px;border-bottom:1px solid #eee;color:#1a7a2e;font-weight:700">ربيع 2025/2026</td></tr>

            <tr style="background:#f0f7f2"><td colspan="2" style="padding:10px 16px;font-weight:700;color:#1a7a2e">بيانات التواصل</td></tr>
            <tr><td style="padding:8px 16px;color:#666;border-bottom:1px solid #eee">هاتف (قبرص)</td><td style="padding:8px 16px;border-bottom:1px solid #eee;direction:ltr;text-align:right">${phoneCy}</td></tr>
            <tr><td style="padding:8px 16px;color:#666;border-bottom:1px solid #eee">واتساب</td><td style="padding:8px 16px;border-bottom:1px solid #eee;direction:ltr;text-align:right">${whatsapp || '-'}</td></tr>
            <tr><td style="padding:8px 16px;color:#666;border-bottom:1px solid #eee">البريد الإلكتروني</td><td style="padding:8px 16px;border-bottom:1px solid #eee;direction:ltr;text-align:right">${email}</td></tr>

            ${notes !== '-' ? `<tr style="background:#f0f7f2"><td colspan="2" style="padding:10px 16px;font-weight:700;color:#1a7a2e">ملاحظات</td></tr>
            <tr><td colspan="2" style="padding:8px 16px">${notes}</td></tr>` : ''}
          </table>

          <div style="text-align:center;margin-top:20px;color:#888;font-size:12px">
            اتحاد الطلبة الليبيين في قبرص التركية © 2026
          </div>
        </div>
      `
    });

    // Confirmation email to student
    try {
      await sendEmail({
        to: email,
        subject: 'تأكيد تسجيل استمارة الخريجين — اتحاد الطلبة الليبيين',
        html: `
          <div dir="rtl" style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:20px">
            <div style="background:linear-gradient(135deg,#1a7a2e,#0f5a20);color:#fff;padding:24px;border-radius:12px;text-align:center;margin-bottom:20px">
              <h2 style="margin:0">🎓 تم استلام استمارتك!</h2>
            </div>
            <p>مرحباً ${nameAr}،</p>
            <p>تم استلام بيانات تسجيلك في سجل خريجي <strong>اتحاد الطلبة الليبيين في قبرص التركية</strong> بنجاح.</p>
            <p><strong>الجامعة:</strong> ${university}</p>
            <p><strong>التخصص:</strong> ${major}</p>
            <p><strong>الدرجة:</strong> ${degree}</p>
            <p>سيتواصل معك الاتحاد لاحقاً لأي تفاصيل إضافية.</p>
            <p style="margin-top:20px;color:#888;font-size:12px">اتحاد الطلبة الليبيين في قبرص التركية © 2026</p>
          </div>
        `
      });
    } catch(e) {
      console.error('Student confirmation email failed (non-fatal):', e.message);
    }

    res.json({ success: true, message: 'تم إرسال الاستمارة بنجاح!' });

  } catch(err) {
    console.error('Graduate submit error:', err.message);
    res.status(500).json({ success: false, message: 'خطأ في الخادم، حاول مرة أخرى' });
  }
});

module.exports = router;
