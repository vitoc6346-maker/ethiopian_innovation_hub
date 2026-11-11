const express = require('express');
const router = express.Router();
const db = require('../db');

function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/auth/login');
}

// View Inbox & Conversations List
router.get('/', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    try {
        // Fetch all users except current user to start new chats
        const [users] = await db.query('SELECT id, full_name, email, role FROM users WHERE id != ?', [userId]);

        // Fetch recent message partners
        const [conversations] = await db.query(`
            SELECT DISTINCT 
                CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS partner_id,
                u.full_name AS partner_name, u.email AS partner_email
            FROM messages m
            JOIN users u ON u.id = (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END)
            WHERE sender_id = ? OR receiver_id = ?
        `, [userId, userId, userId, userId]);

        res.render('messages-inbox', { users, conversations, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading messages inbox.');
    }
});

// View Conversation Thread with a Specific User
router.get('/chat/:partnerId', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    const partnerId = req.params.partnerId;

    try {
        const [partnerRows] = await db.query('SELECT id, full_name, email FROM users WHERE id = ?', [partnerId]);
        if (partnerRows.length === 0) return res.status(404).send('User not found.');

        // Fetch message history between current user and partner
        const [messages] = await db.query(`
            SELECT * FROM messages 
            WHERE (sender_id = ? AND receiver_id = ?) 
               OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at ASC
        `, [userId, partnerId, partnerId, userId]);

        // Mark incoming messages as read
        await db.query('UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ?', [partnerId, userId]);

        const [users] = await db.query('SELECT id, full_name FROM users WHERE id != ?', [userId]);

        res.render('chat-thread', { 
            partner: partnerRows[0], 
            messages, 
            users, 
            user: req.session.user 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading chat thread.');
    }
});

// Send Direct Message
router.post('/send/:partnerId', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    const partnerId = req.params.partnerId;
    const { messageText } = req.body;

    if (!messageText || messageText.trim() === '') {
        return res.redirect(`/messages/chat/${partnerId}`);
    }

    try {
        await db.query(
            'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES (?, ?, ?)',
            [userId, partnerId, messageText.trim()]
        );

        // Notify recipient
        await db.query(
            'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
            [partnerId, `New direct message from ${req.session.user.fullName}`]
        );

        res.redirect(`/messages/chat/${partnerId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error sending message.');
    }
});

module.exports = router;