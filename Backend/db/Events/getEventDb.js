const { Event } = require('../../schemas/eventSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function getEvent(eventId) {
    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return { code: StatusCodes.NOT_FOUND, result: 'No event found' };
        }
        return {
            code: StatusCodes.OK,
            result: event,
        };
    } catch (error) {
        console.error('Error fetching event: ', error.message);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error fetching event' };
    }
}

module.exports = getEvent;