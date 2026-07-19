import nodemailer from "nodemailer";
import env from "../config/env.js";
import logger from "../config/logger.js";

let transporter = null;

const getTransporter = () => {
  if (!env.mail.enabled) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure,
    auth: { user: env.mail.user, pass: env.mail.pass },
  });
  return transporter;
};

/**
 * Send an email. If SMTP is not configured (dev), the message is logged to
 * the console instead of failing — so auth flows still work locally.
 */
export const sendMail = async ({ to, subject, html, text }) => {
  const tx = getTransporter();
  if (!tx) {
    logger.warn(`[mailer] SMTP disabled — would have sent "${subject}" to ${to}`);
    logger.debug(`[mailer] body: ${text || html}`);
    return { queued: false, preview: text || html };
  }
  const info = await tx.sendMail({ from: env.mail.from, to, subject, html, text });
  logger.info(`[mailer] Sent "${subject}" to ${to} (${info.messageId})`);
  return { queued: true, messageId: info.messageId };
};

const wrap = (title, body) => `
  <div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#faf7f2;border-radius:16px;color:#1c1917">
    <h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
    ${body}
    <hr style="border:none;border-top:1px solid #e7e2d9;margin:24px 0" />
    <p style="font-size:12px;color:#78716c">Shayari Platform — where words find their rhythm.</p>
  </div>`;

export const sendVerificationEmail = (to, name, link) =>
  sendMail({
    to,
    subject: "Verify your email",
    text: `Hi ${name}, verify your email: ${link}`,
    html: wrap(
      "Verify your email",
      `<p>Hi ${name}, welcome to Shayari!</p>
       <p>Confirm your email to activate your account:</p>
       <p><a href="${link}" style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 20px;border-radius:10px;text-decoration:none">Verify email</a></p>
       <p style="font-size:12px;color:#78716c">Link expires soon. If you didn't sign up, ignore this email.</p>`
    ),
  });

export const sendResetPasswordEmail = (to, name, link) =>
  sendMail({
    to,
    subject: "Reset your password",
    text: `Hi ${name}, reset your password: ${link}`,
    html: wrap(
      "Reset your password",
      `<p>Hi ${name}, we received a request to reset your password.</p>
       <p><a href="${link}" style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 20px;border-radius:10px;text-decoration:none">Reset password</a></p>
       <p style="font-size:12px;color:#78716c">If you didn't request this, you can safely ignore it.</p>`
    ),
  });

export default { sendMail, sendVerificationEmail, sendResetPasswordEmail };
