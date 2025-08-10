const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const requestRoutes = require('./routes/request');
const userRoutes = require('./routes/user');
const resetRequestRoutes = require('./routes/resetRequest');
const activityRoutes = require('./routes/activityLog');
const inventoryRoutes = require('./routes/inventory');
const saleRoutes = require('./routes/sale');
const supplierRoutes = require('./routes/supplier');
const customerRoutes = require('./routes/customer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const allowedOrigins = [
  'http://localhost:3000',
  'https://hunnys.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/request', requestRoutes);
app.use('/api/user', userRoutes);
app.use('/api/resetRequest', resetRequestRoutes);
app.use('/api/activitylog', activityRoutes)
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);

if (!MONGO_URI) {
  console.error('MONGO_URI is not defined. Please check your .env file.');
  process.exit(1);
}

console.log('MONGO_URI:', process.env.MONGO_URI);

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected!'))
.catch((err) => {
  console.error('MongoDB connection failed:', err.message);
  process.exit(1);
});

app.get('/', (req, res) => {
  res.send('Hunny’s Crémerie Server is running!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});