const express = require('express');

const router = express.Router();
const path = require('path');

router.get('/', (req, res) => {
    const { id } = req.query;
    if (!id || id == undefined) {
        return res.status(400).json({ message: 'Invalid request' });
    }
    const filePath = path.join(process.env.DATA_FOLDER, id, '/profilepic.jpg');

    res.sendFile(filePath, (err) => {
        if (err) {
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error sending file: ' + err.message });
            }
        }
    });
});

module.exports = router;