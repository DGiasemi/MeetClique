const { Event } = require('../../schemas/eventSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function getAllEvents(excludeLive = false, city = null) {
    try {
        const currentTime = new Date();

        let query = {};

        // If excludeLive is true, exclude events that are currently live
        if (excludeLive) {
            query = {
                $or: [
                    { startTime: { $gt: currentTime } }, // Events that haven't started yet
                    { endTime: { $lt: currentTime } }    // Events that have already ended
                ]
            };
        }

        // If city provided, include city in the query
        if (city) {
            query = { ...query, city };
        }

        const events = await Event.find(query)
            .populate('location')
            .populate('userID', 'username profilePicture')
            .sort({ startTime: -1 }) // Sort by start time, newest first
            .exec();

        // Return empty array if no events found (200 OK with empty array is more RESTful)
        return {
            code: StatusCodes.OK,
            result: events || [],
        };
    } catch (error) {
        console.error('Error fetching all events: ', error.message);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error fetching all events' };
    }
}

module.exports = getAllEvents;
