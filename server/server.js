const express = require("express");
const mongoose = require("mongoose");
const cron = require("node-cron");
const cors = require("cors");
/* const nodemailer = require('nodemailer'); */
require("dotenv").config();

const authRoutes = require("./routes/auth");
const requestRoutes = require("./routes/request");
const dashboardRoutes = require("./routes/dashboard");
const userRoutes = require("./routes/user");
const resetRequestRoutes = require("./routes/resetRequest");
const activityRoutes = require("./routes/activityLog");
const inventoryRoutes = require("./routes/inventory");
const saleRoutes = require("./routes/sale");
const acquisitionRoutes = require("./routes/acquisition");
const salesReportRoutes = require("./routes/salesReport");
const purchaseOrderRoutes = require("./routes/purchaseOrder");
const supplierRoutes = require("./routes/supplier");
const customerRoutes = require("./routes/customer");
const notificationRoutes = require("./routes/notification");
const actionRequestRoutes = require("./routes/actionRequest");
const reportRoutes = require("./routes/report");
const cakeRoutes = require("./routes/cake");
const backupRoutes = require("./routes/backup");
const settingsRoutes = require("./routes/settings");
const app = express();

const {
  batchUpdateStatuses,
  sendDailyInventoryNotifications,
} = require("./controllers/inventoryController");

const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.NODE_ENV === "development"
    ? process.env.MONGO_URI_DEV
    : process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MongoDB URI is not defined. Please check your .env file.");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    const dbEnv =
      process.env.NODE_ENV === "development" ? "Development" : "Production";
    console.log(`MongoDB connected! (${dbEnv})`);
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

const allowedOrigins = [
  "http://localhost:3000",
  "https://www.hunnyscremerie.online",
  "https://hunnys.netlify.app",
  "https://hunnysdev.netlify.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/request", requestRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/user", userRoutes);
app.use("/api/resetRequest", resetRequestRoutes);
app.use("/api/activitylog", activityRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/acquisitions", acquisitionRoutes);
app.use("/api/salesReport", salesReportRoutes);
app.use("/api/purchaseOrder", purchaseOrderRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/actionRequest", actionRequestRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/cake", cakeRoutes);
app.use("/api/backup-restore", backupRoutes);
app.use("/api/settings", settingsRoutes);

/* // Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
}); */

// Cron scheduler. Runs every 15 minutes to update inventory item status.
cron.schedule("*/15 * * * *", async () => {
  console.log("Running inventory status batch update...");
  try {
    await batchUpdateStatuses();
    console.log("Inventory status updated successfully!");
  } catch (error) {
    console.error("Error updating inventory status: An error occurred.");
  }
});

// Runs every day at 12:00 AM PH time
cron.schedule(
  "0 0 * * *",
  async () => {
    console.log("Running inventory status batch update...");
    try {
      await sendDailyInventoryNotifications();

      console.log("Inventory status updated successfully!");
    } catch (error) {
      console.error("Error updating inventory status:", error);
    }
  },
  {
    timezone: "Asia/Manila",
  }
);

if (!MONGO_URI) {
  console.error("MONGO_URI is not defined. Please check your .env file.");
  process.exit(1);
}

app.get("/", (req, res) => {
  res.send("Hunny’s Crémerie Server is running!");
});

app.listen(PORT, "0.0.0.0", () => {
  //console.log(`Server running on http://0.0.0.0:${PORT}`);
});
