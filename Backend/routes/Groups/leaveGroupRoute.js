const express = require('express');
const router = express.Router();
const leaveGroup = require('../../db/Groups/leaveGroupDb');

router.post('/', async (req, res) => {
    try {
        const { id } = req.body;
        const result = await leaveGroup(id, req.userId);
        return res.status(result.code).json({ group: result.result });
    } catch (err) {
        console.error('leaveGroupRoute error', err);
        return res.status(500).json({ message: 'Internal error' });
    }
});

module.exports = router;
