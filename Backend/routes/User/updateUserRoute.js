const express = require('express');
const router = express.Router();
const updateUser = require('../../db/User/updateUserDb');

// This route handles updating user name and username only
// Profile pictures are handled separately via /setprofilepic
router.put('/', async (req, res) => {
    const { name, username } = req.body;

    if (name == undefined && username == undefined) {
        return res.status(400).json({ message: 'Invalid request' });
    }

    const userId = req.userId;

    try {
        const result = await updateUser(userId, name, username);
        res.status(result.code).json({ message: result.result });
    }
    catch (error) {
        console.error('Error in updateUser route: ', error);
        return res.status(500).json({ message: 'Server error' });
    }

});

module.exports = router;