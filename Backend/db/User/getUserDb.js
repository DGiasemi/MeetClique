const userSchema = require('../../schemas/userSchema');
const HttpStatusCode = require('http-status-codes');

async function getUser(userId) {
    try {
        const user = await userSchema.findById(userId);
        if (!user) {
            return { code: HttpStatusCode.StatusCodes.NOT_FOUND, result: 'User not found' };
        }
        return {
            code: HttpStatusCode.StatusCodes.OK,
            result: user
        };
    } catch (error) {
        console.error('Error fetching user: ', error.message);
        return { code: HttpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error fetching user' };
    }
}

async function getUserByUsername(username) {
    try {
        const user = await userSchema.findOne({ username: username });
        if (!user) {
            return { code: HttpStatusCode.StatusCodes.NOT_FOUND, result: 'User not found' };
        }
        return {
            code: HttpStatusCode.StatusCodes.OK,
            result: user
        };
    }
    catch (error) {
        console.error('Error fetching user: ', error.message);
        return { code: HttpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error fetching user' };
    }
}

async function getUserByEmail(email) {
    try {
        const user = await userSchema.findOne({ email: email });
        if (!user) {
            return { code: HttpStatusCode.StatusCodes.NOT_FOUND, result: 'User not found' };
        }
        return {
            code: HttpStatusCode.StatusCodes.OK,
            result: user
        };
    }
    catch (error) {
        console.error('Error fetching user: ', error.message);
        return { code: HttpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error fetching user' };
    }
}

async function getUsersByUsername(username, limit = 10) {
    try {
        const users = await userSchema.find({ username: { $regex: username, $options: 'i' } }).limit(limit);
        if (users.length === 0) {
            return { code: HttpStatusCode.StatusCodes.NOT_FOUND, result: 'No users found' };
        }
        return {
            code: HttpStatusCode.StatusCodes.OK,
            result: users
        };
    } catch (error) {
        console.error('Error fetching users by username: ', error.message);
        return { code: HttpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error fetching users' };
    }
}

module.exports = {
    getUser,
    getUserByUsername,
    getUserByEmail,
    getUsersByUsername
};