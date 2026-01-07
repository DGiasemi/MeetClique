const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const { getUserChats } = require('../../db/Chats/getChatsDb');

router.get('/', async (req, res) => {
    const userId = req.userId;
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 20;

    if (!userId) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid request' });
    }

    const result = await getUserChats(userId, offset, limit);

    if (result.code !== StatusCodes.OK) {
        return res.status(result.code).json({
            message: result.result,
        });
    }

    res.status(StatusCodes.OK).json(result.result);
}
);

module.exports = router;