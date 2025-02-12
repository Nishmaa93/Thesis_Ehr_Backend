const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: String, required: true },
    gender: { type: String, required: true },
    condition: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    remarks: { type: String }
});

module.exports = mongoose.model('Record', recordSchema);
