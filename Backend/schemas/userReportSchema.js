const mongoose = require('mongoose');

const userReportSchema = new mongoose.Schema({
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const UserReport = mongoose.model('UserReport', userReportSchema);

module.exports = UserReport;