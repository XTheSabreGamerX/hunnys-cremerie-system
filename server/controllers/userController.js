const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { createLog } = require("../controllers/activityLogController");

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

module.exports = {
  getAllUsers,
  deactivateUser,
  reactivateUser,
  updateUser,
};
