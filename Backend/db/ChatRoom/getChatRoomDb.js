const ChatRoom = require('../../schemas/chatRoom/chatRoomSchema');
const { StatusCodes } = require('http-status-codes');

/*
 * Function to get chatrooms within a certain distance from a given point
 * @param {number} longitude - The longitude of the center point
 * @param {number} latitude - The latitude of the center point
 * @param {number} distance - The distance in km
 * @returns {Promise<{code: number, result: string|object}>}
 */
async function getChatRoomsByDistance(longitude, latitude, distance) {
    try {
        const chatRooms = await ChatRoom.find({
            coordinates: {
                $geoWithin: {
                    $centerSphere: [[longitude, latitude], distance / 6378.1]
                }
            }
        });
        if (!chatRooms || chatRooms.length === 0) {
            return { code: StatusCodes.NOT_FOUND, result: 'No chatRooms found' };
        }
        return {
            code: StatusCodes.OK,
            result: chatRooms.map(chatRoom => ({
                id: chatRoom._id,
                name: chatRoom.name,
                coordinates: chatRoom.coordinates,
                description: chatRoom.description,
                type: chatRoom.type,
                activeUserIDs: chatRoom.activeUserIDs,
                mostRecentUsers: chatRoom.mostRecentUsers,
                messageGroupID: chatRoom.messageGroupID,
                createdAt: chatRoom.createdAt,
            })),
        };
    } catch (error) {
        console.error('Error fetching chat rooms by distance: ', error.message);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error fetching chat rooms' };
    }
}

module.exports = {
    getChatRoomsByDistance
};