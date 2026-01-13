const { Group } = require('../../schemas/groupSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function leaveGroup(groupId, userId) {
    try {
        const group = await Group.findById(groupId);
        if (!group) return { code: StatusCodes.NOT_FOUND, result: 'Group not found' };
        const idx = group.members.findIndex(m => m.toString() === userId.toString());
        if (idx === -1) return { code: StatusCodes.BAD_REQUEST, result: 'Not a member' };
        group.members.splice(idx, 1);
        group.membersCount = group.members.length;
        // If user was admin, remove from admins
        const adminIdx = group.admins.findIndex(a => a.toString() === userId.toString());
        if (adminIdx !== -1) group.admins.splice(adminIdx, 1);
        await group.save();
        return { code: StatusCodes.OK, result: group };
    } catch (err) {
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error leaving group: ' + err.message };
    }
}

module.exports = leaveGroup;
