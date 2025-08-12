const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const { createLog } = require("../controllers/activityLogController");

//Request registration route
const registrationRequest = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingRequest = await Request.findOne({ email });
    if (existingRequest) {
      await createLog({
        action: "Failed Registration Request",
        module: "Login",
        description: `A registration request for an existing request was sent: ${email}`,
        userId: null,
      });

      return res.status(400).json({
        message:
          "A request with this email already exists. Please use a different one.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await createLog({
        action: "Failed Registration Request",
        module: "Login",
        description: `A registration request for an existing account was sent: ${email}`,
        userId: null,
      });

      return res.status(400).json({
        message:
          "This email is already being used by another user. Please register with a different email!",
      });
    }

    const newRequest = new Request({ email, password });
    await newRequest.save();

    res.status(200).json({
      message:
        "Registration request submitted successfully! Please wait for approval.",
    });
  } catch (err) {
    console.error("Request error:", err);
    res.status(500).json({
      message: "Server error when submitting the request. Please try again!",
    });
  }
};

//Request Approval route
const requestApprove = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    const existingUser = await User.findOne({ email: request.email });
    if (existingUser) {
      await createLog({
        action: "Failed Registration Approval",
        module: "User Management",
        description: `Approval of registration request failed for user: ${request.email}`,
        userId: existingUser._id,
      });

      return res
        .status(400)
        .json({ message: "A user with this email already exists." });
    }

    const newUser = new User({
      username: request.email.split("@")[0],
      email: request.email,
      password: request.password,
      role: "staff",
    });

    await newUser.save();

    await Request.findByIdAndDelete(req.params.id);

    await createLog({
      action: "Registration Approval",
      module: "User Management",
      description: `Approval of registration request for user: ${request.email}`,
      userId: newUser._id,
    });

    res
      .status(200)
      .json({ message: "Request approved and user created successfully." });
  } catch (err) {
    console.error("Approve request error:", err);
    res.status(500).json({ message: "Server error during approval." });
  }
};

// Reject Request Route
const requestReject = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    await Request.findByIdAndDelete(req.params.id);

    await createLog({
      action: "Registration Rejected",
      module: "User Management",
      description: `Rejection of registration request for user: ${request.email}`,
      userId: null,
    });

    res
      .status(200)
      .json({ message: "Request rejected and deleted successfully" });
  } catch (err) {
    console.error("Reject request error:", err);
    res.status(500).json({ message: "Server error rejecting request" });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find();
    res.json(requests);
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ message: "Server error fetching requests." });
  }
};

module.exports = {
  registrationRequest,
  requestApprove,
  requestReject,
  getAllRequests,
};
