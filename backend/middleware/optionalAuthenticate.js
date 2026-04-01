'use strict';
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query?.access_token) {
      token = req.query.access_token;
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (user && user.isActive && user.isVerified) {
      req.user = user;
    }
  } catch (err) {
    // ignore invalid token; optional auth means we proceed as guest
  }
  next();
};

module.exports = optionalAuthenticate;
