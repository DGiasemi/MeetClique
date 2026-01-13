const express = require('express');
const router = express.Router();
const joinGroup = require('../../db/Groups/joinGroupDb');

router.post('/', async (req, res) => {
    try {
        const { id } = req.body;
        const result = await joinGroup(id, req.userId);
        return res.status(result.code).json({ group: result.result });
    } catch (err) {
        console.error('joinGroupRoute error', err);
        return res.status(500).json({ message: 'Internal error' });
    }
});

module.exports = router;
