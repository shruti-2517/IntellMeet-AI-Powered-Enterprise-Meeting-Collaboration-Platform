/**
 * IntellMeet Backend – Email Service
 * Professional HTML email templates sent via Nodemailer + Gmail SMTP.
 */

const nodemailer = require('nodemailer');
const logger = require('../middleware/logger');

// ─── Transporter ──────────────────────────────────────────────────────────────
let transporter = null;

const getTransporter = () => {
  // Always re-check if transporter is not yet created (handles late .env updates)
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();

  if (!smtpUser || !smtpPass) {
    logger.warn('⚠️  SMTP credentials not set. Email sending will be disabled.');
    return null;
  }

  // Return cached transporter if credentials haven't changed
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: (process.env.SMTP_HOST || 'smtp.gmail.com').trim(),
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false, // STARTTLS
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: { rejectUnauthorized: false },
  });

  return transporter;
};

// ─── Base HTML Template ───────────────────────────────────────────────────────
const baseTemplate = (content, preheader = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IntellMeet</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; }
    .preheader { display: none; max-height: 0; overflow: hidden; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 36px 40px; text-align: center; }
    .header img { width: 40px; height: 40px; border-radius: 10px; }
    .header h1 { color: #ffffff; font-size: 24px; font-weight: 700; margin-top: 12px; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 4px; }
    .body { padding: 40px; }
    .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
    .text { font-size: 15px; color: #475569; line-height: 1.7; margin-bottom: 20px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin: 24px 0; }
    .card-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .card-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
    .card-value { font-size: 14px; color: #0f172a; font-weight: 500; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; margin: 8px 0; letter-spacing: 0.2px; }
    .btn-center { text-align: center; margin: 28px 0; }
    .divider { height: 1px; background: #e2e8f0; margin: 28px 0; }
    .footer { padding: 24px 40px; background: #f8fafc; text-align: center; }
    .footer p { font-size: 12px; color: #94a3b8; line-height: 1.6; }
    .footer a { color: #6366f1; text-decoration: none; }
    .badge { display: inline-block; background: #ede9fe; color: #7c3aed; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 100px; margin-bottom: 8px; }
    ul.points { padding-left: 20px; }
    ul.points li { font-size: 14px; color: #475569; line-height: 1.8; }
  </style>
</head>
<body>
  <span class="preheader">${preheader}</span>
  <div class="wrapper">
    <div class="header">
      <h1>🤖 IntellMeet</h1>
      <p>AI-Powered Enterprise Meetings</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© 2026 IntellMeet by Zidio Development. All rights reserved.</p>
      <p style="margin-top:8px">
        <a href="#">Privacy Policy</a> &middot;
        <a href="#">Terms of Service</a> &middot;
        <a href="#">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

// ─── Send Helper ──────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  const transport = getTransporter();
  if (!transport) {
    logger.warn(`Email not sent to ${to} (SMTP not configured).`);
    return false;
  }

  try {
    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM || 'IntellMeet <noreply@intellmeet.com>',
      to,
      subject,
      html,
      text: text || subject,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (err) {
    logger.error(`Email send failed to ${to}: ${err.message}`);
    return false;
  }
};

// ─── Email Senders ────────────────────────────────────────────────────────────

const sendVerificationEmail = async (to, name, verificationUrl) => {
  const html = baseTemplate(`
    <div class="badge">Verify Your Email</div>
    <p class="greeting">Hi ${name} 👋</p>
    <p class="text">Welcome to IntellMeet! We're thrilled to have you on board. Please verify your email address to activate your account and start collaborating smarter.</p>
    <div class="btn-center">
      <a href="${verificationUrl}" class="btn">✅ Verify Email Address</a>
    </div>
    <p class="text" style="font-size:13px;color:#94a3b8;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
  `, `Verify your IntellMeet account, ${name}`);

  return sendEmail({
    to,
    subject: '✅ Verify Your IntellMeet Account',
    html,
    text: `Hi ${name}, please verify your email: ${verificationUrl}`,
  });
};

const sendPasswordResetEmail = async (to, name, resetUrl) => {
  const html = baseTemplate(`
    <div class="badge">Password Reset</div>
    <p class="greeting">Hi ${name},</p>
    <p class="text">We received a request to reset your IntellMeet password. Click the button below to create a new password. This link is only valid for <strong>10 minutes</strong>.</p>
    <div class="btn-center">
      <a href="${resetUrl}" class="btn">🔐 Reset My Password</a>
    </div>
    <p class="text" style="font-size:13px;color:#94a3b8;">If you didn't request this, please ignore this email. Your password won't change.</p>
  `, 'Reset your IntellMeet password');

  return sendEmail({
    to,
    subject: '🔐 Reset Your IntellMeet Password',
    html,
    text: `Hi ${name}, reset your password: ${resetUrl}`,
  });
};

const sendMeetingInvitation = async (to, name, meetingTitle, meetingId, hostName, scheduledAt) => {
  const formatted = scheduledAt ? new Date(scheduledAt).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  }) : 'Instant Meeting';

  const joinUrl = `${process.env.CLIENT_URL}/meeting/${meetingId}`;

  const html = baseTemplate(`
    <div class="badge">Meeting Invitation</div>
    <p class="greeting">Hi ${name},</p>
    <p class="text"><strong>${hostName}</strong> has invited you to a meeting on IntellMeet.</p>
    <div class="card">
      <div class="card-row"><span class="card-label">Meeting</span><span class="card-value">${meetingTitle}</span></div>
      <div class="card-row"><span class="card-label">Host</span><span class="card-value">${hostName}</span></div>
      <div class="card-row"><span class="card-label">Scheduled</span><span class="card-value">${formatted}</span></div>
      <div class="card-row"><span class="card-label">Meeting ID</span><span class="card-value">${meetingId}</span></div>
    </div>
    <div class="btn-center">
      <a href="${joinUrl}" class="btn">📹 Join Meeting</a>
    </div>
  `, `You're invited to ${meetingTitle}`);

  return sendEmail({
    to,
    subject: `📅 Meeting Invitation: ${meetingTitle}`,
    html,
    text: `Hi ${name}, ${hostName} invited you to ${meetingTitle}. Join: ${joinUrl}`,
  });
};

const sendTaskAssignedEmail = async (to, name, taskTitle, assignedBy, dueDate, teamName) => {
  const dueDateFormatted = dueDate
    ? new Date(dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'No due date';

  const html = baseTemplate(`
    <div class="badge">New Task Assigned</div>
    <p class="greeting">Hi ${name},</p>
    <p class="text"><strong>${assignedBy}</strong> has assigned you a new task in <strong>${teamName || 'your workspace'}</strong>.</p>
    <div class="card">
      <div class="card-row"><span class="card-label">Task</span><span class="card-value">${taskTitle}</span></div>
      <div class="card-row"><span class="card-label">Assigned By</span><span class="card-value">${assignedBy}</span></div>
      <div class="card-row"><span class="card-label">Team</span><span class="card-value">${teamName || '—'}</span></div>
      <div class="card-row"><span class="card-label">Due Date</span><span class="card-value">${dueDateFormatted}</span></div>
    </div>
    <div class="btn-center">
      <a href="${process.env.CLIENT_URL}/tasks" class="btn">📋 View Task</a>
    </div>
  `, `New task: ${taskTitle}`);

  return sendEmail({
    to,
    subject: `📋 New Task Assigned: ${taskTitle}`,
    html,
    text: `Hi ${name}, ${assignedBy} assigned you: ${taskTitle}. Due: ${dueDateFormatted}`,
  });
};

const sendMeetingSummaryEmail = async (to, name, meetingTitle, summary, actionItems = []) => {
  const actionItemsHtml = actionItems.length > 0
    ? `<div class="card"><p class="card-label" style="margin-bottom:12px">Action Items</p><ul class="points">
        ${actionItems.slice(0, 10).map((item) => `<li>${item.text}${item.assigneeName ? ` — <strong>${item.assigneeName}</strong>` : ''}</li>`).join('')}
      </ul></div>`
    : '';

  const html = baseTemplate(`
    <div class="badge">Meeting Summary Ready</div>
    <p class="greeting">Hi ${name},</p>
    <p class="text">Your AI-generated summary for <strong>${meetingTitle}</strong> is ready.</p>
    <div class="card">
      <p class="card-label" style="margin-bottom:8px">Summary</p>
      <p style="font-size:14px;color:#475569;line-height:1.7">${summary}</p>
    </div>
    ${actionItemsHtml}
    <div class="btn-center">
      <a href="${process.env.CLIENT_URL}/meetings" class="btn">📄 View Full Summary</a>
    </div>
  `, `Meeting summary: ${meetingTitle}`);

  return sendEmail({
    to,
    subject: `📄 Meeting Summary: ${meetingTitle}`,
    html,
    text: `Hi ${name}, your meeting summary for ${meetingTitle} is ready: ${summary}`,
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendMeetingInvitation,
  sendTaskAssignedEmail,
  sendMeetingSummaryEmail,
};
