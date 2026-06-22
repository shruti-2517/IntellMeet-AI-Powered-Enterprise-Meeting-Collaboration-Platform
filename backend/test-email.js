/**
 * Quick SMTP test — run with: node test-email.js
 * Tests if Gmail credentials in .env are working correctly.
 */
require('dotenv').config();
const nodemailer = require('nodemailer');

const smtpUser = (process.env.SMTP_USER || '').trim();
const smtpPass = (process.env.SMTP_PASS || '').trim();

console.log('\n📧 IntellMeet — SMTP Diagnostic Test');
console.log('=====================================');
console.log(`SMTP_HOST : ${process.env.SMTP_HOST}`);
console.log(`SMTP_PORT : ${process.env.SMTP_PORT}`);
console.log(`SMTP_USER : ${smtpUser}`);
console.log(`SMTP_PASS : ${smtpPass ? '✅ set (' + smtpPass.length + ' chars)' : '❌ NOT SET'}`);
console.log('=====================================\n');

if (!smtpUser || !smtpPass) {
  console.error('❌ SMTP_USER or SMTP_PASS is missing in .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: (process.env.SMTP_HOST || 'smtp.gmail.com').trim(),
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: false,
  auth: { user: smtpUser, pass: smtpPass },
  tls: { rejectUnauthorized: false },
});

async function run() {
  console.log('🔌 Verifying SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified! Credentials are correct.\n');
  } catch (err) {
    console.error('❌ SMTP verification failed:', err.message);
    console.log('\n💡 Common fixes:');
    console.log('  1. Make sure 2-Step Verification is ON in your Google account');
    console.log('  2. Use an App Password (not your Gmail login password)');
    console.log('  3. Generate App Password at: https://myaccount.google.com/apppasswords');
    console.log('  4. Make sure the app password is 16 chars (no spaces needed)\n');
    process.exit(1);
  }

  console.log(`📨 Sending test email to ${smtpUser}...`);
  try {
    const info = await transporter.sendMail({
      from: `IntellMeet Test <${smtpUser}>`,
      to: smtpUser,
      subject: '✅ IntellMeet SMTP Test — Working!',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:40px auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#6366f1">✅ SMTP is working!</h2>
          <p>Your IntellMeet email configuration is correct.</p>
          <p style="color:#64748b;font-size:13px;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
      text: 'IntellMeet SMTP test successful!',
    });
    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log(`\n📬 Check your inbox at: ${smtpUser}`);
    console.log('   (Also check Spam/Junk folder)\n');
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    process.exit(1);
  }
}

run();
