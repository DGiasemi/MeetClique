const messageGroupSchema = require('../../schemas/messageGroupSchema');
const chatSchema = require('../../schemas/chatSchema');
const HttpStatusCode = require('http-status-codes');
const { getMessageGroup, pushMessage } = require('../../cache/messagesCache');
const { encryptMessage, getHmacIndex } = require('../../utils/messageEncryption');
const { getPrivateKey, decryptContent } = require('../../cache/authPrivateKeyStorage');
const { StatusCodes } = HttpStatusCode;

const MESSAGES_PER_GROUP_LIMIT = 10; // Limit of messages per group

async function sendMessage(userID, chatID, content, timestamp) {
    try {
        if (!chatID || !content || content.trim() === '') {
            return { code: StatusCodes.BAD_REQUEST, result: 'Invalid request' };
        }

        if (!timestamp)
            timestamp = new Date().toISOString(); // default to current time if not provided

        let messageGroup = getMessageGroup(chatID); // retrieve from cache
        const chat = await chatSchema.findById(chatID)
            .populate('messages', 'messages length previousMessageGroupId');
        if (!chat) {
            return { code: StatusCodes.NOT_FOUND, result: 'Chat not found' };
        }
        const memberIds = chat.members.map(member => member._id.toString());  // to ensure the user is a member of the chat
        if (!memberIds.includes(userID)) {
            return { code: StatusCodes.FORBIDDEN, result: 'You are not a member of this chat' };
        }
        if (!messageGroup) { // if not found in cache, fetch from database (chat has been retrieved from database)
            messageGroup = chat.messages;
        }

        if (!messageGroup || messageGroup.length >= MESSAGES_PER_GROUP_LIMIT) { // if no message group or it has reached the limit create a new one
            messageGroup = new messageGroupSchema({
                chatId: chatID,
                messages: [],
                length: 0,
                previousMessageGroupId: messageGroup ? messageGroup._id : null
            });
            messageGroup = await messageGroupSchema.create(messageGroup);
            chat.messages = messageGroup._id;
            await chat.save();
        }

        const userPrivateKey = getPrivateKey((String)(userID));
        if (!userPrivateKey) {
            return { code: StatusCodes.UNAUTHORIZED, result: 'Authorisation Error' };
        }

        const aesKeys = chat.aesKeys;
        const userAESEncryptedHEXKey = JSON.parse(aesKeys.find(data => JSON.parse(data).memberId === userID)).key;
        const userAESEncryptedKey = Buffer.from(userAESEncryptedHEXKey, "base64");

        const userKey = decryptContent(userAESEncryptedKey, userPrivateKey);

        const userKeyBuffer = Buffer.from(userKey, 'base64');

        const { iv, ciphertext, tag } = encryptMessage(content, userKeyBuffer);
        const encryptedContent = Buffer.concat([iv, ciphertext, tag]);

        const hmacKey = Buffer.from(process.env.HMAC_KEY_BASE64, 'base64');
        if (!hmacKey) {
            console.error('HMAC key is not set in environment variables');
            return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Internal server error' };
        }
        const searchIndex = getHmacIndex(content, hmacKey);

        const newMessage = {
            chatId: chatID,
            senderId: userID,
            content: encryptedContent,
            search_index: searchIndex,
            timestamp: timestamp,
            group: messageGroup._id
        };

        await pushMessage(chatID, newMessage, messageGroup);

        newMessage.memberIds = memberIds;
        newMessage.chatName = chat.name;

        return { code: StatusCodes.OK, result: newMessage };
    } catch (error) {
        console.error('Error sending message:', error);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Internal server error' };
    }
}

module.exports = { sendMessage };