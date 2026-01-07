const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: Buffer,
        required: true
    },
    search_index: {
        type: [Buffer],
        required: true,
        index: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }, 
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MessageGroup',
        default: null,
        required: true
    }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;