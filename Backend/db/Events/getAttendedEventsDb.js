const { Event } = require('../../schemas/eventSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function getAttendedEvents(userId) {
    try {
        // Find events where user is in attendees array but not the owner
        const events = await Event.find({
            attendees: userId,
            userID: { $ne: userId }
        }).populate('location').exec();

        if (!events) {
            return { code: StatusCodes.NOT_FOUND, result: 'No events found' };
        }
        return {
            code: StatusCodes.OK,
            result: events,
        };
    } catch (error) {
        console.error('Error fetching attended events: ', error.message);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error fetching attended events' };
    }
}

module.exports = getAttendedEvents;
