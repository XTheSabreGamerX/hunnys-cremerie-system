const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const { createLog } = require("../controllers/activityLogController");
const { createNotification } = require("../controllers/notificationController");

function generateTempPassword(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

//Gets all the Users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching users" });
  }
};

//Handles deactivation router for accounts
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "deactivated" },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await createLog({
      action: "Deactivated User",
      module: "User Management",
      description: `An account has been deactivated: ${user.username}`,
      userId: user._id,
    });

    res.json({
      message:
        "User has successfully deactivated! They will no longer be able to access this account until it is reactivated again!",
    });
  } catch (err) {
    console.error("Deactivate error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//Handles reactivation router for acccounts
const reactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await createLog({
      action: "Reactivated User",
      module: "User Management",
      description: `An account has been reactivated: ${user.username}`,
      userId: user._id,
    });

    res.json({
      message:
        "This account has been reactivated! It may now log in to the system again!",
      user,
    });
  } catch (err) {
    console.error("Reactivate error:", err);
    res.status(500).json({ message: "Server error while reactivating user" });
  }
};

//Edit account route
const updateUser = async (req, res) => {
  const { username, email, role } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await createLog({
      action: "Edited User",
      module: "User Management",
      description: `An account has been edited: ${updatedUser.username}`,
      userId: updatedUser._id,
    });

    res.json({ message: "User updated successfully!", user: updatedUser });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Server error while updating user" });
  }
};

const createStaffUser = async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res
        .status(400)
        .json({ message: "Username and email are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    const tempPassword = generateTempPassword(10);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: "staff",
      status: "active",
      needsPasswordReset: true,
    });

    await newUser.save();

    res.status(201).json({
      message:
        "Staff account created successfully. Temporary password will be sent via email.",
    });

    Promise.allSettled([
      sendStaffEmail(email, username, tempPassword),
      createLog({
        action: "Staff Account Created",
        module: "User Management",
        description: `A new staff account was created by admin.`,
        userId: req.user.id,
      }),
      createNotification({
        message: `A new staff account for ${username} was created successfully.`,
        type: "success",
        roles: ["admin", "owner", "manager"],
      }),
    ]).catch((err) => console.error("Post-response task error:", err.message));
  } catch (error) {
    console.error("Error creating staff user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

async function sendStaffEmail(email, username, tempPassword) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    await transporter.verify();
    console.log("SMTP Verified");

    await transporter.sendMail({
      from: `"Hunnys Crémerie Baking Supplies" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your New Staff Account",
      text: `Hello ${username},\n\nYour account has been created.\nTemporary password: ${tempPassword}\n\nPlease log in and change your password immediately.\n\n*DO NOT REPLY TO THIS EMAIL*`,
    });
    console.log("Email sent to", email);
  } catch (err) {
    console.error("Email sending failed:", err);
  }
}

module.exports = {
  getAllUsers,
  deactivateUser,
  reactivateUser,
  updateUser,
  createStaffUser,
};
