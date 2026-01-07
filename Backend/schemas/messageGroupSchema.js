const mongoose = require('mongoose');

const messageGroupSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    length: {
        type: Number,
        required: true,
        default: 0
    },
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        required: true
    }],
    previousMessageGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MessageGroup',
        default: null
    },
});

const MessageGroup = mongoose.model('MessageGroup', messageGroupSchema);

module.exports = MessageGroup;