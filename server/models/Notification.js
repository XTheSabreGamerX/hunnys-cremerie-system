const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema ({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    roles: [{ type: String, enum: ['admin', 'owner', 'manager', 'staff'] }],
    isGlobal: { type: Boolean, default: false },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'warning', 'success'], default: 'info'},
    read: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);