const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const { getLocationsByName } = require('../../db/Location/getLocationDb');

router.get('/', async (req, res) => {
    const { name } = req.query;

    if (name) {
        const result = await getLocationsByName(name);
        if (result.result.length > 0) {
            return res.status(StatusCodes.OK).json(result);
        } else {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'No locations found' });
        }
    }

    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Not enough parameters provided.' });
});

module.exports = router;