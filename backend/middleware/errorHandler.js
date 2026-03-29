'use strict';

const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(422).json({
      success: false,
      message: 'Validation error.',
      errors: err.errors?.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({ success: false, message: 'Related record not found.' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
};

module.exports = errorHandler;
