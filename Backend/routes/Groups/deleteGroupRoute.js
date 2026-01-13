const express = require('express');
const router = express.Router();
const deleteGroup = require('../../db/Groups/deleteGroupDb');

router.post('/', async (req, res) => {
    try {
        const { id } = req.body;
        const result = await deleteGroup(id, req.userId);
        return res.status(result.code).json({ message: result.result });
    } catch (err) {
        console.error('deleteGroupRoute error', err);
        return res.status(500).json({ message: 'Internal error' });
    }
});

module.exports = router;
