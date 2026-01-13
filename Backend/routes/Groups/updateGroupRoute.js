const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const updateGroup = require('../../db/Groups/updateGroupDb');

const storage = multer.diskStorage({
    destination: function (req, _, cb) {
        const userFolder = path.join(process.env.DATA_FOLDER, req.userId, 'groups');
        if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder, { recursive: true });
        cb(null, userFolder);
    },
    filename: function (_, file, cb) {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname || '.png');
        cb(null, `group_${timestamp}${ext}`);
    }
});

const upload = multer({ storage });

router.post('/', upload.single('image'), async (req, res) => {
    try {
        const file = req.file;
        const imagePath = file ? file.path : undefined;
        const { id, name, description, city, category } = req.body;
        const updates = { name, description, city, category };
        if (imagePath) updates.imageUrl = imagePath;
        const result = await updateGroup(id, req.userId, updates);
        if (result.code !== 200) {
            if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(result.code).json({ message: result.result });
        }
        return res.status(200).json({ group: result.result });
    } catch (err) {
        console.error('updateGroupRoute error', err);
        return res.status(500).json({ message: 'Internal error' });
    }
});

module.exports = router;
