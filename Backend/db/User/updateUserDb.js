const userSchema = require('../../schemas/userSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function updateUser(userId, name, username) {
    let user = await userSchema.findById(userId);
    if (!user) {
        return { code: StatusCodes.NOT_FOUND, result: 'User not found' };
    }
    if (name !== undefined) {
        user.name = name;
    }
    if (username !== undefined) {
        user.username = username.toLowerCase();
    }
    try {
        await user.save();
        return { code: StatusCodes.OK, result: user };
    } catch (error) {
        console.error('Error updating user: ', error.message);
    }
    return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error updating user' };
}

module.exports = updateUser;