import nodemailer from 'nodemailer';

const createTransport = () => {
  if (!process.env.SMTP_HOST) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

export const sendEmail = async ({ to, subject, html }) => {
  const transport = createTransport();
  if (!transport) return { ok: true, skipped: true };

  return transport.sendMail({
    from: process.env.SMTP_FROM || 'hello@marthingtoniq.com',
    to,
    subject,
    html
  });
};
