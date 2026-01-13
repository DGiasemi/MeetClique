const { Group } = require('../../schemas/groupSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function deleteGroup(groupId, userId) {
    try {
        const group = await Group.findById(groupId);
        if (!group) return { code: StatusCodes.NOT_FOUND, result: 'Group not found' };
        // Only creator can delete
        if (group.createdBy.toString() !== userId.toString()) return { code: StatusCodes.FORBIDDEN, result: 'Not allowed' };
        await Group.deleteOne({ _id: groupId });
        return { code: StatusCodes.OK, result: 'Deleted' };
    } catch (err) {
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error deleting group: ' + err.message };
    }
}

module.exports = deleteGroup;
