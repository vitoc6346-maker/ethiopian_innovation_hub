// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/auth/login');
}

// Render Register Page
router.get('/register', async (req, res) => {
    try {
        const [departments] = await db.query('SELECT * FROM departments');
        res.render('register', { departments, error: null });
    } catch (err) {
        res.status(500).send('Database Error');
    }
});

// Handle Register Action
router.post('/register', async (req, res) => {
    const { fullName, email, password, departmentId } = req.body;

    if (!email.endsWith('@ethiopianairlines.com')) {
        const [departments] = await db.query('SELECT * FROM departments');
        return res.render('register', { 
            departments, 
            error: 'Registration restricted to official @ethiopianairlines.com emails.' 
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (full_name, email, password_hash, department_id) VALUES (?, ?, ?, ?)',
            [fullName, email, hashedPassword, departmentId]
        );
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        res.status(500).send('Registration failed. Email may already be registered.');
    }
});

// Render Login Page
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Handle Login Action
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.render('login', { error: 'Invalid email or password.' });
        }

        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.render('login', { error: 'Invalid email or password.' });
        }

        req.session.user = {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            role: user.role,
            departmentId: user.department_id
        };

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error during login.');
    }
});

// Render Profile Page
router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const [departments] = await db.query('SELECT * FROM departments');
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
        res.render('profile', { user: users[0], departments, error: null, success: null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading profile.');
    }
});

// Handle Profile Update
router.post('/profile', isAuthenticated, async (req, res) => {
    const { fullName, departmentId, currentPassword, newPassword } = req.body;
    const userId = req.session.user.id;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        const user = users[0];
        const [departments] = await db.query('SELECT * FROM departments');

        // If user is changing password, verify current password
        if (newPassword && newPassword.trim().length > 0) {
            const match = await bcrypt.compare(currentPassword, user.password_hash);
            if (!match) {
                return res.render('profile', { user, departments, error: 'Current password is incorrect.', success: null });
            }
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            await db.query('UPDATE users SET full_name = ?, department_id = ?, password_hash = ? WHERE id = ?', [fullName, departmentId, hashedNewPassword, userId]);
        } else {
            await db.query('UPDATE users SET full_name = ?, department_id = ? WHERE id = ?', [fullName, departmentId, userId]);
        }

        // Update session data
        req.session.user.fullName = fullName;
        req.session.user.departmentId = departmentId;

        res.render('profile', { user: { ...user, full_name: fullName, department_id: departmentId }, departments, error: null, success: 'Profile updated successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating profile.');
    }
});

// Handle Logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;