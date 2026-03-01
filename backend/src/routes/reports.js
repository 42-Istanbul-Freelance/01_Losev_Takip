const express = require('express');
const {
  aggregateBySchool,
  computeTopStudents,
  computeTopSchools,
  getStatisticsByCity,
  getActivityTypeStats,
  getMonthlyStats,
  getOverallStatistics,
  generateStudentReport,
} = require('../data');

const router = express.Router();

// Genel istatistikler (dashboard için)
router.get('/overview', async (req, res) => {
  try {
    const stats = await getOverallStatistics();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// İl bazlı istatistikler (etki haritası için)
router.get('/by-city', async (req, res) => {
  try {
    const stats = await getStatisticsByCity();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Etkinlik türü bazlı istatistikler
router.get('/by-activity-type', async (req, res) => {
  try {
    const stats = await getActivityTypeStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Aylık istatistikler (grafik için)
router.get('/monthly', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const stats = await getMonthlyStats(year);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Okul bazlı özet
router.get('/schools', async (req, res) => {
  try {
    const data = await aggregateBySchool();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// En aktif öğrenciler
router.get('/top-students', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await computeTopStudents(limit);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// En aktif okullar
router.get('/top-schools', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await computeTopSchools(limit);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Öğrenci raporu (üniversite başvurusu için)
router.get('/student-report/:id', async (req, res) => {
  try {
    const report = await generateStudentReport(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Öğrenci bulunamadı.' });
    }
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
