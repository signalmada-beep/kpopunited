const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const dotenv = require('dotenv');
const upload = require('./multer');
const config = require('./config');
const { uploadImage, deleteImage, listUserImages } = require('./upload');

dotenv.config();

const app = express();

// ============================================================
// 🔥 CORS - Avelao ny requête rehetra
// ============================================================
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://192.168.42.23:5173',  // ✅ Ampidiro ny IP anao
    'http://192.168.42.23:5174',
    'http://192.168.42.23:5175',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ✅ OPTIONS preflight
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(config.uploadDir));

// ============================================================
// 🔥 ROUTES
// ============================================================

// ✅ Upload
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' });
    const userId = req.body.userId || 'anonymous';
    const folder = req.body.folder || 'profiles';
    const result = await uploadImage(req.file, userId, folder);
    res.json({ success: true, data: result });
  } catch (error) {
    if (req.file && req.file.path) {
      try { await fs.remove(req.file.path); } catch (e) {}
    }
    res.status(500).json({ error: error.message || 'Erreur upload' });
  }
});

// ✅ Upload multiple
app.post('/api/upload/multiple', upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }
    const userId = req.body.userId || 'anonymous';
    const folder = req.body.folder || 'posts';
    const results = [];
    for (const file of req.files) {
      const result = await uploadImage(file, userId, folder);
      results.push(result);
    }
    res.json({ success: true, data: results });
  } catch (error) {
    if (req.files) {
      for (const file of req.files) {
        try { if (file.path) await fs.remove(file.path); } catch (e) {}
      }
    }
    res.status(500).json({ error: error.message || 'Erreur upload' });
  }
});

// ✅ Supprimer
app.delete('/api/upload/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.query.userId;
    const folder = req.query.folder || 'profiles';
    if (!userId) return res.status(400).json({ error: 'userId requis' });
    const filePath = path.join(config.uploadDir, folder, userId, filename);
    const result = await deleteImage(filePath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Lister
app.get('/api/upload/list/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const folder = req.query.folder || 'profiles';
    const images = await listUserImages(userId, folder);
    res.json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.listen(config.port, () => {
  console.log('Serveur upload lance sur http://localhost:' + config.port);
  console.log('Dossier uploads: ' + config.uploadDir);
});