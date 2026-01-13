const mongoose = require('mongoose');

const groupCommentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    editedAt: { type: Date, default: null }
});

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    city: { type: String, required: true },
    category: { type: String, enum: ['Fun', 'Travel', 'Hobbies', 'Learning', 'Food', 'Other'], default: 'Other' },
    imageUrl: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    admins: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    members: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    membersCount: { type: Number, default: 0 },
    comments: { type: [groupCommentSchema], default: [] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = { Group: mongoose.model('Group', groupSchema) };
