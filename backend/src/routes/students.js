const express = require('express');
const {
  createStudent,
  listStudents,
  getStudentById,
  logActivity,
  listActivitiesByStudent,
  computeSummary,
  calculateBadge,
} = require('../data');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.firstName || !body.lastName || !body.schoolName) {
      return res.status(400).json({ error: 'firstName, lastName ve schoolName zorunludur.' });
    }
    const student = await createStudent(body);
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const students = await listStudents();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const student = await getStudentById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Öğrenci bulunamadı' });

    const summary = await computeSummary(student.id);
    const badge = calculateBadge(summary.total);

    res.json({ student, summary, badge });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/activities', async (req, res) => {
  try {
    const student = await getStudentById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Öğrenci bulunamadı' });

    const body = req.body || {};
    if (!body.date || !body.type || body.hours == null) {
      return res.status(400).json({ error: 'date, type ve hours alanları zorunludur.' });
    }

    const activity = await logActivity(student.id, body);
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/activities', async (req, res) => {
  try {
    const student = await getStudentById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Öğrenci bulunamadı' });

    const logs = await listActivitiesByStudent(student.id);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
