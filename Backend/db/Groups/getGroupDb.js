const { Group } = require('../../schemas/groupSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function getGroup(groupId) {
    try {
        const group = await Group.findById(groupId).lean();
        if (!group) return { code: StatusCodes.NOT_FOUND, result: 'Group not found' };
        return { code: StatusCodes.OK, result: group };
    } catch (err) {
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error fetching group: ' + err.message };
    }
}

module.exports = getGroup;
