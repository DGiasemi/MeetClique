const express = require('express');
const router = express.Router();
const createUserReport = require('../../../db/User/reportUserDb');

// body: { targetId: string, reason?: string, details?: string }
router.post('/', async (req, res) => {
    const userId = req.userId;
    const { targetId, reason, details } = req.body;

    if (!userId || !targetId) {
        return res.status(400).json({ message: 'Invalid request' });
    }

    try {
        const result = await createUserReport(targetId, userId, reason || 'unspecified', details || '');
        return res.status(result.code).json({ message: result.result });
    } catch (error) {
        console.error('Error in reportUser route: ', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
