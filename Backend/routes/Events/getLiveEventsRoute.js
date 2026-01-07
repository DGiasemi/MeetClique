const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const getLiveEvents = require('../../db/Events/getLiveEventsDb');

router.get('/', async (req, res) => {
    try {
        const { userOnly, city } = req.query;
        const userId = req.userId; // From auth middleware (optional)

        // Convert userOnly to boolean
        const isUserOnly = userOnly === 'true';

        // Call the database function with userId and userOnly flag
        const result = await getLiveEvents(userId, isUserOnly, city);

        if (result.code !== StatusCodes.OK) {
            return res.status(result.code).json({ message: result.result });
        }

        // Process the result to format the response
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
            price: event.price || 0,
            attendees: event.attendees,
            city: event.city || null,
            type: event.type || 'event',
        }));

        return res.status(StatusCodes.OK).json({
            message: 'Success',
            events: processedResult
        });
    } catch (error) {
        console.error('Error fetching live events:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
});

module.exports = router;
