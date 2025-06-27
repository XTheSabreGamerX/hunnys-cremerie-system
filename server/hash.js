//Script for password hashing
const bcrypt = require('bcrypt');

const password = 'admin123';  // Replace with your desired password
const saltRounds = 10;            // Standard is 10

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }
  console.log('Hashed password:', hash);
});