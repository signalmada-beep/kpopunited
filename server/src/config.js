const path = require('path');

module.exports = {
  port: process.env.PORT || 5000,
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
  uploadDir: path.join(__dirname, '../uploads'),
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
};
