// routes/quests.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to check authentication
function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/auth/login');
}

// Middleware for Evaluator or Admin role
function isManager(req, res, next) {
    if (req.session.user && (req.session.user.role === 'Evaluator' || req.session.user.role === 'Admin')) {
        return next();
    }
    res.status(403).send('Access denied. Manager permissions required to create Quests.');
}

// Render Quests Index (List Active & Closed Quests)
router.get('/', async (req, res) => {
    try {
        const [quests] = await db.query(`
            SELECT q.*, d.department_name,
                   (SELECT COUNT(*) FROM submissions s WHERE s.quest_id = q.id) AS solution_count
            FROM quests q
            JOIN departments d ON q.department_id = d.id
            ORDER BY q.created_at DESC
        `);

        const [departments] = await db.query('SELECT * FROM departments');

        res.render('quests', { quests, departments, user: req.session.user || null });
    } catch (err) {
        console.error('Quests fetch error:', err);
        res.status(500).send('Error loading Innovation Quests.');
    }
});

// Handle Creating a New Quest (Managers / Admins)
router.post('/create', isManager, async (req, res) => {
    const { title, description, departmentId } = req.body;

    try {
        await db.query(
            'INSERT INTO quests (title, description, department_id) VALUES (?, ?, ?)',
            [title, description, departmentId]
        );
        res.redirect('/quests');
    } catch (err) {
        console.error('Create quest error:', err);
        res.status(500).send('Error creating Quest.');
    }
});

module.exports = router;