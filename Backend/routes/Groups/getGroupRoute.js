const express = require('express');
const router = express.Router();
const getGroup = require('../../db/Groups/getGroupDb');

router.get('/', async (req, res) => {
    try {
        const id = req.query.id;
        const result = await getGroup(id);
        return res.status(result.code).json({ group: result.result });
    } catch (err) {
        console.error('getGroupRoute error', err);
        return res.status(500).json({ message: 'Internal error' });
    }
});

module.exports = router;
