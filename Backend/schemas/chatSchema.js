const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    messages: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MessageGroup',
        default: undefined,
        required: false
    },
    type: {
        type: String,
        enum: ['group', 'private'],
        default: 'private'
    },
    image: {
        type: String,
        default: undefined,
        required: false
    },
    aesKeys: [{
        type: String,
        required: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;