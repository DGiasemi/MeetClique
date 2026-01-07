const express = require('express');
const router = express.Router();
const HttpStatusCode = require('http-status-codes');
const { getUser, getUsersByUsername } = require('../../db/User/getUserDb');

router.get('/', async (req, res) => {
    const userID = req.userId;
    const searchQuery = req.query.search;
    
    if (!userID || !searchQuery) {
        return res.status(400).json({ message: 'Invalid request' });
    }

    const result = await getUsersByUsername(searchQuery);
    if (result.code !== HttpStatusCode.StatusCodes.OK) {
        return res.status(result.code).json({
            message: result.result,
        });
    }
    
    const users = result.result;

    if (users.length === 0) {
        return res.status(HttpStatusCode.StatusCodes.NOT_FOUND).json({
            message: 'No users found',
        });
    }

    let data = [];
    users.forEach(user => {
        data.push({
            id: user._id,
            name: user.name,
            username: user.username,
        });
    });

    res.status(HttpStatusCode.StatusCodes.OK).json(data);
});

module.exports = router;