'use strict';
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const csvFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ext !== '.csv') {
    return cb(new Error('Only CSV files are allowed.'));
  }
  cb(null, true);
};

const csvUpload = multer({
  storage,
  fileFilter: csvFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = csvUpload;
