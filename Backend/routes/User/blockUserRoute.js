const express = require('express');
const router = express.Router();
const HttpStatusCode = require('http-status-codes');
const setBlockUser = require('../../db/User/blockUserDb');

// body: { targetId: string, block: boolean }
router.post('/', async (req, res) => {
    const userId = req.userId;
    const { targetId, block } = req.body;

    if (!userId || !targetId) {
        return res.status(400).json({ message: 'Invalid request' });
    }

    try {
        const result = await setBlockUser(userId, targetId, block === false ? false : true);
        return res.status(result.code).json({ message: result.result });
    } catch (error) {
        console.error('Error in blockUser route: ', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
