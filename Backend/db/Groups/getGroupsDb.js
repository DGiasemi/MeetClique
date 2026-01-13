const { Group } = require('../../schemas/groupSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function getGroups(city) {
    try {
        const query = {};
        if (city) query.city = city;
        const groups = await Group.find(query).sort({ createdAt: -1 }).lean();
        return { code: StatusCodes.OK, result: groups };
    } catch (err) {
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error fetching groups: ' + err.message };
    }
}

module.exports = getGroups;
