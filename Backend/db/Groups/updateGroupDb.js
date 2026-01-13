const { Group } = require('../../schemas/groupSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function updateGroup(groupId, userId, updates) {
    try {
        const group = await Group.findById(groupId);
        if (!group) return { code: StatusCodes.NOT_FOUND, result: 'Group not found' };
        // Only creator or admin can update
        if (group.createdBy.toString() !== userId.toString() && !group.admins.some(a => a.toString() === userId.toString())) {
            return { code: StatusCodes.FORBIDDEN, result: 'Not allowed' };
        }
        const allowed = ['name', 'description', 'city', 'category', 'imageUrl'];
        allowed.forEach(k => { if (updates[k] !== undefined) group[k] = updates[k]; });
        await group.save();
        return { code: StatusCodes.OK, result: group };
    } catch (err) {
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error updating group: ' + err.message };
    }
}

module.exports = updateGroup;
