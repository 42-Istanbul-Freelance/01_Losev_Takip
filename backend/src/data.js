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
    parentConsent BOOLEAN DEFAULT 0,
    parentPhone TEXT,
    createdAt TEXT,
    updatedAt TEXT
  )`);

  db.run(`ALTER TABLE students ADD COLUMN password TEXT`, (err) => { });
  db.run(`ALTER TABLE students ADD COLUMN parentConsent BOOLEAN DEFAULT 0`, (err) => { });
  db.run(`ALTER TABLE students ADD COLUMN parentPhone TEXT`, (err) => { });

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
    role TEXT DEFAULT 'teacher',
    createdAt TEXT,
    updatedAt TEXT
  )`);

  db.run(`ALTER TABLE teachers ADD COLUMN role TEXT DEFAULT 'teacher'`, (err) => { });

  db.run(`CREATE TABLE IF NOT EXISTS activity_files (
    id TEXT PRIMARY KEY,
    activityId TEXT,
    fileName TEXT,
    filePath TEXT,
    fileType TEXT,
    fileSize INTEGER,
    uploadedAt TEXT,
    FOREIGN KEY(activityId) REFERENCES activities(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS head_office_admins (
    id TEXT PRIMARY KEY,
    firstName TEXT,
    lastName TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'admin',
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

// Dosya yönetimi
async function saveActivityFile(activityId, fileInfo) {
  const id = uuidv4();
  const now = new Date().toISOString();

  const sql = `INSERT INTO activity_files (id, activityId, fileName, filePath, fileType, fileSize, uploadedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?)`;

  await runAsync(sql, [
    id, activityId, fileInfo.fileName, fileInfo.filePath,
    fileInfo.fileType, fileInfo.fileSize, now
  ]);

  return getAsync(`SELECT * FROM activity_files WHERE id = ?`, [id]);
}

async function getActivityFiles(activityId) {
  return allAsync(`SELECT * FROM activity_files WHERE activityId = ?`, [activityId]);
}

async function deleteActivityFile(fileId) {
  return runAsync(`DELETE FROM activity_files WHERE id = ?`, [fileId]);
}

// Profil yönetimi
async function updateStudentProfile(studentId, payload) {
  const now = new Date().toISOString();
  const allowedFields = ['firstName', 'lastName', 'phone', 'email', 'schoolName', 'city', 'district', 'grade', 'coordinatorTeacherName', 'parentPhone', 'parentConsent'];

  const updates = [];
  const values = [];

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(payload[field]);
    }
  }

  if (updates.length === 0) return null;

  values.push(now, studentId);
  const sql = `UPDATE students SET ${updates.join(', ')}, updatedAt = ? WHERE id = ?`;

  await runAsync(sql, values);
  return getStudentById(studentId);
}

async function changeStudentPassword(studentId, newPassword) {
  const now = new Date().toISOString();
  await runAsync(`UPDATE students SET password = ?, updatedAt = ? WHERE id = ?`, [newPassword, now, studentId]);
  return true;
}

// Genel Merkez Admin işlemleri
async function createHeadOfficeAdmin(payload) {
  const id = uuidv4();
  const now = new Date().toISOString();

  const sql = `INSERT INTO head_office_admins (id, firstName, lastName, email, password, role, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  await runAsync(sql, [
    id, payload.firstName, payload.lastName, payload.email,
    payload.password, payload.role || 'admin', now, now
  ]);

  const admin = await getAsync(`SELECT * FROM head_office_admins WHERE id = ?`, [id]);
  delete admin.password;
  return admin;
}

async function loginHeadOfficeAdmin(email, password) {
  const admin = await getAsync(`SELECT * FROM head_office_admins WHERE email = ? AND password = ?`, [email, password]);
  if (admin) {
    delete admin.password;
  }
  return admin;
}

async function listHeadOfficeAdmins() {
  const admins = await allAsync(`SELECT * FROM head_office_admins`);
  return admins.map(a => { delete a.password; return a; });
}

// Raporlama fonksiyonları
async function getStatisticsByCity() {
  const sql = `
    SELECT
      s.city,
      COUNT(DISTINCT s.id) as studentCount,
      COUNT(DISTINCT CASE WHEN a.status = 'approved' THEN a.id END) as activityCount,
      SUM(CASE WHEN a.status = 'approved' THEN a.hours ELSE 0 END) as totalHours
    FROM students s
    LEFT JOIN activities a ON s.id = a.studentId
    WHERE s.city IS NOT NULL AND s.city != ''
    GROUP BY s.city
    ORDER BY totalHours DESC
  `;
  return allAsync(sql);
}

async function getActivityTypeStats() {
  const sql = `
    SELECT
      type,
      COUNT(*) as count,
      SUM(CASE WHEN status = 'approved' THEN hours ELSE 0 END) as totalHours
    FROM activities
    GROUP BY type
    ORDER BY count DESC
  `;
  return allAsync(sql);
}

async function getMonthlyStats(year = new Date().getFullYear()) {
  const sql = `
    SELECT
      strftime('%m', date) as month,
      COUNT(*) as activityCount,
      SUM(CASE WHEN status = 'approved' THEN hours ELSE 0 END) as totalHours
    FROM activities
    WHERE strftime('%Y', date) = ?
    GROUP BY month
    ORDER BY month
  `;
  return allAsync(sql, [String(year)]);
}

async function getOverallStatistics() {
  const stats = await getAsync(`
    SELECT
      (SELECT COUNT(*) FROM students) as totalStudents,
      (SELECT COUNT(*) FROM teachers) as totalTeachers,
      (SELECT COUNT(*) FROM activities) as totalActivities,
      (SELECT COUNT(*) FROM activities WHERE status = 'approved') as approvedActivities,
      (SELECT COUNT(*) FROM activities WHERE status = 'pending') as pendingActivities,
      (SELECT SUM(hours) FROM activities WHERE status = 'approved') as totalVolunteerHours,
      (SELECT COUNT(DISTINCT schoolName) FROM students WHERE schoolName IS NOT NULL AND schoolName != '') as totalSchools,
      (SELECT COUNT(DISTINCT city) FROM students WHERE city IS NOT NULL AND city != '') as totalCities
  `);

  return {
    totalStudents: stats.totalStudents || 0,
    totalTeachers: stats.totalTeachers || 0,
    totalActivities: stats.totalActivities || 0,
    approvedActivities: stats.approvedActivities || 0,
    pendingActivities: stats.pendingActivities || 0,
    totalVolunteerHours: stats.totalVolunteerHours || 0,
    totalSchools: stats.totalSchools || 0,
    totalCities: stats.totalCities || 0
  };
}

// Üniversite dokümanı için öğrenci raporu
async function generateStudentReport(studentId) {
  const student = await getStudentById(studentId);
  if (!student) return null;

  delete student.password;

  const summary = await computeSummary(studentId);
  const badge = calculateBadge(summary.total);
  const activities = await listActivitiesByStudent(studentId);
  const approvedActivities = activities.filter(a => a.status === 'approved');

  return {
    student,
    summary,
    badge,
    activities: approvedActivities,
    activityCount: approvedActivities.length,
    generatedAt: new Date().toISOString(),
    documentType: 'LÖSEV İnci Gönüllülük Raporu'
  };
}

// Rozet/sertifika kontrolü
async function checkAndAssignBadges(studentId) {
  const summary = await computeSummary(studentId);
  const badge = calculateBadge(summary.total);

  // Burada ileride rozet atama mantığı eklenebilir
  // Şimdilik sadece mevcut rozet durumunu döndürüyoruz

  return {
    studentId,
    currentBadge: badge,
    totalHours: summary.total,
    nextBadge: getNextBadge(summary.total)
  };
}

function getNextBadge(totalHours) {
  if (totalHours >= 200) return null; // Platin zaten en yüksek
  if (totalHours >= 100) return { code: 'platin', label: 'Platin İnci Lideri', requiredHours: 200 };
  if (totalHours >= 50) return { code: 'altin', label: 'Altın İnci', requiredHours: 100 };
  if (totalHours >= 25) return { code: 'gumus', label: 'Gümüş İnci', requiredHours: 50 };
  return { code: 'bronz', label: 'Bronz İnci', requiredHours: 25 };
}

module.exports = {
  createStudent,
  loginStudent,
  listStudents,
  getStudentById,
  updateStudentProfile,
  changeStudentPassword,
  createTeacher,
  loginTeacher,
  createHeadOfficeAdmin,
  loginHeadOfficeAdmin,
  listHeadOfficeAdmins,
  logActivity,
  listActivitiesByStudent,
  listAllActivities,
  updateActivityStatus,
  saveActivityFile,
  getActivityFiles,
  deleteActivityFile,
  computeSummary,
  calculateBadge,
  checkAndAssignBadges,
  aggregateBySchool,
  computeTopStudents,
  computeTopSchools,
  getStatisticsByCity,
  getActivityTypeStats,
  getMonthlyStats,
  getOverallStatistics,
  generateStudentReport,
};
