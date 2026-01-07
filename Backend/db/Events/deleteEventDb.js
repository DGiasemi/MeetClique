const { Event } = require('../../schemas/eventSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function deleteEvent(eventId) {
    try {
        const event = await Event.findByIdAndDelete(eventId);
        if (!event) {
            return { code: StatusCodes.NOT_FOUND, result: 'No event found' };
        }
        return {
            code: StatusCodes.OK,
            result: 'Event deleted successfully',
        };
    } catch (error) {
        console.error('Error deleting event: ', error.message);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error deleting event' };
    }
}

module.exports = deleteEvent;