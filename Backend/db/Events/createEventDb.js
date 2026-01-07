const { Event } = require('../../schemas/eventSchema');
const HttpStatusCode = require('http-status-codes');
const { getUser } = require('../User/getUserDb');
const { StatusCodes } = HttpStatusCode;

async function createEvent(name, description, mediaUrl, location, userId, startTime, endTime, price = 0) {
    if (!name || !description || !mediaUrl || !location || !userId || !startTime) {
        return { code: StatusCodes.BAD_REQUEST, result: 'Invalid request: Missing required fields' };
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
            location,
            userID: userId,
            createdAt,
            startTime: new Date(startTime),
            attendees: [userId], // Automatically add the creator as an attendee
            attendeesCount: 1, // Set initial count to 1
            price: parseFloat(price) || 0
        };

        // Only add endTime if it's provided
        if (endTime) {
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