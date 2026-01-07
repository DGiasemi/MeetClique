const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const createEvent = require('../../db/Events/createEventDb');

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
        if (file) {
            console.log('Received file:', file.originalname);
        }
        const timestamp = Date.now();
        const fileExtension = path.extname(file.originalname);
        cb(null, `event_${timestamp}${fileExtension}`);
    }
});

const upload = multer({ storage: storage });

/*
 * File is saved right before processing starts.
 * Authentication is handled by the middleware in the main app so there is no need to check it here.
*/
router.post('/', upload.single('event'), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileType = file.mimetype.split('/')[0];
        if (fileType !== 'image') {
            console.log('File is not an image');
            fs.unlinkSync(file.path);
            return res.status(400).json({ message: 'File is not an image' });
        }

        const fileSize = file.size;
        if (fileSize > 5 * 1024 * 1024) {
            console.log('File size exceeds 5MB');
            fs.unlinkSync(file.path);
            return res.status(400).json({ message: 'File size exceeds 5MB' });
        }

        console.log('name: ', req.body.name);
        console.log('description: ', req.body.description);
        console.log('location: ', req.body.location);
        console.log('startTime: ', req.body.startTime);
        console.log('endTime: ', req.body.endTime);
        console.log('userId: ', req.userId);
        console.log('price: ', req.body.price);

        const result = await createEvent(
            req.body.name,
            req.body.description,
            file.path,
            req.body.location,
            req.userId,
            req.body.startTime,
            req.body.endTime,
            req.body.price
        );

        if (result.code !== 200) {
            console.log(result.result);
            fs.unlinkSync(file.path);
            return res.status(result.code).json({ message: result.result });
        }

        return res.status(200).json({ message: 'File uploaded successfully' });
    } catch (error) {
        console.error('Error uploading file: ', error.message);
        return res.status(500).json({ message: 'Error uploading file' });
    }
});

module.exports = router;