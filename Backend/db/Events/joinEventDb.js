const { Event } = require('../../schemas/eventSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function joinEvent(userId, eventId) {
    try {
        // Find the event
        const event = await Event.findById(eventId);

        if (!event) {
            return { code: StatusCodes.NOT_FOUND, result: 'Event not found' };
        }

        // Check if user is already an attendee
        if (event.attendees.includes(userId)) {
            return { code: StatusCodes.BAD_REQUEST, result: 'User is already an attendee' };
        }

        // Add user to attendees array and increment count
        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            {
                $addToSet: { attendees: userId },
                $inc: { attendeesCount: 1 }
            },
            { new: true }
        ).populate('location').exec();

        return {
            code: StatusCodes.OK,
            result: updatedEvent,
        };
    } catch (error) {
        console.error('Error joining event: ', error.message);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error joining event' };
    }
}

module.exports = joinEvent;
