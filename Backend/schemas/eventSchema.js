const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: false,
        default: null
    },
    mediaUrl: {
        type: String,
        required: true
    },
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: false
    },
    reactionsCount: {
        type: Number,
        default: 0
    },
    attendeesCount: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        default: 0
    },
    attendees: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    }
    ,
    city: {
        type: String,
        required: true
    }
    ,
    type: {
        type: String,
        enum: ['event', 'hangout'],
        default: 'event'
    }
});

module.exports = { Event: mongoose.model('Event', eventSchema) };