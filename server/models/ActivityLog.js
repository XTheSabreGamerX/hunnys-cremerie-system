const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    module: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);