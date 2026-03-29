const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, html) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_USER || 'dummy_user',
      pass: process.env.SMTP_PASS || 'dummy_pass'
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"E-Commerce Store" <no-reply@ecommerce.com>',
    to,
    subject,
    text,
    html: html || `<p>${text}</p>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
};

module.exports = { sendEmail };
