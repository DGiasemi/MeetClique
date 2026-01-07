const chatSchema = require('../../schemas/chatSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function getUserChats(userId, offset = 0, limit = 20) {
    try {
        const chats = await chatSchema.find({ members: userId })
            .skip(offset)
            .limit(limit)
            .populate('members', 'name username version')
            .populate('messages', 'messages length previousMessageGroupId')
            .sort({ lastMessageTime: -1 });

        if (!chats || chats.length === 0) {
            return {
                code: StatusCodes.NOT_FOUND,
                result: 'No chats found for this user'
            };
        }

        return {
            code: StatusCodes.OK,
            result: chats
        };
    }
    catch (error) {
        console.error('Error fetching user chats:', error);
        return {
            code: StatusCodes.INTERNAL_SERVER_ERROR,
            result: 'Failed to fetch user chats'
        };
    }
}

module.exports = {
    getUserChats
};