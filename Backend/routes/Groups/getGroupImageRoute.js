const express = require('express');
const getGroup = require('../../db/Groups/getGroupDb');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const { StatusCodes } = require('http-status-codes');

router.get('/', async (req, res) => {
    try {
        const { id } = req.query;
        console.log('getGroupImage request - id:', id);
        
        if (!id || id == undefined) {
            return res.status(400).json({ message: 'Invalid request' });
        }
        
        const group = await getGroup(id);
        console.log('Group fetch result:', group.code, group.result?.name);
        
        if (group.code !== StatusCodes.OK) {
            return res.status(group.code).json({ message: group.result });
        }
        
        const filePath = group.result.imageUrl;
        console.log('File path:', filePath);

        if (!filePath) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error('File does not exist at path:', filePath);
            return res.status(404).json({ message: 'Image file not found on disk' });
        }

        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error sending group image file:', err);
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Error sending file: ' + err.message });
                }
            }
        });
    } catch (error) {
        console.error('Error in retrieving a group image: ', error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error in retrieving a group image' });
    }
});

module.exports = router;
