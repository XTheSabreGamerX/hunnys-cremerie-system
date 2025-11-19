require('dotenv').config(); // load .env variables
const mongoose = require('mongoose');

// Models
const Notification = require('./models/Notification');
const User = require('./models/User');
const InventoryItem = require('./models/InventoryItem');

// Controller function
const { sendDailyInventoryNotifications } = require('./controllers/inventoryController');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_DEV, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    await sendDailyInventoryNotifications();

    console.log('Test run complete');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Error running test:', err);
    process.exit(1);
  }
})();