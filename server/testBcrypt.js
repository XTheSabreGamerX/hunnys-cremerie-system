const bcrypt = require('bcrypt');

const input = 'admin123';
const stored = '$2b$10$/eCCZc9vixl12XcAkU8DueSRoYM.NLMUqvvPaFF0aKNT9tKJ3T1FW';

bcrypt.compare(input, stored)
  .then(result => console.log('admin123 match?', result));