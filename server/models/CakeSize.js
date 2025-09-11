const mongoose = require('mongoose');

const cakeSizeSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('CakeSize', cakeSizeSchema);