const { Expo } = require('expo-server-sdk');
const { getUserDeviceTokens } = require('../db/DeviceToken/registerDeviceTokenDb');

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send push notification to a user
 * @param {string} userId - User ID to send notification to
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data to send with notification
 * @returns {Promise<object>} - Result of sending notification
 */
async function sendPushNotification(userId, title, body, data = {}) {
    try {
        // Get all device tokens for the user
        const tokensResult = await getUserDeviceTokens(userId);
        
        if (tokensResult.code !== 200 || !tokensResult.result || tokensResult.result.length === 0) {
            return { success: false, message: 'No device tokens found for user' };
        }

        const deviceTokens = tokensResult.result.map(tokenDoc => tokenDoc.token);
        
        // Filter out invalid tokens
        const validTokens = deviceTokens.filter(token => Expo.isExpoPushToken(token));
        
        if (validTokens.length === 0) {
            return { success: false, message: 'No valid Expo push tokens found' };
        }

        // Create messages
        const messages = validTokens.map(token => ({
            to: token,
            sound: 'default',
            title,
            body,
            data: {
                ...data,
                userId,
                timestamp: Date.now()
            },
            priority: 'high',
            channelId: 'default'
        }));

        // Send notifications in chunks (Expo allows up to 100 at a time)
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending push notification chunk:', error);
            }
        }

        // Check for errors in tickets
        const errors = [];
        tickets.forEach((ticket, index) => {
            if (ticket.status === 'error') {
                errors.push({
                    token: validTokens[index],
                    error: ticket.message
                });
            }
        });

        return {
            success: true,
            sent: tickets.length - errors.length,
            errors: errors.length > 0 ? errors : undefined
        };
    } catch (error) {
        console.error('Error sending push notification:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Send push notifications to multiple users
 * @param {Array<string>} userIds - Array of user IDs
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data
 * @returns {Promise<object>} - Result of sending notifications
 */
async function sendPushNotificationsToUsers(userIds, title, body, data = {}) {
    const results = await Promise.all(
        userIds.map(userId => sendPushNotification(userId, title, body, data))
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
        success: true,
        total: userIds.length,
        successful: successCount,
        failed: failureCount,
        results
    };
}

module.exports = {
    sendPushNotification,
    sendPushNotificationsToUsers
};

