const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const { createLocation } = require('../../db/Location/createLocationDb');

router.post('/', async (req, res) => {
    let { name, address, description } = req.body;

    const result = await createLocation(name, address, description);
    if (result.code !== StatusCodes.OK) {
        console.error('Error creating location:', result.result);
        return res.status(result.code).json({ message: result.result });
    }

    const json = {
        name: result.result.name,
        address: result.result.address,
        description: result.result.description,
        createdAt: result.result.createdAt
    };

    res.status(StatusCodes.OK).json({ message: 'Location created successfully', location: json });
});

module.exports = router;