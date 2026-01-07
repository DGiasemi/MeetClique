const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const { getUser } = require('../../db/User/getUserDb');
const getAttendedEvents = require('../../db/Events/getAttendedEventsDb');

router.get('/', async (req, res) => {
    try {
        const { user } = req.query;

        const userId = req.userId;
        if (!user) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid request' });
        }

        const targetUser = await getUser(user);

        if (targetUser.code !== StatusCodes.OK) {
            return res.status(targetUser.code).json({ message: targetUser.result });
        }

        if (userId && targetUser.result.blockedUsers && targetUser.result.blockedUsers.includes(userId)) {
            return res.status(StatusCodes.FORBIDDEN).json({ message: 'You are blocked by this user' });
        }

        const result = await getAttendedEvents(user);
        const processedResult = result.result.map(event => ({
            id: event._id,
            name: event.name,
            description: event.description,
            location: event.location,
            userID: event.userID,
            createdAt: event.createdAt,
            startTime: event.startTime,
            endTime: event.endTime,
            reactionsCount: event.reactionsCount,
            attendeesCount: event.attendeesCount,
            attendees: event.attendees,
            price: event.price || 0,
        }));

        result.result = processedResult;
        if (result.code !== StatusCodes.OK) {
            return res.status(result.code).json({ message: result.result });
        }

        return res.status(StatusCodes.OK).json({ message: 'Success', events: result.result });
    } catch (error) {
        console.error('Error fetching attended events:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
});

module.exports = router;
