const ResetRequest = require("../models/ResetRequest");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const { createLog } = require("../controllers/activityLogController");
const { createNotification } = require("../controllers/notificationController");

// Create a new reset password request
const createResetRequest = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    const existingRequest = await ResetRequest.findOne({
      email,
      status: "pending",
    });
    if (existingRequest) {
      return res.status(400).json({
        message:
          "A pending reset request already exists for this email. Please double check your email for the password reset!",
      });
    }

    const newRequest = new ResetRequest({ email, status: "pending" });
    await newRequest.save();

    await createLog({
      action: "Password Reset Request",
      module: "Login",
      description: `A password request was created.`,
      userId: req.user ? req.user.id : null,
    });

    await createNotification({
      message: `A password reset request was sent. Please check the User Management module.`,
      type: "warning",
      roles: ["admin", "owner", "manager"],
    });

    res
      .status(201)
      .json({ message: "Password reset request created successfully" });
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
    const request = await ResetRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const user = await User.findOne({ email: request.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    function generateTempPassword(length) {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let password = "";
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    }

    const tempPassword = generateTempPassword(10);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    user.password = hashedPassword;
    user.needsPasswordReset = true;
    await user.save();

    request.status = "approved";
    await request.save();

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    console.log("Email Host:", process.env.EMAIL_HOST);
    console.log("Email Port:", process.env.EMAIL_PORT);
    console.log("Email User:", process.env.EMAIL_USER);
    console.log(
      "Email Password:",
      process.env.EMAIL_PASSWORD ? "***hidden***" : "Missing"
    );

    await transporter.sendMail({
      from: `"Hunnys Crémerie Baking Supplies" <${process.env.EMAIL_USER}>`,
      to: request.email,
      subject: "Your Password Has Been Reset",
      text: `Hello,\n\nYour temporary password is: ${tempPassword}\n\nPlease log in and change it immediately.`,
    });

    await createLog({
      action: "Password Reset Approved",
      module: "Login",
      description: `A password request was approved and an email was sent.`,
      userId: req.user.id,
    });

    await createNotification({
      message: `A password reset request was approved. The user has received the email containing the temporary password.`,
      type: "success",
      roles: ["admin", "owner", "manager"],
    });

    res.status(200).json({
      message: "Password reset approved",
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    console.error("Error approving reset request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Reject reset password request
const rejectResetRequest = async (req, res) => {
  try {
    const request = await ResetRequest.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    await createLog({
      action: "Password Reset Rejected",
      module: "Login",
      description: `A password request was rejected.`,
      userId: req.user.id,
    });

    await createNotification({
      message: `A password reset request was rejected.`,
      type: "success",
      roles: ["admin", "owner", "manager"],
    });

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteResetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRequest = await ResetRequest.findByIdAndDelete(id);

    if (!deletedRequest) {
      return res.status(404).json({ message: "Reset request not found" });
    }

    res.status(200).json({ message: "Reset request deleted successfully" });
  } catch (error) {
    console.error("Error deleting reset request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.needsPasswordReset = false;
    await user.save();

    res.status(200).json({
      message: "Password has been reset successfully! You may now login!",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createResetRequest,
  getResetRequests,
  approveResetRequest,
  rejectResetRequest,
  deleteResetRequest,
  resetPassword,
};
