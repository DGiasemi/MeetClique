const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const updateEvent = require('../../db/Events/updateEventDb');
const { StatusCodes } = require('http-status-codes');
const { Event } = require('../../schemas/eventSchema');

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, _, cb) {
        const userFolder = path.join(process.env.DATA_FOLDER, req.userId, 'events');
        if (!fs.existsSync(userFolder)) {
            fs.mkdirSync(userFolder, { recursive: true });
        }
        cb(null, userFolder);
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const fileExtension = path.extname(file.originalname);
        cb(null, `event_${timestamp}${fileExtension}`);
    }
});

const upload = multer({ storage: storage });

router.put('/', upload.single('event'), async (req, res) => {
    try {
        const { eventId, name, description, location, startTime, endTime, price } = req.body;
        const file = req.file;
        const userId = req.userId;

        if (!eventId) {
            if (file) fs.unlinkSync(file.path);
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Event ID is required' });
        }

        // Check ownership before proceeding
        const event = await Event.findById(eventId);
        if (!event) {
            if (file) fs.unlinkSync(file.path);
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Event not found' });
        }

        const eventOwnerId = typeof event.userID === 'object' ? event.userID._id.toString() : event.userID.toString();
        if (eventOwnerId !== userId) {
            if (file) fs.unlinkSync(file.path);
            return res.status(StatusCodes.FORBIDDEN).json({ message: 'You are not the owner of this event' });
        }

        let mediaUrl = undefined;
        if (file) {
            const fileType = file.mimetype.split('/')[0];
            if (fileType !== 'image') {
                fs.unlinkSync(file.path);
                return res.status(StatusCodes.BAD_REQUEST).json({ message: 'File is not an image' });
            }
            mediaUrl = file.path;
        }

        const result = await updateEvent(
            eventId,
            name,
            description,
            mediaUrl,
            location,
            userId,
            startTime,
            endTime,
            price
        );

        if (result.code !== StatusCodes.OK) {
            if (file) fs.unlinkSync(file.path);
            return res.status(result.code).json({ message: result.result });
        }

        return res.status(StatusCodes.OK).json({ message: 'Event updated successfully', event: result.result });

    } catch (error) {
        console.error('Error updating event:', error);
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
});

module.exports = router;
