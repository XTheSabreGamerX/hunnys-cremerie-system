const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { createLog } = require("../controllers/activityLogController");
const { createNotification } = require("../controllers/notificationController");

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

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

    const accessToken = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        needsPasswordReset: user.needsPasswordReset,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "1d" }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
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

const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res
        .status(403)
        .json({ message: "Invalid or expired refresh token" });
    }

    const newAccessToken = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        needsPasswordReset: user.needsPasswordReset,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
  }
};

module.exports = { loginUser, refreshAccessToken };
