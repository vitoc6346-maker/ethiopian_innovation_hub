// routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to check Admin role
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'Admin') {
        return next();
    }
    res.status(403).send('Access denied. Administrator permissions required.');
}

// View Tamper-Proof Audit Logs & IP/Action Tracker
router.get('/audit-logs', isAdmin, async (req, res) => {
    try {
        const [logs] = await db.query(`
            SELECT a.*, s.title AS submission_title, s.file_hash, u.full_name AS actor_name, u.email AS actor_email
            FROM audit_logs a
            JOIN submissions s ON a.submission_id = s.id
            JOIN users u ON a.actor_id = u.id
            ORDER BY a.timestamp DESC
        `);

        res.render('admin-audit', { logs, user: req.session.user });
    } catch (err) {
        console.error('Audit log error:', err);
        res.status(500).send('Error loading audit logs.');
    }
});

module.exports = router;