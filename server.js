const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// CORS - Avelao ny rehetra
// ============================================================
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.168.42.42:5173',
    'http://192.168.42.141:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// STATIC FOLDER - PUBLIC ACCESS
// ============================================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// CONFIGURATION MULTER
// ============================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.body.folder || 'general';
    const uploadPath = path.join(__dirname, 'uploads', folder);
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = $'{Date.now()}_';
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté'), false);
    }
  }
});

// ============================================================
// ROUTES
// ============================================================

// ✅ Upload unique
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier' });
    }

    const folder = req.body.folder || 'general';
    const userId = req.body.userId || 'anonymous';
    const baseUrl = $'{req.protocol}://';

    res.json({
      success: true,
      data: {
        url: $'{baseUrl}/uploads/src\utils/',
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: /uploads/$'{folder}/',
        userId: userId,
        folder: folder,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Erreur upload:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
});

// ✅ Upload multiple
app.post('/api/upload/multiple', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier' });
    }

    const folder = req.body.folder || 'general';
    const userId = req.body.userId || 'anonymous';
    const baseUrl = $'{req.protocol}://';

    const results = req.files.map(file => ({
      url: $'{baseUrl}/uploads/src\utils/',
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: /uploads/$'{folder}/',
      userId: userId,
      folder: folder,
      uploadedAt: new Date().toISOString()
    }));

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('❌ Erreur upload multiple:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
});

// ✅ Lister les fichiers
app.get('/api/uploads/:userId', (req, res) => {
  const userId = req.params.userId;
  const folder = req.query.folder || 'general';
  const uploadPath = path.join(__dirname, 'uploads', folder);

  if (!fs.existsSync(uploadPath)) {
    return res.json({ success: true, data: [] });
  }

  const files = fs.readdirSync(uploadPath);
  const baseUrl = $'{req.protocol}://';

  const results = files
    .filter(file => file.includes(userId) || req.query.all === 'true')
    .map(file => ({
      url: $'{baseUrl}/uploads/src\utils/',
      filename: file,
      path: /uploads/$'{folder}/'
    }));

  res.json({ success: true, data: results });
});

// ✅ Supprimer un fichier
app.delete('/api/upload/:filename', (req, res) => {
  const filename = req.params.filename;
  const folder = req.query.folder || 'general';
  const filePath = path.join(__dirname, 'uploads', folder, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier non trouvé' });
  }

  fs.unlinkSync(filePath);
  res.json({ success: true, message: 'Fichier supprimé' });
});

// ============================================================
// LANCER LE SERVEUR
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(✅ Serveur démarré sur http://localhost:);
  console.log(📁 Uploads disponible sur http://localhost:/uploads/);
});
