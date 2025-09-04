const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { createLog } = require("../controllers/activityLogController");
const { createNotification } = require("../controllers/notificationController");

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt:", { email });

  try {
    const user = await User.findOne({ email });
    console.log("User found:", user);

    if (!user) {
      await createLog({
        action: "Failed login attempt",
        module: "Login",
        description: `A failed login attempt for non-existing user: ${email}`,
        userId: null,
      });

      await createNotification({
        message: `A non-existing user: "${email}" attempted to login.`,
        type: "warning",
        roles: ["admin", "owner", "manager"],
      });
      return res.status(400).json({ message: "User not found" });
    }

    if (user.status === "deactivated") {
      return res.status(403).json({
        message:
          "Your account has been deactivated. If you think this is an error, please contact the admin.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await createLog({
        action: "Failed login attempt",
        module: "Login",
        description: `A failed login attempt was performed: ${user.username}`,
        userId: user._id,
      });

      await createNotification({
        message: `User: "${user.username}" attempted to login, but failed.`,
        type: "warning",
        roles: ["admin", "owner", "manager"],
      });
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        needsPasswordReset: user.needsPasswordReset,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        needsPasswordReset: user.needsPasswordReset,
      },
    });
    await createLog({
      action: "Login attempt",
      module: "Login",
      description: `User has logged in: ${user.username}`,
      userId: user._id,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "There was an error with your login" });
  }
};

module.exports = { loginUser };
