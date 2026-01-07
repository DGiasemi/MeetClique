const { Event } = require('../../schemas/eventSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function getLiveEvents(userId = null, userOnly = false) {
    try {
        const currentTime = new Date();

        // Base query: events where current time is between start and end time
        let query = {
            startTime: { $lte: currentTime },
            endTime: { $gte: currentTime }
        };

        // If userOnly is true and userId is provided, filter by events where user is an attendee
        if (userOnly && userId) {
            query.attendees = { $in: [userId] };
        }

        const events = await Event.find(query).populate('location').exec();

        // Return empty array if no events found (200 OK with empty array is more RESTful)
        return {
            code: StatusCodes.OK,
            result: events || [],
        };
    } catch (error) {
        console.error('Error fetching live events: ', error.message);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error fetching live events' };
    }
}

module.exports = getLiveEvents;
