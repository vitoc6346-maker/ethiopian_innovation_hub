// server.js
const express = require('express');
const path = require('path');
const session = require('express-session');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'ethiopian_secure_innovation_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Global Notification Middleware (Placed right after session so it queries on every request)
// Global Notification & Unread Messages Middleware
app.use(async (req, res, next) => {
    if (req.session.user) {
        try {
            // Fetch unread general notifications
            const [notifs] = await db.query(
                'SELECT * FROM notifications WHERE user_id = ? AND is_read = FALSE ORDER BY created_at DESC',
                [req.session.user.id]
            );
            res.locals.notifications = notifs;

            // Fetch unread direct message count
            const [[{ unreadCount }]] = await db.query(
                'SELECT COUNT(*) AS unreadCount FROM messages WHERE receiver_id = ? AND is_read = FALSE',
                [req.session.user.id]
            );
            res.locals.unreadMessagesCount = unreadCount || 0;

        } catch (err) {
            console.error('Middleware error:', err);
            res.locals.notifications = [];
            res.locals.unreadMessagesCount = 0;
        }
    } else {
        res.locals.notifications = [];
        res.locals.unreadMessagesCount = 0;
    }
    next();
});

// View engine setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import Routes
const authRoutes = require('./routes/auth');
const ideaRoutes = require('./routes/ideas');
const evaluationRoutes = require('./routes/evaluation');
const adminRoutes = require('./routes/admin');
const questRoutes = require('./routes/quests');
const messageRoutes = require('./routes/messages');

app.use('/auth', authRoutes);
app.use('/ideas', ideaRoutes);
app.use('/evaluator', evaluationRoutes);
app.use('/admin', adminRoutes);
app.use('/quests', questRoutes);
app.use('/messages', messageRoutes);

// Mark Notifications as Read Route
app.get('/notifications/read', async (req, res) => {
    if (req.session.user) {
        try {
            await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.session.user.id]);
        } catch (err) {
            console.error('Error marking notifications as read:', err);
        }
    }
    res.redirect(req.get('referer') || '/ideas/feed');
});

// Informative Home Route with Statistics & Featured Innovations
app.get('/', async (req, res) => {
    try {
        const [[{ totalSubmissions }]] = await db.query('SELECT COUNT(*) AS totalSubmissions FROM submissions');
        const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) AS totalUsers FROM users');
        const [[{ totalDepartments }]] = await db.query('SELECT COUNT(*) AS totalDepartments FROM departments');

        // Fetch top 3 most voted ideas
        const [featuredIdeas] = await db.query(`
            SELECT s.*, u.full_name AS author_name, d.department_name,
                   (SELECT COUNT(*) FROM idea_votes v WHERE v.submission_id = s.id) AS vote_count
            FROM submissions s
            JOIN users u ON s.user_id = u.id
            JOIN departments d ON s.department_id = d.id
            ORDER BY vote_count DESC, s.created_at DESC
            LIMIT 3
        `);

        res.render('index', { 
            user: req.session.user || null,
            stats: { totalSubmissions, totalUsers, totalDepartments },
            featuredIdeas
        });
    } catch (err) {
        console.error('Home page error:', err);
        res.render('index', { 
            user: req.session.user || null,
            stats: { totalSubmissions: 0, totalUsers: 0, totalDepartments: 5 },
            featuredIdeas: []
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Ethiopian Airlines Innovation Hub running at http://localhost:${PORT}`);
});