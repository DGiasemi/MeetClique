const { StatusCodes } = require('http-status-codes');
const { Event } = require('../../schemas/eventSchema');
const { getLocationById } = require('../../db/Location/getLocationDb');

async function updateEvent(eventId, name, description, mediaUrl, locationId, city, userId, startTime, endTime, price, type) {
    try {
        console.log('updateEventDb called with', { eventId, name, description, mediaUrl, locationId, city, userId, startTime, endTime, price, type });
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

        // Normalize locationId string values like 'null'/'undefined' to actual null
        if (locationId === 'null' || locationId === 'undefined') locationId = null;

        // Validate location if provided
        if (locationId) {
            const location = await getLocationById(locationId);
            if (location.code !== StatusCodes.OK) {
                return location;
            }
        }

        // Accept any city string provided by the client (Nominatim/autocomplete).
        if (city) {
            try {
                city = city.toString().trim();
            } catch (e) {
                console.error('updateEventDb: failed to normalize city', e);
            }
        }

        const updates = {};
        if (name) updates.name = name;
        if (description) updates.description = description;
        if (mediaUrl) updates.mediaUrl = mediaUrl;
        if (locationId) updates.location = locationId;
        if (city) updates.city = city;
        if (startTime) updates.startTime = startTime;
        // Only apply endTime and price for regular events
        if (type === 'event') {
            if (endTime) updates.endTime = endTime;
            if (price !== undefined) updates.price = parseFloat(price);
        } else if (type === 'hangout') {
            // ensure hangouts don't have price or endTime
            updates.price = 0;
            updates.endTime = undefined;
        }
        if (type) updates.type = type;

        console.log('updateEventDb: applying updates', updates);
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
