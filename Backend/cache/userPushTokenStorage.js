const userPushTokensStorage = new Map();

function getUserPushTokens(userId) {
    return userPushTokensStorage.get(userId) || [];
}

function addUserPushToken(userId, token) {
    const tokens = userPushTokensStorage.get(userId) || [];
    tokens.push(token);
    userPushTokensStorage.set(userId, tokens);
}

function removeUserPushToken(userId, token) {
    const tokens = userPushTokensStorage.get(userId) || [];
    const index = tokens.indexOf(token);
    if (index > -1) {
        tokens.splice(index, 1);
    }
    userPushTokensStorage.set(userId, tokens);
}

function removeUserPushTokens(userId) {
    userPushTokensStorage.delete(userId);
}

module.exports = {
    getUserPushTokens,
    addUserPushToken,
    removeUserPushToken,
    removeUserPushTokens
};