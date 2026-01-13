const { Group } = require('../../schemas/groupSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function joinGroup(groupId, userId) {
    try {
        const group = await Group.findById(groupId);
        if (!group) return { code: StatusCodes.NOT_FOUND, result: 'Group not found' };
        if (group.members.includes(userId)) return { code: StatusCodes.BAD_REQUEST, result: 'Already a member' };
        group.members.push(userId);
        group.membersCount = group.members.length;
        await group.save();
        return { code: StatusCodes.OK, result: group };
    } catch (err) {
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error joining group: ' + err.message };
    }
}

module.exports = joinGroup;
