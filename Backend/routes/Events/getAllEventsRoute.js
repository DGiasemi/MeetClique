const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const getAllEvents = require('../../db/Events/getAllEventsDb');

router.get('/', async (req, res) => {
    try {
        const { excludeLive, city } = req.query;

        const excludeLiveFlag = excludeLive === 'true';

        const result = await getAllEvents(excludeLiveFlag, city);

        if (result.code !== StatusCodes.OK) {
            return res.status(result.code).json({ message: result.result });
        }

        const processedResult = result.result.map(event => ({
            id: event._id,
            name: event.name,
            description: event.description,
            location: event.location,
            mediaUrl: event.mediaUrl,
            userID: event.userID,
            createdAt: event.createdAt,
            startTime: event.startTime,
            endTime: event.endTime,
            reactionsCount: event.reactionsCount,
            attendeesCount: event.attendeesCount,
            price: event.price || 0,
            attendees: event.attendees,
            city: event.city || null,
            type: event.type || 'event',
        }));

        return res.status(StatusCodes.OK).json({ message: 'Success', events: processedResult });
    } catch (error) {
        console.error('Error fetching all events:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
});

module.exports = router;
