const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const deleteEvent = require('../../db/Events/deleteEventDb');
const getEvent = require('../../db/Events/getEventDb');

router.delete('/', async (req, res) => {
    try {
        const userId = req.userId;
        const { eventId } = req.query;

        if (!eventId) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid request' });
        }

        const targetEvent = await getEvent(eventId);

        if (targetEvent.code !== StatusCodes.OK) {
            return res.status(targetEvent.code).json({ message: targetEvent.result });
        }

        if (userId !== targetEvent.result.userID.toString()) {
            return res.status(StatusCodes.FORBIDDEN).json({ message: 'You are not authorized to delete this event' });
        }

        const deleteResult = await deleteEvent(eventId);

        if (deleteResult.code !== StatusCodes.OK) {
            return res.status(deleteResult.code).json({ message: deleteResult.result });
        }

        return res.status(StatusCodes.OK).json({ message: 'Success', events: deleteResult.result });
    } catch (error) {
        console.error('Error deleting event: ', error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error deleting event' });
    }
});

module.exports = router;