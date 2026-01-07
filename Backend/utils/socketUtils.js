/**
 * Utility functions for working with socket.io in routes
 * These functions allow routes to interact with active sessions
 */

const { sendPushNotification } = require('./pushNotificationService');

const socketEvents = {
    newMessage: 'newMessage',
}

/**
 * Emit an event to a specific user (all their active sessions)
 * If user is offline, send a push notification instead
 * @param {string} userId - User ID to emit to
 * @param {string} event - Event name
 * @param {any} data - Data to emit
 * @param {object} pushNotification - Optional push notification config { title, body }
 */
async function emitToUser(userId, event, data, pushNotification = null) {
    if (global.io) {
        const isOnline = global.io.isUserOnline(userId);

        if (isOnline) {
            // User is online, send via socket
            global.io.emitToUser(userId, event, data);
        } else if (pushNotification) {
            // User is offline, send push notification
            await sendPushNotification(
                userId,
                pushNotification.title,
                pushNotification.body,
                { event, ...data }
            );
        }
    } else {
        console.warn('[Socket] io instance not available. Make sure socket.io is initialized.');
    }
}

/**
 * Check if a user is currently online
 * @param {string} userId - User ID to check
 * @returns {boolean}
 */
function isUserOnline(userId) {
    if (global.io) {
        return global.io.isUserOnline(userId);
    }
    return false;
}

/**
 * Get all online user IDs
 * @returns {Array<string>}
 */
function getAllOnlineUsers() {
    if (global.io) {
        return global.io.getAllOnlineUsers();
    }
    return [];
}

/**
 * Get count of online users
 * @returns {number}
 */
function getOnlineUsersCount() {
    if (global.io) {
        return global.io.getOnlineUsersCount();
    }
    return 0;
}

/**
 * Broadcast an event to all connected clients
 * @param {string} event - Event name
 * @param {any} data - Data to emit
 */
function broadcast(event, data) {
    if (global.io) {
        global.io.emit(event, data);
    } else {
        console.warn('[Socket] io instance not available. Make sure socket.io is initialized.');
    }
}

/**
 * Broadcast an event to all connected clients except sender
 * @param {string} event - Event name
 * @param {any} data - Data to emit
 */
function broadcastExceptSender(socketId, event, data) {
    if (global.io) {
        global.io.except(socketId).emit(event, data);
    } else {
        console.warn('[Socket] io instance not available. Make sure socket.io is initialized.');
    }
}

/**
 * Send a push notification to a user (regardless of online status)
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data
 */
async function sendNotificationToUser(userId, title, body, data = {}) {
    await sendPushNotification(userId, title, body, data);
}

module.exports = {
    emitToUser,
    isUserOnline,
    getAllOnlineUsers,
    getOnlineUsersCount,
    broadcast,
    broadcastExceptSender,
    sendNotificationToUser,
    socketEvents
};

