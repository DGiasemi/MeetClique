const express = require('express');
const router = express.Router();
const { addUserPushToken } = require('../../../cache/userPushTokenStorage');

router.put('/', async (req, res) => {
    const { token } = req.body;
    const userId = req.userId;

    if (!token) {
        return res.status(400).json({ message: 'Missing token' });
    }

    try {
        addUserPushToken(userId, token);
        console.log(`Token added for user ${userId}: ${token}`);
        res.status(200).json({ message: 'Token added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;