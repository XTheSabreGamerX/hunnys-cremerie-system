const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
