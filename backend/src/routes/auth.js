const express = require('express');
const {
    createStudent,
    loginStudent,
    createTeacher,
    loginTeacher
} = require('../data');

const router = express.Router();

router.post('/login', async (req, res) => {
    const { role, email, password } = req.body || {};

    if (!role || !email || !password) {
        return res.status(400).json({ error: 'Role, email, ve password zorunludur.' });
    }

    try {
        if (role === 'student') {
            const student = await loginStudent(email, password);
            if (student) {
                return res.json({ user: student, role: 'student' });
            }
        } else if (role === 'teacher') {
            const teacher = await loginTeacher(email, password);
            if (teacher) {
                return res.json({ user: teacher, role: 'teacher' });
            }
        } else {
            return res.status(400).json({ error: 'Geçersiz role.' });
        }

        return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

router.post('/register', async (req, res) => {
    const { role, ...payload } = req.body || {};

    if (!role || !payload.email || !payload.password) {
        return res.status(400).json({ error: 'Role, email ve password zorunludur.' });
    }

    try {
        if (role === 'student') {
            if (!payload.firstName || !payload.lastName || !payload.schoolName) {
                return res.status(400).json({ error: 'Öğrenci için firstName, lastName ve schoolName zorunludur.' });
            }
            const student = await createStudent(payload);
            return res.status(201).json({ user: student, role: 'student' });
        } else if (role === 'teacher') {
            if (!payload.firstName || !payload.lastName) {
                return res.status(400).json({ error: 'Öğretmen için firstName ve lastName zorunludur.' });
            }
            const teacher = await createTeacher(payload);
            return res.status(201).json({ user: teacher, role: 'teacher' });
        } else {
            return res.status(400).json({ error: 'Geçersiz role.' });
        }
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: 'Sunucu doğrulama hatası ya da email zaten kayıtlı olabilir.' });
    }
});

module.exports = router;
