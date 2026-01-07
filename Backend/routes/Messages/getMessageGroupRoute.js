const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const { getMessageGroupFromDatabase } = require('../../db/Messages/getMessageGroupDb');

router.get('/', async (req, res) => {
    const { chatID, groupID } = req.query;

    const userId = req.userId;
    if (!chatID || !groupID) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid request' });
    }

    const result = await getMessageGroupFromDatabase(userId, chatID, groupID);
    if (result.code !== StatusCodes.OK) {
        return res.status(result.code).json({ message: result.result });
    }
    if (!result.result) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Message group not found' });
    }
    return res.status(StatusCodes.OK).json({ message: 'Message group retrieved successfully', result: result.result });

});

module.exports = router;