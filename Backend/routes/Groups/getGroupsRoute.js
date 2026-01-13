const express = require('express');
const router = express.Router();
const getGroups = require('../../db/Groups/getGroupsDb');

router.get('/', async (req, res) => {
    try {
        const city = req.query.city;
        const result = await getGroups(city);
        return res.status(result.code).json({ groups: result.result });
    } catch (err) {
        console.error('getGroupsRoute error', err);
        return res.status(500).json({ message: 'Internal error' });
    }
});

module.exports = router;
