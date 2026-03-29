'use strict';
const fs = require('fs');
const path = require('path');

const ensureDir = async (dir) => {
  await fs.promises.mkdir(dir, { recursive: true });
  return dir;
};

const saveFileBuffer = async (fileBuffer, directory, filename) => {
  await ensureDir(directory);
  const filePath = path.join(directory, filename);
  await fs.promises.writeFile(filePath, fileBuffer);
  return filePath;
};

const buildRelativeUrl = (filePath) => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  return `/${path.relative(uploadsDir, filePath).split(path.sep).join('/')}`;
};

module.exports = { saveFileBuffer, buildRelativeUrl, ensureDir };
