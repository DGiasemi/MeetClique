const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    deviceId: {
        type: String,
        required: false
    },
    platform: {
        type: String,
        enum: ['ios', 'android', 'web'],
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    lastUsed: {
        type: Date,
        default: Date.now
    }
});

// Update updatedAt on save
deviceTokenSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.models.DeviceToken || mongoose.model('DeviceToken', deviceTokenSchema);

