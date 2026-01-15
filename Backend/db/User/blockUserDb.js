const userSchema = require('../../schemas/userSchema');
const HttpStatusCode = require('http-status-codes');

async function setBlockUser(userId, targetId, block = true) {
    try {
        if (block) {
            await userSchema.findByIdAndUpdate(userId, { $addToSet: { blockedUsers: targetId } });
            return { code: HttpStatusCode.StatusCodes.OK, result: 'User blocked' };
        } else {
            await userSchema.findByIdAndUpdate(userId, { $pull: { blockedUsers: targetId } });
            return { code: HttpStatusCode.StatusCodes.OK, result: 'User unblocked' };
        }
    } catch (error) {
        console.error('Error setting block user: ', error.message);
        return { code: HttpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error updating block list' };
    }
}

module.exports = setBlockUser;
