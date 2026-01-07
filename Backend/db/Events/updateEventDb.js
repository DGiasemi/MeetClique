const { StatusCodes } = require('http-status-codes');
const { Event } = require('../../schemas/eventSchema');
const { getLocationById } = require('../../db/Location/getLocationDb');

async function updateEvent(eventId, name, description, mediaUrl, locationId, userId, startTime, endTime, price) {
    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return {
                code: StatusCodes.NOT_FOUND,
                result: 'Event not found'
            };
        }

        // Verify ownership (though typically handled in route, good to double check or if called internally)
        const eventOwnerId = typeof event.userID === 'object' ? event.userID._id.toString() : event.userID.toString();
        if (eventOwnerId !== userId) {
            return {
                code: StatusCodes.FORBIDDEN,
                result: 'You are not the owner of this event'
            };
        }

        // Validate location if provided
        if (locationId) {
            const location = await getLocationById(locationId);
            if (location.code !== StatusCodes.OK) {
                return location;
            }
        }

        const updates = {};
        if (name) updates.name = name;
        if (description) updates.description = description;
        if (mediaUrl) updates.mediaUrl = mediaUrl;
        if (locationId) updates.location = locationId;
        if (startTime) updates.startTime = startTime;
        if (endTime) updates.endTime = endTime;
        if (price !== undefined) updates.price = parseFloat(price);

        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { $set: updates },
            { new: true }
        );

        return {
            code: StatusCodes.OK,
            result: updatedEvent
        };
    } catch (error) {
        console.error('Error updating event:', error);
        return {
            code: StatusCodes.INTERNAL_SERVER_ERROR,
            result: 'Internal server error'
        };
    }
}

module.exports = updateEvent;
