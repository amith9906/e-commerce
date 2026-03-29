'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, OtpVerification } = require('../../models');
const { sendMail } = require('../../config/mailer');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, tenantId: user.tenantId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const tenantId = req.tenant?.id || null;

    // Check email uniqueness within tenant
    const existing = await User.findOne({ where: { email, tenantId } });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name, email, passwordHash, tenantId,
      role: 'customer',
      createdBy: null, updatedBy: null,
    });

    // Generate & send OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRES_MINUTES) || 10) * 60000);
    await OtpVerification.create({ userId: user.id, otpCode: otp, expiresAt, createdBy: user.id, updatedBy: user.id });

    await sendMail({
      to: email,
      subject: 'Verify your account',
      html: `<h2>Welcome, ${name}!</h2><p>Your OTP is: <strong>${otp}</strong>. It expires in ${process.env.OTP_EXPIRES_MINUTES || 10} minutes.</p>`,
    });

    res.status(201).json({ success: true, message: 'Registration successful. Check your email for OTP.', userId: user.id });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-otp
const verifyOtp = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    const record = await OtpVerification.findOne({
      where: { userId, otpCode: otp, used: false },
      order: [['created_at', 'DESC']],
    });

    if (!record) return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    if (new Date() > record.expiresAt) return res.status(400).json({ success: false, message: 'OTP expired.' });

    await record.update({ used: true, updatedBy: userId });
    await User.update({ isVerified: true, updatedBy: userId }, { where: { id: userId } });

    const user = await User.findByPk(userId);
    const token = generateToken(user);

    res.json({ success: true, message: 'Account verified.', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/resend-otp
const resendOtp = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'Already verified.' });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRES_MINUTES) || 10) * 60000);
    await OtpVerification.create({ userId: user.id, otpCode: otp, expiresAt, createdBy: user.id, updatedBy: user.id });

    await sendMail({
      to: user.email,
      subject: 'Resend OTP',
      html: `<p>Your new OTP is: <strong>${otp}</strong>. It expires in ${process.env.OTP_EXPIRES_MINUTES || 10} minutes.</p>`,
    });

    res.json({ success: true, message: 'OTP resent.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const tenantId = req.tenant?.id || null;

    const user = await User.findOne({ where: { email, tenantId } });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account disabled.' });
    if (!user.isVerified) return res.status(403).json({ success: false, message: 'Please verify your email first.', userId: user.id });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const token = generateToken(user);
    res.json({
      success: true, token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, verifyOtp, resendOtp, login };
