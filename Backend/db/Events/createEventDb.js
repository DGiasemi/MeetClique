const { Event } = require('../../schemas/eventSchema');
const HttpStatusCode = require('http-status-codes');
const { getUser } = require('../User/getUserDb');
const { StatusCodes } = HttpStatusCode;

async function createEvent(name, description, mediaUrl, location, city, userId, startTime, endTime, price = 0, type = 'event') {
    // Basic required fields
    if (!name || !description || !mediaUrl || !city || !userId || !startTime) {
        return { code: StatusCodes.BAD_REQUEST, result: 'Invalid request: Missing required fields' };
    }
    // Normalize location string values like 'null'/'undefined' to actual null
    if (location === 'null' || location === 'undefined') location = null;

    // For regular events, location is required. For hangouts, location is optional.
    if (type === 'event' && !location) {
        return { code: StatusCodes.BAD_REQUEST, result: 'Invalid request: Location is required for events' };
    }
    const user = await getUser(userId);
    if (user.code === StatusCodes.NOT_FOUND) {
        return { code: StatusCodes.NOT_FOUND, result: 'User not found' };
    }
    try {
        const createdAt = new Date();

        const eventData = {
            name,
            description,
            mediaUrl,
            location: location || null,
            city,
            userID: userId,
            createdAt,
            startTime: new Date(startTime),
            attendees: [userId], // Automatically add the creator as an attendee
            attendeesCount: 1, // Set initial count to 1
            type: type || 'event'
        };

        // For events set price, for hangouts keep price 0
        if (type === 'event') {
            eventData.price = parseFloat(price) || 0;
        } else {
            eventData.price = 0;
        }

        // Only add endTime for events
        if (type === 'event' && endTime) {
            eventData.endTime = new Date(endTime);
        }

        const newEvent = new Event(eventData);

        await newEvent.save();

        console.log(`Event created successfully with ID: ${newEvent._id}`);
        return { code: StatusCodes.OK, result: newEvent };
    } catch (error) {
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error creating event: ' + error.message };
    }
}

module.exports = createEvent;