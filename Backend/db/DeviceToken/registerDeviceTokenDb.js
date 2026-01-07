const deviceTokenSchema = require('../../schemas/deviceTokenSchema');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;

async function registerDeviceToken(userId, token, deviceId = null, platform = null) {
    try {
        // Remove old token if it exists for this device/user combination
        if (deviceId) {
            await deviceTokenSchema.deleteOne({ userId, deviceId });
        }
        
        // Remove token if it exists for another user (token should be unique per device)
        await deviceTokenSchema.deleteOne({ token });
        
        // Create or update device token
        const deviceToken = await deviceTokenSchema.findOneAndUpdate(
            { userId, token },
            {
                userId,
                token,
                deviceId,
                platform,
                lastUsed: Date.now(),
                updatedAt: Date.now()
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );
        
        return { code: StatusCodes.OK, result: deviceToken };
    } catch (error) {
        console.error('Error registering device token:', error);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error registering device token' };
    }
}

async function unregisterDeviceToken(userId, token) {
    try {
        const result = await deviceTokenSchema.deleteOne({ userId, token });
        return { code: StatusCodes.OK, result: { deleted: result.deletedCount > 0 } };
    } catch (error) {
        console.error('Error unregistering device token:', error);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error unregistering device token' };
    }
}

async function getUserDeviceTokens(userId) {
    try {
        const tokens = await deviceTokenSchema.find({ userId }).sort({ lastUsed: -1 });
        return { code: StatusCodes.OK, result: tokens };
    } catch (error) {
        console.error('Error getting user device tokens:', error);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error getting device tokens' };
    }
}

async function deleteAllUserDeviceTokens(userId) {
    try {
        const result = await deviceTokenSchema.deleteMany({ userId });
        return { code: StatusCodes.OK, result: { deleted: result.deletedCount } };
    } catch (error) {
        console.error('Error deleting all device tokens:', error);
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, result: 'Error deleting device tokens' };
    }
}

module.exports = {
    registerDeviceToken,
    unregisterDeviceToken,
    getUserDeviceTokens,
    deleteAllUserDeviceTokens
};

