const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { increaseUserVersion } = require('../../db/User/increaseUserVersionDb');
const { compressImage } = require('../../utils/imageCompression');

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, _, cb) {
        const userFolder = path.join(process.env.DATA_FOLDER, req.userId);
        if (!fs.existsSync(userFolder)) {
            fs.mkdirSync(userFolder, { recursive: true });
        }
        cb(null, userFolder);
    },
    filename: function (req, file, cb) {
        if (file) {
            console.log('Received file:', file.originalname);
        }
        cb(null, 'profilepic.jpg');
    }
});

const upload = multer({ storage: storage });

router.post('/', upload.single('profilepic'), async (req, res) => {

    const file = req.file;

    if (!file) {
        console.log('No file uploaded');
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
        // console.log('File size exceeds 5MB');
        const compressedImage = await compressImage(file.path, 5 * 1024);
        fs.writeFileSync(file.path, compressedImage);
        // fs.unlinkSync(file.path);
        // return res.status(400).json({ message: 'File size exceeds 5MB' });
    }

    increaseUserVersion(req.userId);

    return res.status(200).json({ message: 'File uploaded successfully' });
});

module.exports = router;
