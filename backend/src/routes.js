const express = require('express');
const {
  createStudent,
  listStudents,
  getStudentById,
  logActivity,
  listActivitiesByStudent,
  computeSummary,
  calculateBadge,
} = require('./data');

const router = express.Router();

// Öğrenci oluşturma
router.post('/students', (req, res) => {
  const body = req.body || {};

  if (!body.firstName || !body.lastName || !body.schoolName) {
    return res.status(400).json({
      error: 'firstName, lastName ve schoolName zorunludur.',
    });
  }

  const student = createStudent(body);
  res.status(201).json(student);
});

// Öğrencileri listeleme (basit, sayfalama yok)
router.get('/students', (req, res) => {
  res.json(listStudents());
});

// Tek öğrenci detayı + özet
router.get('/students/:id', (req, res) => {
  const student = getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Öğrenci bulunamadı' });
  }

  const summary = computeSummary(student.id);
  const badge = calculateBadge(summary.total);

  res.json({ student, summary, badge });
});

// Faaliyet ekleme (öğrenci tarafından)
router.post('/students/:id/activities', (req, res) => {
  const student = getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Öğrenci bulunamadı' });
  }

  const body = req.body || {};
  if (!body.date || !body.type || body.hours == null) {
    return res.status(400).json({
      error: 'date, type ve hours alanları zorunludur.',
    });
  }

  const activity = logActivity(student.id, body);
  res.status(201).json(activity);
});

// Öğrenci faaliyetlerini listeleme
router.get('/students/:id/activities', (req, res) => {
  const student = getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Öğrenci bulunamadı' });
  }

  const logs = listActivitiesByStudent(student.id);
  res.json(logs);
});

module.exports = router;
