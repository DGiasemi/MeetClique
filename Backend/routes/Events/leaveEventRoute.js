const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const leaveEvent = require('../../db/Events/leaveEventDb');

router.post('/', async (req, res) => {
    try {
        const userId = req.userId;
        const { eventId } = req.body;

        if (!eventId) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Event ID is required' });
        }

        const result = await leaveEvent(userId, eventId);

        if (result.code !== StatusCodes.OK) {
            return res.status(result.code).json({ message: result.result });
        }

        // Process the result to format the response
        const event = result.result;
        const processedEvent = {
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
            price: event.price || 0,
            attendees: event.attendees,
        };

        return res.status(StatusCodes.OK).json({
            message: 'Successfully left event',
            event: processedEvent
        });
    } catch (error) {
        console.error('Error leaving event:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
});

module.exports = router;
