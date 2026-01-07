const { Event } = require('../../schemas/eventSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function getEvents(userId) {
    try {
        const events = await Event.find({ userID: userId }).populate('location').exec();
        if (!events) {
            return { code: StatusCodes.NOT_FOUND, result: 'No events found' };
        }
        return {
            code: StatusCodes.OK,
            result: events,
        };
    } catch (error) {
        console.error('Error fetching events: ', error.message);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error fetching events' };
    }
}

module.exports = getEvents;