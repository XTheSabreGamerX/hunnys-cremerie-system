const ResetRequest = require("../models/ResetRequest");

// Create a new reset password request
const createResetRequest = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const newRequest = new ResetRequest({ email });
    await newRequest.save();

    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all reset password requests
const getResetRequests = async (req, res) => {
  try {
    const requests = await ResetRequest.find().sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Approve reset password request
const approveResetRequest = async (req, res) => {
  try {
    const request = await ResetRequest.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Reject reset password request
const rejectResetRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await ResetRequest.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Reset request not found" });
    }
    return res
      .status(200)
      .json({ message: "Reset request deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createResetRequest,
  getResetRequests,
  approveResetRequest,
  rejectResetRequest,
};
