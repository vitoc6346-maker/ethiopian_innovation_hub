// routes/ideas.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configure multer storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/auth/login');
}

// Render Marketplace Feed with Search, Filter & Sort
router.get('/feed', async (req, res) => {
    try {
        const { search, department, status, sort } = req.query;

        let query = `
            SELECT s.*, u.full_name AS author_name, d.department_name,
                   (SELECT COUNT(*) FROM idea_votes v WHERE v.submission_id = s.id) AS vote_count,
                   (
                       SELECT GROUP_CONCAT(u_co.full_name SEPARATOR ', ')
                       FROM submission_coauthors ca
                       JOIN users u_co ON ca.user_id = u_co.id
                       WHERE ca.submission_id = s.id
                   ) AS coauthors
            FROM submissions s
            JOIN users u ON s.user_id = u.id
            JOIN departments d ON s.department_id = d.id
            WHERE 1=1
        `;
        let queryParams = [];

        if (search && search.trim() !== '') {
            query += ` AND (s.title LIKE ? OR s.description LIKE ?)`;
            queryParams.push(`%${search.trim()}%`, `%${search.trim()}%`);
        }

        if (department && department !== '') {
            query += ` AND s.department_id = ?`;
            queryParams.push(department);
        }

        if (status && status !== '') {
            query += ` AND s.status = ?`;
            queryParams.push(status);
        }

        if (sort === 'oldest') {
            query += ` ORDER BY s.created_at ASC`;
        } else if (sort === 'roi') {
            query += ` ORDER BY s.projected_savings_usd DESC`;
        } else if (sort === 'title') {
            query += ` ORDER BY s.title ASC`;
        } else {
            query += ` ORDER BY vote_count DESC, s.created_at DESC`;
        }

        const [rows] = await db.query(query, queryParams);
        const [departments] = await db.query('SELECT * FROM departments');

        res.render('feed', { 
            submissions: rows, 
            departments, 
            filters: { search: search || '', department: department || '', status: status || '', sort: sort || 'votes' },
            user: req.session.user || null 
        });
    } catch (err) {
        console.error('Feed error:', err);
        res.status(500).send('Error loading innovation feed.');
    }
});

// Handle Upvoting an Idea
router.post('/vote/:id', isAuthenticated, async (req, res) => {
    const submissionId = req.params.id;
    const userId = req.session.user.id;

    try {
        const [existing] = await db.query('SELECT * FROM idea_votes WHERE submission_id = ? AND user_id = ?', [submissionId, userId]);
        
        if (existing.length === 0) {
            await db.query('INSERT INTO idea_votes (submission_id, user_id) VALUES (?, ?)', [submissionId, userId]);
            
            // Notify author of endorsement
            const [subs] = await db.query('SELECT user_id, title FROM submissions WHERE id = ?', [submissionId]);
            if (subs.length > 0 && subs[0].user_id !== userId) {
                await db.query(
                    'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
                    [subs[0].user_id, `Your innovation "${subs[0].title}" received a new endorsement!`]
                );
            }
        }

        res.redirect(req.get('referer') || '/ideas/feed');
    } catch (err) {
        console.error('Voting error:', err);
        res.status(500).send('Error processing vote.');
    }
});

// Render Submission Form
router.get('/submit', isAuthenticated, async (req, res) => {
    const questId = req.query.questId || null;
    let questTitle = null;

    if (questId) {
        const [quests] = await db.query('SELECT title FROM quests WHERE id = ?', [questId]);
        if (quests.length > 0) questTitle = quests[0].title;
    }

    res.render('submit', { user: req.session.user, questId, questTitle, error: null });
});

// Handle Idea Submission with ROI Metrics & SHA-256 Proof Generation
router.post('/submit', isAuthenticated, upload.single('ideaFile'), async (req, res) => {
    const { title, description, coauthorEmails, questId, impactCategory, projectedSavings } = req.body;
    const userId = req.session.user.id;
    const departmentId = req.session.user.departmentId;

    if (!req.file) {
        return res.render('submit', { user: req.session.user, questId: null, questTitle: null, error: 'Please upload a supporting document or design file.' });
    }

    try {
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        const fileHash = hashSum.digest('hex');

        const savingsValue = projectedSavings ? parseFloat(projectedSavings) : 0.00;

        const [result] = await db.query(
            `INSERT INTO submissions (user_id, department_id, quest_id, title, description, impact_category, projected_savings_usd, file_path, file_hash, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted')`,
            [userId, departmentId, questId || null, title, description, impactCategory, savingsValue, req.file.filename, fileHash]
        );

        const submissionId = result.insertId;

        let addedCoauthors = [];
        if (coauthorEmails && coauthorEmails.trim().length > 0) {
            const emailList = coauthorEmails.split(',').map(e => e.trim().toLowerCase()).filter(e => e.length > 0);

            for (const email of emailList) {
                if (email === req.session.user.email.toLowerCase()) continue;

                const [foundUser] = await db.query('SELECT id, full_name, email FROM users WHERE email = ?', [email]);
                if (foundUser.length > 0) {
                    await db.query(
                        'INSERT IGNORE INTO submission_coauthors (submission_id, user_id) VALUES (?, ?)',
                        [submissionId, foundUser[0].id]
                    );
                    addedCoauthors.push(foundUser[0].full_name);
                }
            }
        }

        await db.query(
            `INSERT INTO audit_logs (submission_id, actor_id, action_type) VALUES (?, ?, 'CREATED_AND_HASHED')`,
            [submissionId, userId]
        );

        res.render('proof-certificate', {
            submission: {
                id: submissionId,
                title,
                description,
                impactCategory,
                projectedSavings: savingsValue,
                fileHash,
                createdAt: new Date().toLocaleString(),
                authorName: req.session.user.fullName,
                authorEmail: req.session.user.email,
                coauthors: addedCoauthors
            }
        });

    } catch (err) {
        console.error('Submission error:', err);
        res.status(500).send('Server error processing your idea submission.');
    }
});

// View Single Idea Detail & Discussion Chat
router.get('/detail/:id', async (req, res) => {
    const submissionId = req.params.id;
    try {
        const [subs] = await db.query(`
            SELECT s.*, u.full_name AS author_name, d.department_name,
                   (SELECT COUNT(*) FROM idea_votes v WHERE v.submission_id = s.id) AS vote_count,
                   (
                       SELECT GROUP_CONCAT(u_co.full_name SEPARATOR ', ')
                       FROM submission_coauthors ca
                       JOIN users u_co ON ca.user_id = u_co.id
                       WHERE ca.submission_id = s.id
                   ) AS coauthors
            FROM submissions s
            JOIN users u ON s.user_id = u.id
            JOIN departments d ON s.department_id = d.id
            WHERE s.id = ?
        `, [submissionId]);

        if (subs.length === 0) return res.status(404).send('Innovation not found.');

        const [comments] = await db.query(`
            SELECT c.*, u.full_name AS commenter_name, u.role AS commenter_role
            FROM submission_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.submission_id = ?
            ORDER BY c.created_at ASC
        `, [submissionId]);

        res.render('idea-detail', { 
            submission: subs[0], 
            comments, 
            user: req.session.user || null 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading idea details.');
    }
});

// Post Comment / Discussion Chat Message
router.post('/comment/:id', isAuthenticated, async (req, res) => {
    const submissionId = req.params.id;
    const { commentText, parentId } = req.body;
    const userId = req.session.user.id;

    try {
        await db.query(
            'INSERT INTO submission_comments (submission_id, user_id, comment_text, parent_id) VALUES (?, ?, ?, ?)',
            [submissionId, userId, commentText, parentId || null]
        );

        // Notify submission author if someone else commented
        const [subs] = await db.query('SELECT user_id, title FROM submissions WHERE id = ?', [submissionId]);
        if (subs.length > 0 && subs[0].user_id !== userId) {
            await db.query(
                'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
                [subs[0].user_id, `${req.session.user.fullName} commented on your idea: "${subs[0].title}"`]
            );
        }

        res.redirect(`/ideas/detail/${submissionId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error posting comment.');
    }
});

module.exports = router;