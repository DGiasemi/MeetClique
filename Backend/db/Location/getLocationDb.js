const locationSchema = require('../../schemas/locationSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

/*
 * Function to get a location by its name
 * It is an inaccurate function as the name may not be unique and might return forbidden code while the location asked for is not private
 * @param {string} name - The name of the location
 * @param {string|null} address - The address of the location (optional)
 * @returns {Promise<{code: number, result: string|object}>}
 */
async function getLocationByName(name, address = null) {
    try {
        const query = { name };
        if (address) query.address = address;

        const location = await locationSchema.findOne(query);
        if (!location) {
            return { code: StatusCodes.NOT_FOUND, result: 'Location not found' };
        }
        if (location.visibility == "private" && location.ownerID.toString() !== userID) {
            return { code: StatusCodes.FORBIDDEN, result: 'Location is private' };
        }
        return {
            code: StatusCodes.OK,
            result: {
                id: location._id,
                name: location.name,
                address: location.address,
                description: location.description,
            },
        };
    } catch (error) {
        console.error('Error fetching location by name: ', error.message);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error fetching location' };
    }
}

async function getLocationsByName(name) {
    try {
        const locations = await locationSchema.find({ name: { $regex: name, $options: 'i' } });
        if (!locations || locations.length === 0) {
            return { code: StatusCodes.NOT_FOUND, result: 'No locations found' };
        }
        return {
            code: StatusCodes.OK,
            result: locations.map(location => ({
                id: location._id,
                name: location.name,
                address: location.address,
                description: location.description,
            })),
        };
    } catch (error) {
        console.error('Error searching locations by name: ', error.message);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error searching locations' };
    }
}

async function getLocationById(locationId) {
    try {
        const location = await locationSchema.findById(locationId);
        if (!location) {
            return { code: StatusCodes.NOT_FOUND, result: 'Location not found' };
        }
        return {
            code: StatusCodes.OK,
            result: {
                id: location._id,
                name: location.name,
                address: location.address,
                description: location.description,
            },
        };
    } catch (error) {
        console.error('Error fetching location by ID: ', error.message);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error fetching location' };
    }
}

async function getLocationByName(name) {
    try {
        const locations = await locationSchema.find({ name: { $regex: name, $options: 'i' } });
        if (!locations || locations.length === 0) {
            return { code: StatusCodes.NOT_FOUND, result: 'No locations found' };
        }
        return {
            code: StatusCodes.OK,
            result: locations.map(location => ({
                id: location._id,
                name: location.name,
                address: location.address,
                description: location.description,
            })),
        };
    } catch (error) {
        console.error('Error searching locations by name: ', error.message);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error searching locations' };
    }
}

/*
 * Generic function to get locations based on various parameters
 * @param {string|null} name - The name of the location (optional)
 * @param {string|null} address - The address of the location (optional)
 * @param {string|null} description - The description of the location (optional)
 * @returns {Promise<{code: number, result: string|object}>}
*/
async function getLocation(name = null, address = null, description = null) {
    try {
        const query = {};
        if (name) query.name = name;
        if (address) query.address = address;
        if (description) query.description = description;

        if (!query) {
            return { code: StatusCodes.BAD_REQUEST, result: 'Invalid request: No query parameters provided' };
        }

        const locations = await locationSchema.find(query);
        if (!locations || locations.length === 0) {
            return { code: StatusCodes.NOT_FOUND, result: 'No locations found' };
        }
        return {
            code: StatusCodes.OK,
            result: locations.map(location => ({
                id: location._id,
                name: location.name,
                address: location.address,
                description: location.description,
            })),
        };
    } catch (error) {
        console.error('Error fetching locations: ', error.message);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error fetching locations' };
    }
}

module.exports = {
    getLocationByName,
    getLocationsByName,
    getLocationById,
    getLocation,
};