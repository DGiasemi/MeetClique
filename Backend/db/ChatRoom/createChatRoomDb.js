const ChatRoom = require('../../schemas/chatRoom/chatRoomSchema');
const { getChatRoomsByDistance } = require('./getChatRoomDb');
const { StatusCodes } = require('http-status-codes');

/*
 * Function to create a chat room. If a chat room already exists within a radius of .2km, it will return a conflict error
 * @param {string} name - The name of the chat room
 * @param {object} coordinates - The coordinates of the chat room
 * @param {string} description - The description of the chat room
 * @param {string} type - The type of the chat room
 * 
 * @returns {Promise<{code: number, result: string|object}>}
 */
async function createChatRoom(name, coordinates, description, type, userID) {
    try {
        if (getChatRoomsByDistance(coordinates.coordinates[0], coordinates.coordinates[1], .2).code == 200) {
            return { code: StatusCodes.CONFLICT, result: 'Chat room already exists' };
        }
        if (description.length > 200 || name.length > 30) {
            return { code: StatusCodes.BAD_REQUEST, result: 'Name or description too long' };
        }
        name = name.replace(/\n/g, ' '); // remove new lines
        name = name.replace(/\d/g, ''); // remove numbers
        description = description.replace(/\n/g, ' ');
        const chatRoom = new ChatRoom({
            name,
            coordinates,
            description,
            type,
            mostRecentUsers: [userID],
        });
        await chatRoom.save();
        return { code: StatusCodes.OK, result: chatRoom };
    } catch (error) {
        console.error('Error creating chat room: ', error.message);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error creating chat room' };
    }
}

module.exports = {
    createChatRoom
};
