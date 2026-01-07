const { Expo } = require("expo-server-sdk");
const { getUserPushTokens, removeUserPushToken } = require("../cache/userPushTokenStorage.js");

const expo = new Expo();

async function sendPushNotification(userId, title, body, data = {}) {
    const tokens = getUserPushTokens(userId);

    if (!tokens.length) {
        console.error("No push tokens found for user:", userId);
        return;
    }

    const validTokens = [];
    for (const token of tokens) {
        if (!Expo.isExpoPushToken(token)) {
            console.error("Invalid Expo push token:", token);
            removeUserPushToken(userId, token);
            continue;
        }
        validTokens.push(token);
    }

    if (!validTokens.length) {
        console.error("No valid push tokens found for user:", userId);
        return;
    }

    const messages = [
        {
            to: validTokens[0],
            sound: "default",
            title,
            body,
            data,
        },
    ];

    try {
        const tickets = await expo.sendPushNotificationsAsync(messages);

        tickets.forEach((ticket, index) => {
            if (ticket.status === 'error') {
                console.error(`Error in ticket ${index}:`, ticket.message);
                if (ticket.details?.error) {
                    console.error('Error details:', ticket.details.error);
                }
            }
        });

        return tickets;
    } catch (err) {
        console.error("Error sending notification:", err);
        console.error("Error details:", err.message);
    }
}

module.exports = {
    sendPushNotification
};
