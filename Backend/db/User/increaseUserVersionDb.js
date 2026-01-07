const userSchema = require('../../schemas/userSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

const getRandomNumber = () => {
    return Math.floor(Math.random() * 1000000);
}

async function increaseUserVersion(userId) {
    let user = await userSchema.findById(userId);
    if (!user) {
        return { code: StatusCodes.NOT_FOUND, result: 'User not found' };
    }
    user.version = getRandomNumber();
    try {
        await user.save();
        return { code: StatusCodes.OK, result: user };
    } catch (error) {
        console.error('Error increasing user version: ', error.message);
    }
    return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error increasing user version' };
}

module.exports = {increaseUserVersion};