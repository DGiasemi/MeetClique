const { Group } = require('../../schemas/groupSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function addComment(groupId, userId, content) {
    try {
        const group = await Group.findById(groupId);
        if (!group) return { code: StatusCodes.NOT_FOUND, result: 'Group not found' };
        const comment = { userId, content, createdAt: new Date() };
        group.comments.push(comment);
        await group.save();
        return { code: StatusCodes.OK, result: group };
    } catch (err) {
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error adding comment: ' + err.message };
    }
}

async function editComment(groupId, userId, commentId, content) {
    try {
        const group = await Group.findById(groupId);
        if (!group) return { code: StatusCodes.NOT_FOUND, result: 'Group not found' };
        const c = group.comments.id(commentId);
        if (!c) return { code: StatusCodes.NOT_FOUND, result: 'Comment not found' };
        if (c.userId.toString() !== userId.toString()) return { code: StatusCodes.FORBIDDEN, result: 'Not allowed' };
        c.content = content;
        c.editedAt = new Date();
        await group.save();
        return { code: StatusCodes.OK, result: group };
    } catch (err) {
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error editing comment: ' + err.message };
    }
}

async function deleteComment(groupId, userId, commentId) {
    try {
        const group = await Group.findById(groupId);
        if (!group) return { code: StatusCodes.NOT_FOUND, result: 'Group not found' };
        const c = group.comments.id(commentId);
        if (!c) return { code: StatusCodes.NOT_FOUND, result: 'Comment not found' };
        if (c.userId.toString() !== userId.toString()) return { code: StatusCodes.FORBIDDEN, result: 'Not allowed' };
        c.remove();
        await group.save();
        return { code: StatusCodes.OK, result: group };
    } catch (err) {
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error deleting comment: ' + err.message };
    }
}

module.exports = { addComment, editComment, deleteComment };
