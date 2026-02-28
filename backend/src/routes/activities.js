const express = require('express');
const {
  listAllActivities,
  updateActivityStatus,
  getStudentById,
} = require('../data');

const router = express.Router();

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

        result.push({
          ...a,
          studentName: `${student.firstName} ${student.lastName}`,
          schoolName: student.schoolName,
          coordinatorTeacherName: student.coordinatorTeacherName
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

module.exports = router;
