const { Event } = require('../../schemas/eventSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function leaveEvent(userId, eventId) {
    try {
        // Find the event
        const event = await Event.findById(eventId);

        if (!event) {
            return { code: StatusCodes.NOT_FOUND, result: 'Event not found' };
        }

        // Check if user is an attendee
        if (!event.attendees.includes(userId)) {
            return { code: StatusCodes.BAD_REQUEST, result: 'User is not an attendee' };
        }

        // Remove user from attendees array and decrement count
        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            {
                $pull: { attendees: userId },
                $inc: { attendeesCount: -1 }
            },
            { new: true }
        ).populate('location').exec();

        return {
            code: StatusCodes.OK,
            result: updatedEvent,
        };
    } catch (error) {
        console.error('Error leaving event: ', error.message);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error leaving event' };
    }
}

module.exports = leaveEvent;
