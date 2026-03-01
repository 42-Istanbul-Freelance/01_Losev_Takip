const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  listAllActivities,
  updateActivityStatus,
  getStudentById,
  saveActivityFile,
  getActivityFiles,
  deleteActivityFile,
} = require('../data');

const router = express.Router();

// Uploads dizinini oluştur
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer yapılandırması
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim (JPEG, PNG, GIF) ve belge (PDF, DOC, DOCX) dosyaları yüklenebilir.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.get('/pending', async (req, res) => {
  try {
    const { teacherName, schoolName } = req.query;
    const all = await listAllActivities();

    const pending = all.filter(a => a.status === 'pending');

    // fetch all related students and combine
    const result = [];
    for (const a of pending) {
      const student = await getStudentById(a.studentId);
      if (student) {
        if (teacherName && student.coordinatorTeacherName) {
          if (!student.coordinatorTeacherName.toLowerCase().includes(String(teacherName).toLowerCase())) continue;
        }
        if (schoolName && student.schoolName) {
          if (!student.schoolName.toLowerCase().includes(String(schoolName).toLowerCase())) continue;
        }

        // Get files for this activity
        const files = await getActivityFiles(a.id);

        result.push({
          ...a,
          studentName: `${student.firstName} ${student.lastName}`,
          schoolName: student.schoolName,
          coordinatorTeacherName: student.coordinatorTeacherName,
          files
        });
      }
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body || {};
    const updated = await updateActivityStatus(req.params.id, status, note);
    if (!updated) {
      return res.status(400).json({ error: 'Geçersiz istek veya faaliyet bulunamadı.' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dosya yükleme endpoint'i
router.post('/:id/files', upload.array('files', 5), async (req, res) => {
  try {
    const activityId = req.params.id;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Dosya yüklenmedi.' });
    }

    const savedFiles = [];
    for (const file of files) {
      const fileInfo = {
        fileName: file.originalname,
        filePath: file.filename,
        fileType: file.mimetype,
        fileSize: file.size
      };
      const saved = await saveActivityFile(activityId, fileInfo);
      savedFiles.push(saved);
    }

    res.status(201).json({
      message: `${files.length} dosya başarıyla yüklendi.`,
      files: savedFiles
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Faaliyet dosyalarını listele
router.get('/:id/files', async (req, res) => {
  try {
    const files = await getActivityFiles(req.params.id);
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dosya indirme
router.get('/files/:fileId/download', async (req, res) => {
  try {
    const files = await getActivityFiles();
    const file = files.find(f => f.id === req.params.fileId);

    if (!file) {
      return res.status(404).json({ error: 'Dosya bulunamadı.' });
    }

    const filePath = path.join(uploadsDir, file.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Dosya sunucuda bulunamadı.' });
    }

    res.download(filePath, file.fileName);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dosya silme
router.delete('/files/:fileId', async (req, res) => {
  try {
    const files = await getActivityFiles();
    const file = files.find(f => f.id === req.params.fileId);

    if (!file) {
      return res.status(404).json({ error: 'Dosya bulunamadı.' });
    }

    // Fiziksel dosyayı sil
    const filePath = path.join(uploadsDir, file.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Veritabanından sil
    await deleteActivityFile(req.params.fileId);

    res.json({ message: 'Dosya başarıyla silindi.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
