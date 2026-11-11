// routes/evaluation.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to check if user is an Evaluator or Admin
function isEvaluator(req, res, next) {
    if (req.session.user && (req.session.user.role === 'Evaluator' || req.session.user.role === 'Admin')) {
        return next();
    }
    res.status(403).send('Access denied. Evaluator permissions required.');
}

// View All Submissions for Review (Global Evaluator View)
router.get('/dashboard', isEvaluator, async (req, res) => {
    try {
        // Fetch ALL submissions across all departments
        const [submissions] = await db.query(
            `SELECT s.*, u.full_name AS author_name, d.department_name
             FROM submissions s 
             JOIN users u ON s.user_id = u.id 
             JOIN departments d ON s.department_id = d.id
             ORDER BY s.created_at DESC`
        );

        res.render('evaluator-dashboard', { submissions, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error loading evaluator dashboard.');
    }
});

// Update submission status (Approve / Reject / Under Review)
router.post('/update-status/:id', isEvaluator, async (req, res) => {
    const submissionId = req.params.id;
    const { status } = req.body;

    try {
        await db.query('UPDATE submissions SET status = ? WHERE id = ?', [status, submissionId]);
        
        // Log action in audit trail
        await db.query(
            `INSERT INTO audit_logs (submission_id, actor_id, action_type) VALUES (?, ?, ?)`,
            [submissionId, req.session.user.id, `STATUS_CHANGED_TO_${status.toUpperCase()}`]
        );

        res.redirect('/evaluator/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating submission status.');
    }
});

// Inside routes/evaluation.js -> router.post('/update-status/:id', ...)
router.post('/update-status/:id', isEvaluator, async (req, res) => {
    const submissionId = req.params.id;
    const { status } = req.body;

    try {
        await db.query('UPDATE submissions SET status = ? WHERE id = ?', [status, submissionId]);
        
        // Fetch submission author to send notification
        const [subs] = await db.query('SELECT user_id, title FROM submissions WHERE id = ?', [submissionId]);
        if (subs.length > 0) {
            const authorId = subs[0].user_id;
            const subTitle = subs[0].title;
            
            // Create notification for author
            await db.query(
                'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
                [authorId, `Your innovation "${subTitle}" status was updated to: ${status}`]
            );
        }

        // Log action in audit trail
        await db.query(
            `INSERT INTO audit_logs (submission_id, actor_id, action_type) VALUES (?, ?, ?)`,
            [submissionId, req.session.user.id, `STATUS_CHANGED_TO_${status.toUpperCase()}`]
        );

        res.redirect('/evaluator/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating submission status.');
    }
});

module.exports = router;