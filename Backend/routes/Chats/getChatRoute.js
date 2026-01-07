const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const { getChat, getChatByMembers } = require('../../db/Chats/getChatDb');
const { createChat } = require('../../db/Chats/createChatDb');
const { getMessages } = require('../../cache/messagesCache');
const { decryptMessage } = require('../../utils/messageEncryption');
const { decryptContent, getPrivateKey } = require('../../cache/authPrivateKeyStorage');

router.get('/', async (req, res) => {
    try {
        const userId = req.userId;
        const chatId = req.query.chatId;
        const memberId = req.query.memberId;

        if (!userId || (!chatId && !memberId)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid request' });
        }

        if (chatId) {
            const result = await getChat(userId, chatId);
            if (result.code !== StatusCodes.OK) {
                return res.status(result.code).json({
                    message: result.result,
                });
            }
            const dbResult = JSON.parse(JSON.stringify(result.result));

            const userPrivateKey = getPrivateKey(userId);

            if (!userPrivateKey) {
                return res.status(StatusCodes.UNAUTHORIZED).json({
                    message: 'User private key not found',
                });
            }

            const aesKeys = result.result.aesKeys;
            const userAESEncryptedHEXKey = JSON.parse(aesKeys.find(data => JSON.parse(data).memberId === userId)).key;
            const userAESEncryptedKey = Buffer.from(userAESEncryptedHEXKey, "base64");

            const userKey = decryptContent(userAESEncryptedKey, userPrivateKey);

            const userKeyBuffer = Buffer.from(userKey, 'base64');

            if (!dbResult.messages) {
                dbResult.messages = {
                    messages: []
                };
            }
            dbResult.messages.messages.forEach(message => {
                const encryptedBuffer = Buffer.from(message.content.data, "base64");
                message.content = decryptMessage(encryptedBuffer, userKeyBuffer);
            });

            dbResult.messages.messages = dbResult.messages.messages.map(msg => ({
                content: msg.content,
                senderId: msg.senderId,
                timestamp: msg.timestamp,
            }));

            let messages = getMessages(chatId);

            if (messages && messages.length > 0) {
                messages = messages.map(msg => ({
                    content: msg.content,
                    senderId: msg.senderId,
                    timestamp: msg.timestamp,
                }));

                messages.forEach(message => {
                    const encryptedBuffer = Buffer.from(message.content.data, "base64");
                    message.content = decryptMessage(encryptedBuffer, userKeyBuffer);
                });
                dbResult.messages.messages.push(...messages);
            }

            return res.status(StatusCodes.OK).json(dbResult);
        }

        if (memberId) {
            const result = await getChatByMembers(userId, [userId, memberId]);
            if (result.code === StatusCodes.NOT_FOUND) {
                const result = await createChat(null, [userId, memberId], 'private');
                return res.status(StatusCodes.OK).json({ result: result.result });
            }
            if (result.code !== StatusCodes.OK) {
                return res.status(result.code).json({
                    message: result.result,
                });
            }
            if (result.result.length === 0) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    message: 'No chat found with the specified members',
                });
            }
            return res.status(StatusCodes.OK).json(result.result);
        }

        res.status(StatusCodes.OK).json(result.result);
    } catch (error) {
        console.error('Error in getChatRoute:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Internal server error',
        });
    }
});

module.exports = router;