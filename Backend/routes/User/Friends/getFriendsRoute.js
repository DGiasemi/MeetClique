const express = require('express');
const router = express.Router();
const HttpStatusCode = require('http-status-codes');
const { getUser } = require('../../../db/User/getUserDb');

const filterFriends = (friends) => {
    return friends.map(friend => ({
        id: friend._id,
        name: friend.name,
        username: friend.username,
        lastLocation: friend.lastLocation || null,
        lastLocationDate: friend.lastLocationDate || null,
        distance: Math.round(friend.distanceMeters) / 1000.0 || null,
    }));
};

router.get('/', async (req, res) => {
    const userID = req.userId;
    const { longitude, latitude, distance } = req.query;

    if (!userID) {
        return res.status(400).json({ message: 'Invalid request' });
    }

    const result = await getUser(userID);
    if (result.code !== HttpStatusCode.StatusCodes.OK) {
        return res.status(result.code).json({
            message: result.result,
        });
    }

    const user = result.result;

    if (longitude && latitude && distance) {
        let friends = await user.getFriendsByLocation(parseFloat(longitude), parseFloat(latitude), parseFloat(distance));
        friends = await filterFriends(friends);
        return res.status(HttpStatusCode.StatusCodes.OK).json({ friends });
    }

    let friends = await user.getFriends();
    friends = await filterFriends(friends);
    return res.status(HttpStatusCode.StatusCodes.OK).json({ friends });
});

module.exports = router;