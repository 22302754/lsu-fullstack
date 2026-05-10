const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"اتحاد الطلبة الليبيين" <${process.env.EMAIL_USER}>`,
      to, subject, html,
    });
    console.log(`✉️  Email → ${to}`);
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

module.exports = sendEmail;
