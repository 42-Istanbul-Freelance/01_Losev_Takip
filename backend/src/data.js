const { v4: uuidv4 } = require('uuid');

// In-memory stores (replace with a real database later)
const students = new Map(); // id -> student
const activities = new Map(); // id -> activity log

function createStudent(payload) {
  const id = uuidv4();
  const now = new Date().toISOString();

  const student = {
    id,
    firstName: payload.firstName,
    lastName: payload.lastName,
    nationalId: payload.nationalId || null,
    schoolName: payload.schoolName,
    city: payload.city,
    district: payload.district,
    grade: payload.grade,
    phone: payload.phone,
    email: payload.email,
    coordinatorTeacherName: payload.coordinatorTeacherName,
    targetHours: payload.targetHours || 40,
    createdAt: now,
    updatedAt: now,
  };

  students.set(id, student);
  return student;
}

function listStudents() {
  return Array.from(students.values());
}

function getStudentById(id) {
  return students.get(id) || null;
}

function logActivity(studentId, payload) {
  const id = uuidv4();
  const now = new Date().toISOString();

  const activity = {
    id,
    studentId,
    date: payload.date,
    type: payload.type,
    hours: Number(payload.hours) || 0,
    description: payload.description || '',
    status: 'pending', // pending -> approved/rejected by teacher
    createdAt: now,
    updatedAt: now,
  };

  activities.set(id, activity);
  return activity;
}

function listActivitiesByStudent(studentId) {
  return Array.from(activities.values()).filter(a => a.studentId === studentId);
}

function computeSummary(studentId) {
  const logs = listActivitiesByStudent(studentId).filter(a => a.status === 'approved');

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

module.exports = {
  createStudent,
  listStudents,
  getStudentById,
  logActivity,
  listActivitiesByStudent,
  computeSummary,
  calculateBadge,
};
