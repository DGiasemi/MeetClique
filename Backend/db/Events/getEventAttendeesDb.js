const { StatusCodes } = require('http-status-codes');
const { Event } = require('../../schemas/eventSchema');

async function getEventAttendees(eventId) {
    try {
        const event = await Event.findById(eventId).populate({
            path: 'attendees',
            select: 'name username id _id'
        });

        if (!event) {
            return {
                code: StatusCodes.NOT_FOUND,
                result: 'Event not found'
            };
        }

        return {
            code: StatusCodes.OK,
            result: event.attendees
        };
    } catch (error) {
        console.error('Error fetching event attendees:', error);
        return {
            code: StatusCodes.INTERNAL_SERVER_ERROR,
            result: 'Internal server error'
        };
    }
}

module.exports = getEventAttendees;
