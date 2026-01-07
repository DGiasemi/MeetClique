const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const getEventAttendees = require('../../db/Events/getEventAttendeesDb');
const { Event } = require('../../schemas/eventSchema');

router.get('/', async (req, res) => {
    try {
        const { eventId } = req.query;
        const userId = req.userId;

        if (!eventId) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Event ID is required' });
        }

        // Verify that the requesting user is the event owner
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Event not found' });
        }

        const eventOwnerId = typeof event.userID === 'object' ? event.userID._id.toString() : event.userID.toString();
        if (eventOwnerId !== userId) {
            return res.status(StatusCodes.FORBIDDEN).json({ message: 'Only event owners can view attendees' });
        }

        const result = await getEventAttendees(eventId);

        if (result.code !== StatusCodes.OK) {
            return res.status(result.code).json({ message: result.result });
        }

        const processedAttendees = result.result.map(attendee => ({
            id: attendee._id || attendee.id,
            name: attendee.name,
            username: attendee.username
        }));

        return res.status(StatusCodes.OK).json({
            message: 'Success',
            attendees: processedAttendees
        });
    } catch (error) {
        console.error('Error in getEventAttendeesRoute:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
});

module.exports = router;
