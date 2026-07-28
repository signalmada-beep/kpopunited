const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

const getFileUrl = function (req, filePath) {
  const relativePath = path.relative(config.uploadDir, filePath);
  return config.baseUrl + '/uploads/' + relativePath.replace(/\\/g, '/');
};

const uploadImage = async function (file, userId, folder) {
  if (folder === undefined) folder = 'profiles';
  if (!file) throw new Error('Aucun fichier fourni');
  const url = getFileUrl(null, file.path);
  return {
    url: url,
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    path: file.path,
    userId: userId,
    folder: folder,
    uploadedAt: new Date().toISOString(),
  };
};

const deleteImage = async function (filePath) {
  const fullPath = path.resolve(filePath);
  if (!fullPath.startsWith(config.uploadDir)) {
    throw new Error('Acces non autorise');
  }
  if (await fs.pathExists(fullPath)) {
    await fs.remove(fullPath);
    return { success: true, path: fullPath };
  }
  return { success: false, message: 'Fichier non trouve' };
};

const listUserImages = async function (userId, folder) {
  if (folder === undefined) folder = 'profiles';
  const userDir = path.join(config.uploadDir, folder, userId);
  if (!await fs.pathExists(userDir)) return [];
  const files = await fs.readdir(userDir);
  const images = [];
  for (const file of files) {
    const filePath = path.join(userDir, file);
    const stat = await fs.stat(filePath);
    if (stat.isFile()) {
      images.push({
        filename: file,
        url: config.baseUrl + '/uploads/' + folder + '/' + userId + '/' + file,
        size: stat.size,
        createdAt: stat.birthtime,
        modifiedAt: stat.mtime,
      });
    }
  }
  return images;
};

module.exports = { uploadImage, deleteImage, listUserImages };