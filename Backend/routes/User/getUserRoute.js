const express = require('express');
const router = express.Router();
const HttpStatusCode = require('http-status-codes');
const { getUser } = require('../../db/User/getUserDb');

router.get('/', async (req, res) => {
    const userID = req.userId;
    const { id } = req.query;

    if (!userID && !id) {
        return res.status(400).json({ message: 'Invalid request' });
    }

    const result = await getUser(id || userID);
    if (result.code !== HttpStatusCode.StatusCodes.OK) {
        return res.status(result.code).json({
            message: result.result,
        });
    }

    const user = result.result;
    const data = {
        id: user._id,
        name: user.name,
        username: user.username,
        eventsCount: user.eventsCount || 0,
        postsCount: user.postsCount || 0,
        privacyStatus: user.privacyStatus || 'public',
        socialPoints: user.socialPoints || 0,
        bio: user.bio,
        version: user.version || 0,
    }

    if (userID === id || id === undefined) {
        data.email = user.email;
        data.chats = user.chats || [];
        data.publicVisibility = user.publicVisibility || 'everyone';
    } else {
        data.blocked = user.blockedUsers ? user.blockedUsers.includes(userID) : false;
    }

    res.status(HttpStatusCode.StatusCodes.OK).json(data);
});

module.exports = router;