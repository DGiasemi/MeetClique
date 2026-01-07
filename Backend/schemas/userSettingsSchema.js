const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  locationSharing: {
    type: String,
    enum: ['everyone', 'friends', 'nobody'],
    default: 'friends'
  },
  lastSeenVisibility: {
    type: String,
    enum: ['everyone', 'friends', 'nobody'],
    default: 'friends'
  },
});

module.exports = mongoose.model('UserSettings', userSettingsSchema);