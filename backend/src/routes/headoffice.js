const express = require('express');
const {
  createHeadOfficeAdmin,
  loginHeadOfficeAdmin,
  listHeadOfficeAdmins,
  listStudents,
  listAllActivities,
  getStudentById,
  updateActivityStatus,
  getActivityFiles,
} = require('../data');

const router = express.Router();

// Genel Merkez Admin kayıt (sadece mevcut adminler tarafından)
router.post('/register', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.firstName || !body.lastName || !body.email || !body.password) {
      return res.status(400).json({ error: 'firstName, lastName, email ve password zorunludur.' });
    }

    const admin = await createHeadOfficeAdmin(body);
    res.status(201).json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Genel Merkez Admin giriş
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email ve password zorunludur.' });
    }

    const admin = await loginHeadOfficeAdmin(email, password);
    if (!admin) {
      return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
    }

    res.json({ user: admin, role: 'headoffice' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tüm adminleri listele
router.get('/admins', async (req, res) => {
  try {
    const admins = await listHeadOfficeAdmins();
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tüm öğrencileri listele (detaylı)
router.get('/students', async (req, res) => {
  try {
    const students = await listStudents();
    // Şifreleri kaldır
    const safeStudents = students.map(s => {
      delete s.password;
      return s;
    });
    res.json(safeStudents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tüm faaliyetleri listele (detaylı)
router.get('/activities', async (req, res) => {
  try {
    const activities = await listAllActivities();

    // Öğrenci bilgilerini ekle
    const enriched = [];
    for (const activity of activities) {
      const student = await getStudentById(activity.studentId);
      const files = await getActivityFiles(activity.id);

      enriched.push({
        ...activity,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Bilinmiyor',
        schoolName: student?.schoolName || '',
        files
      });
    }

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Faaliyet onay/red (admin yetkisi)
router.patch('/activities/:id/status', async (req, res) => {
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

module.exports = router;
