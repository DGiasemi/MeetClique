const express = require('express');
const getEvent = require('../../db/Events/getEventDb');

const router = express.Router();
const { StatusCodes } = require('http-status-codes');

router.get('/', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id || id == undefined) {
            return res.status(400).json({ message: 'Invalid request' });
        }
        const event = await getEvent(id);
        if (event.code !== StatusCodes.OK) {
            return res.status(event.code).json({ message: event.result });
        }
        const filePath = event.result.mediaUrl;

        res.sendFile(filePath, (err) => {
            if (err) {
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Error sending file: ' + err.message });
                }
            }
        });
    } catch (error) {
        console.error('Error in retrieving an event image: ', error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error in retrieving an event image' });
    }
});

module.exports = router;