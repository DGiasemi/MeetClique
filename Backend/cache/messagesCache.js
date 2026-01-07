const messageSchema = require('../schemas/messageSchema');

const CACHE_SAVE_INTERVAL = 1000;// * 30; // 30 seconds

const messageGroups = new Map(); // Chat id -> Latest message group
const messageGroupsTimeouts = new Map(); // Chat id -> Timeout ID
const messages = new Map(); // Chat id -> Messages array

async function saveMessages(chatId, existingGroup) {
    const chatMessages = messages.get(chatId);
    if (chatMessages && chatMessages.length > 0) {
        const ids = await messageSchema.insertMany(chatMessages);
        existingGroup.messages.push(...ids.map(msg => msg._id)); // Add new messages to the existing group
        messages.set(chatId, []); // Reset the messages for this chat
    }
    existingGroup.save(); // Save the previous message group if it exists
    messageGroups.delete(chatId); // Clear the message group for this chat
}

function setMessageGroupTimeout(chatId) {
    if (messageGroupsTimeouts.has(chatId)) {
        clearTimeout(messageGroupsTimeouts.get(chatId));
    }
    const timeoutId = setTimeout(async () => {
        const messageGroup = messageGroups.get(chatId);
        await saveMessages(chatId, messageGroup);
    }, CACHE_SAVE_INTERVAL);
    messageGroupsTimeouts.set(chatId, timeoutId);
}

function getMessageGroup(chatId) {
    const messageGroup = messageGroups.get(chatId);
    return messageGroup;
}

async function setMessageGroup(chatId, messageGroup) {
    const existingGroup = messageGroups.get(chatId);
    if (existingGroup && existingGroup._id.toString() !== messageGroup._id.toString()) {
        clearTimeout(messageGroupsTimeouts.get(chatId));
        await saveMessages(chatId, existingGroup);
    }
    setMessageGroupTimeout(chatId);
    messageGroups.set(chatId, messageGroup);
}

async function pushMessage(chatId, message, messageGroup) {
    if (!messages.has(chatId)) {
        messages.set(chatId, []);
    }
    if (!messageGroup) {
        throw new Error(`No message group found for chat ${chatId}`);
    }
    messageGroup.length += 1; // Increment the length of the message group
    await setMessageGroup(chatId, messageGroup); // Update the message group in cache
    messages.get(chatId).push(message);
}

function getMessages(chatId) {
    return messages.get(chatId) || [];
}

module.exports = {
    setMessageGroup,
    getMessageGroup,
    pushMessage,
    getMessages,
};