const express = require('express');
const router = express.Router();
const Request = require('../models/Request');

router.post('/request-registration', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingRequest = await Request.findOne({ email });
    if (existingRequest) {
      return res.status(400).json({ message: 'A request with this email already exists. Please use a different one.' });
    }

    const newRequest = new Request({
      email,
      password
    });

    await newRequest.save();

    res.status(200).json({ message: 'Registration request was submitted successfully! Please wait for your approval!' });
  } catch (err) {
    console.error('Request error:', err);
    res.status(500).json({ message: 'Server error when submitting your request. Please try again!' });
  }
});

module.exports = router;