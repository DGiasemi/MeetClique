const messageGroupSchema = require('../../schemas/messageGroupSchema');
const chatSchema = require('../../schemas/chatSchema');
const HttpStatusCode = require('http-status-codes');
const { getUser } = require('../User/getUserDb');
const { getMessageGroup } = require('../../cache/messagesCache');
const { decryptMessage } = require('../../utils/messageEncryption');
const { decryptContent, getPrivateKey } = require('../../cache/authPrivateKeyStorage');
const { StatusCodes } = HttpStatusCode;

async function getMessageGroupFromDatabase(userID, chatID, groupID) {
    try {
        const user = await getUser(userID);
        if (user.code !== StatusCodes.OK) {
            return { code: user.code, result: user.result };
        }
        if (!chatID || !groupID) {
            return { code: StatusCodes.BAD_REQUEST, result: 'Invalid request' };
        }

        const chat = await chatSchema.findById(chatID)
            .populate('messages', 'messages length previousMessageGroupId');
        if (!chat) {
            return { code: StatusCodes.NOT_FOUND, result: 'Chat not found' };
        }
        const memberIds = chat.members.map(member => member._id.toString());
        if (!memberIds.includes(userID)) {
            return { code: StatusCodes.FORBIDDEN, result: 'You are not a member of this chat' };
        }

        let messageGroup = getMessageGroup(chatID); // retrieve from cache
        if (messageGroup && messageGroup._id.toString() === groupID) {
            return { code: StatusCodes.OK, result: messageGroup };
        }

        messageGroup = await messageGroupSchema.findById(groupID)
            .populate('messages', 'content senderId timestamp');
        if (!messageGroup || messageGroup.chatId.toString() !== chatID) {
            return { code: StatusCodes.NOT_FOUND, result: 'Message group not found' };
        }

        const userPrivateKey = getPrivateKey(userID);

        const aesKeys = chat.aesKeys;
        const userAESEncryptedHEXKey = JSON.parse(aesKeys.find(data => JSON.parse(data).memberId === userID)).key;
        const userAESEncryptedKey = Buffer.from(userAESEncryptedHEXKey, "base64");

        const userKey = decryptContent(userAESEncryptedKey, userPrivateKey);

        const userKeyBuffer = Buffer.from(userKey, 'base64');
        messageGroup = JSON.parse(JSON.stringify(messageGroup)); // Ensure messageGroup is a plain object
        if (messageGroup.messages) {
            messageGroup.messages.forEach(message => {
                const encryptedBuffer = Buffer.from(message.content.data, "base64");
                message.content = decryptMessage(encryptedBuffer, userKeyBuffer);
                message._id = undefined; // Remove _id field
            });
        }

        return { code: StatusCodes.OK, result: messageGroup };
    } catch (error) {
        console.error('Error fetching message group:', error);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Internal server error' };
    }
}

module.exports = { getMessageGroupFromDatabase };