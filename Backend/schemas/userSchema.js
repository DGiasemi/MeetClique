const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  username: {
    type: String,
    unique: true,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  encryptedPrivateKey: {
    type: String,
    required: true,
  },
  publicKey: {
    type: String,
    required: true
  },
  loginToken: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  chats: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: undefined
  }],
  version: {
    type: Number,
    default: 0,
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;