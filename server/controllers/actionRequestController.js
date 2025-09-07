const ActionRequest = require('../models/ActionRequest');
const InventoryItem = require('../models/InventoryItem');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Sale = require('../models/Sale');
const { createLog } = require('./activityLogController');
const { createNotification } = require('./notificationController');

// Fetch all pending action requests
const getAllRequests = async (req, res) => {
  try {
    const requests = await ActionRequest.find({ status: 'pending' })
      .populate('requestedBy', 'username email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error('[ActionRequest] Fetch error:', err.message);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
};

// Approve an action request
const approveRequest = async (req, res) => {
  try {
    const request = await ActionRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Determine target model
    let targetModel;
    switch (request.moduleRef) {
      case 'InventoryItem':
        targetModel = InventoryItem;
        break;
      case 'Customer':
        targetModel = Customer;
        break;
      case 'Supplier':
        targetModel = Supplier;
        break;
      case 'Sale':
        targetModel = Sale;
        break;
      default:
        return res.status(400).json({ message: 'Invalid target model' });
    }

    // Apply requested action
    let target;
    if (request.requestType === 'delete') {
      target = await targetModel.findByIdAndDelete(request.targetId);
    } else if (request.requestType === 'edit' && request.details) {
      target = await targetModel.findByIdAndUpdate(request.targetId, request.details, { new: true });
    } else {
      return res.status(400).json({ message: 'Invalid request type or missing details' });
    }

    request.status = 'approved';
    request.reviewedBy = req.user.id;
    await request.save();

    await createLog({
      action: `Approved ${request.requestType} Request`,
      module: request.module,
      description: `User ${req.user.username} approved ${request.requestType} request for ${request.moduleRef} ID: ${request.targetId}`,
      userId: req.user.id,
    });

    await createNotification({
      message: `Your ${request.requestType} request for "${request.moduleRef}" has been approved.`,
      type: 'success',
      userId: request.requestedBy,
      roles: [],
      isGlobal: false,
    });

    res.json({ message: 'Request approved successfully', target });
  } catch (err) {
    console.error('[ActionRequest] Approve error:', err.message);
    res.status(500).json({ message: 'Failed to approve request' });
  }
};

// Reject an action request
const rejectRequest = async (req, res) => {
  try {
    const request = await ActionRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'denied';
    request.reviewedBy = req.user.id;
    await request.save();

    await createLog({
      action: `Rejected ${request.requestType} Request`,
      module: request.module,
      description: `User ${req.user.username} rejected ${request.requestType} request for ${request.moduleRef} ID: ${request.targetId}`,
      userId: req.user.id,
    });

    await createNotification({
      message: `Your ${request.requestType} request for "${request.moduleRef}" has been denied.`,
      type: 'error',
      userId: request.requestedBy,
      roles: [],
      isGlobal: false,
    });

    res.json({ message: 'Request rejected successfully' });
  } catch (err) {
    console.error('[ActionRequest] Reject error:', err.message);
    res.status(500).json({ message: 'Failed to reject request' });
  }
};

module.exports = {
  getAllRequests,
  approveRequest,
  rejectRequest,
};