const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const { sendMessage } = require('../../db/Messages/sendMessageDb');
const { emitToUser, socketEvents } = require('../../utils/socketUtils');
const { getUser } = require('../../db/User/getUserDb');
const { sendPushNotification } = require('../../services/notificationsService');

router.post('/', async (req, res) => {
    const { chatID, content } = req.body;

    const userId = req.userId;
    if (!chatID || !content) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid request' });
    }

    const timestamp = new Date().toISOString();
    const result = await sendMessage(userId, chatID, content, timestamp);
    if (result.code !== StatusCodes.OK) {
        return res.status(result.code).json({ message: result.result, unauthorized: result.code === StatusCodes.UNAUTHORIZED });
    }
    res.status(StatusCodes.OK).json({ message: 'Message sent successfully', result: result.result });

    const memberIds = result.result.memberIds;
    const event = socketEvents.newMessage;
    let user = await getUser(userId);
    user = user.result;

    const data = {
        chat: result.result.chatName || user.username,
        message: {
            content: content,
            senderUsername: user.username,
            timestamp: timestamp,
        }
    }
    memberIds.forEach(memberId => {
        if (memberId !== userId) {
            emitToUser(memberId, event, data);
            sendPushNotification(memberId, user.username, content);
        }
    });
});

module.exports = router;