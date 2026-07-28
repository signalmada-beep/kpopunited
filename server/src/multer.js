const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

fs.ensureDirSync(config.uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.body.userId || 'anonymous';
    const folder = req.body.folder || 'profiles';
    const userDir = path.join(config.uploadDir, folder, userId);
    fs.ensureDirSync(userDir);
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);
    const name = Date.now() + '_' + uuidv4().slice(0, 8) + extension;
    cb(null, name);
  }
});

const fileFilter = function (req, file, cb) {
  if (config.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format non supporte: ' + file.mimetype), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter: fileFilter,
});

module.exports = upload;