const express = require('express');
const {
  aggregateBySchool,
  computeTopStudents,
  computeTopSchools,
} = require('../data');

const router = express.Router();

router.get('/schools', async (req, res) => {
  try {
    const data = await aggregateBySchool();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/top-students', async (req, res) => {
  try {
    const data = await computeTopStudents(10);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/top-schools', async (req, res) => {
  try {
    const data = await computeTopSchools(10);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
