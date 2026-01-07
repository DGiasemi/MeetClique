const locationSchema = require('../../schemas/locationSchema');
const HttpStatusCode = require('http-status-codes');
const { getUser } = require('../User/getUserDb');
const { getLocation } = require('./getLocationDb');
const { StatusCodes } = HttpStatusCode;

async function createLocation(name, address, description) {
    if (!name || !address || !description) {
        return { code: StatusCodes.BAD_REQUEST, result: 'Invalid request: Missing required fields' };
    }

    const existing = await getLocation(name, address, description);
    if (existing && existing.code === StatusCodes.OK) {
        return { code: StatusCodes.BAD_REQUEST, result: 'Location already exists' };
    }
    try {
        const createdAt = new Date();

        const newLocation = new locationSchema({
            name,
            address,
            description,
            createdAt,
        });

        await newLocation.save();
        console.log(`Location created successfully with ID: ${newLocation._id}`);
        return { code: StatusCodes.OK, result: newLocation };
    } catch (error) {
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error creating location: ' + error.message };
    }
}

module.exports = { createLocation };