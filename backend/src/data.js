const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    firstName TEXT,
    lastName TEXT,
    nationalId TEXT,
    schoolName TEXT,
    city TEXT,
    district TEXT,
    grade TEXT,
    phone TEXT,
    email TEXT,
    password TEXT,
    coordinatorTeacherName TEXT,
    targetHours INTEGER,
    createdAt TEXT,
    updatedAt TEXT
  )`);

  db.run(`ALTER TABLE students ADD COLUMN password TEXT`, (err) => { });

  db.run(`CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    studentId TEXT,
    date TEXT,
    type TEXT,
    hours REAL,
    description TEXT,
    status TEXT,
    reviewNote TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY(studentId) REFERENCES students(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    firstName TEXT,
    lastName TEXT,
    email TEXT UNIQUE,
    password TEXT,
    schoolName TEXT,
    createdAt TEXT,
    updatedAt TEXT
  )`);
});

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function createStudent(payload) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const targetHours = payload.targetHours || 40;

  const sql = `INSERT INTO students (id, firstName, lastName, nationalId, schoolName, city, district, grade, phone, email, password, coordinatorTeacherName, targetHours, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  await runAsync(sql, [
    id, payload.firstName, payload.lastName, payload.nationalId || null,
    payload.schoolName, payload.city, payload.district, payload.grade,
    payload.phone, payload.email, payload.password, payload.coordinatorTeacherName, targetHours,
    now, now
  ]);

  const student = await getStudentById(id);
  delete student.password;
  return student;
}

async function loginStudent(email, password) {
  const student = await getAsync(`SELECT * FROM students WHERE email = ? AND password = ?`, [email, password]);
  if (student) {
    delete student.password;
  }
  return student;
}

async function createTeacher(payload) {
  const id = uuidv4();
  const now = new Date().toISOString();

  const sql = `INSERT INTO teachers (id, firstName, lastName, email, password, schoolName, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  await runAsync(sql, [
    id, payload.firstName, payload.lastName, payload.email, payload.password, payload.schoolName, now, now
  ]);

  const teacher = await getAsync(`SELECT * FROM teachers WHERE id = ?`, [id]);
  delete teacher.password;
  return teacher;
}

async function loginTeacher(email, password) {
  const teacher = await getAsync(`SELECT * FROM teachers WHERE email = ? AND password = ?`, [email, password]);
  if (teacher) {
    delete teacher.password;
  }
  return teacher;
}

async function listStudents() {
  return allAsync(`SELECT * FROM students`);
}

async function getStudentById(id) {
  return getAsync(`SELECT * FROM students WHERE id = ?`, [id]);
}

async function logActivity(studentId, payload) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const hours = Number(payload.hours) || 0;

  const sql = `INSERT INTO activities (id, studentId, date, type, hours, description, status, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  await runAsync(sql, [
    id, studentId, payload.date, payload.type, hours,
    payload.description || '', 'pending', now, now
  ]);

  return getAsync(`SELECT * FROM activities WHERE id = ?`, [id]);
}

async function listActivitiesByStudent(studentId) {
  return allAsync(`SELECT * FROM activities WHERE studentId = ?`, [studentId]);
}

async function listAllActivities() {
  return allAsync(`SELECT * FROM activities`);
}

async function updateActivityStatus(id, status, note) {
  const allowed = ['pending', 'approved', 'rejected'];
  if (!allowed.includes(status)) return null;

  const activity = await getAsync(`SELECT * FROM activities WHERE id = ?`, [id]);
  if (!activity) return null;

  const now = new Date().toISOString();
  await runAsync(`UPDATE activities SET status = ?, reviewNote = ?, updatedAt = ? WHERE id = ?`, [
    status, note || null, now, id
  ]);

  return getAsync(`SELECT * FROM activities WHERE id = ?`, [id]);
}

async function computeSummary(studentId) {
  const logs = await allAsync(`SELECT * FROM activities WHERE studentId = ? AND status = 'approved'`, [studentId]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let total = 0;
  let yearly = 0;
  let monthly = 0;

  for (const log of logs) {
    const h = Number(log.hours) || 0;
    total += h;

    const d = new Date(log.date);
    if (d.getFullYear() === currentYear) {
      yearly += h;
      if (d.getMonth() === currentMonth) {
        monthly += h;
      }
    }
  }

  return { total, yearly, monthly };
}

function calculateBadge(totalHours) {
  if (totalHours >= 200) return { code: 'platin', label: 'Platin İnci Lideri' };
  if (totalHours >= 100) return { code: 'altin', label: 'Altın İnci' };
  if (totalHours >= 50) return { code: 'gumus', label: 'Gümüş İnci' };
  if (totalHours >= 25) return { code: 'bronz', label: 'Bronz İnci' };
  return { code: 'none', label: 'Henüz rozet yok' };
}

async function aggregateBySchool() {
  const sql = `
    SELECT 
      s.schoolName, 
      COUNT(DISTINCT s.id) as studentCount, 
      SUM(CASE WHEN a.status = 'approved' THEN a.hours ELSE 0 END) as totalHours
    FROM students s
    LEFT JOIN activities a ON s.id = a.studentId
    WHERE s.schoolName IS NOT NULL AND s.schoolName != ''
    GROUP BY s.schoolName
  `;
  const rows = await allAsync(sql);
  return rows.map(r => ({
    schoolName: r.schoolName,
    totalHours: Number(r.totalHours) || 0,
    studentCount: r.studentCount
  }));
}

async function computeTopStudents(limit = 10) {
  const sql = `
    SELECT 
      s.id, 
      s.firstName || ' ' || s.lastName as name, 
      s.schoolName, 
      SUM(a.hours) as totalHours
    FROM students s
    JOIN activities a ON s.id = a.studentId
    WHERE a.status = 'approved'
    GROUP BY s.id
    ORDER BY totalHours DESC
    LIMIT ?
  `;
  const rows = await allAsync(sql, [limit]);
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    schoolName: r.schoolName,
    totalHours: Number(r.totalHours) || 0
  }));
}

async function computeTopSchools(limit = 10) {
  const aggregation = await aggregateBySchool();
  return aggregation
    .sort((a, b) => b.totalHours - a.totalHours)
    .slice(0, limit);
}

module.exports = {
  createStudent,
  loginStudent,
  listStudents,
  getStudentById,
  createTeacher,
  loginTeacher,
  logActivity,
  listActivitiesByStudent,
  listAllActivities,
  updateActivityStatus,
  computeSummary,
  calculateBadge,
  aggregateBySchool,
  computeTopStudents,
  computeTopSchools,
};
