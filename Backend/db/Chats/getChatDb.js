const { getMessageGroup, getMessages } = require('../../cache/messagesCache');
const chatSchema = require('../../schemas/chatSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function getChat(userId, chatId) {
    try {
        const chat = await chatSchema.findById(chatId)
            .populate('members', 'name username email profilePic')
            .populate({
                path: 'messages',
                select: 'messages length previousMessageGroupId',
                populate: {
                    path: 'messages',
                    select: 'content senderId timestamp'
                }
            });
        if (!chat) {
            return {
                code: StatusCodes.NOT_FOUND,
                result: 'Chat not found'
            };
        }
        const memberIds = chat.members.map(member => member._id.toString());
        if (!memberIds.includes(userId)) {
            return {
                code: StatusCodes.FORBIDDEN,
                result: 'You are not a member of this chat'
            };
        }
        return {
            code: StatusCodes.OK,
            result: chat
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

async function getChatByMembers(userId, members) {
    try {
        const chat = await chatSchema.findOne({ members: { $all: members } })
            .populate('members', 'name username email profilePic')
            .populate('messages', 'messages length previousMessageGroupId')
        if (!chat) {
            return {
                code: StatusCodes.NOT_FOUND,
                result: 'Chat not found'
            };
        }
        if (!chat.members.some(member => member._id.equals(userId))) {
            return {
                code: StatusCodes.FORBIDDEN,
                result: 'You are not a member of this chat'
            };
        }
        const messageGroup = getMessageGroup(chat._id);
        if (messageGroup) {
            chat.messages = messageGroup;
        }
        return {
            code: StatusCodes.OK,
            result: chat
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
    getChat, getChatByMembers
};