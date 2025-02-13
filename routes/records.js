const express = require('express');
const Record = require('../models/Record'); // Import Mongoose model
const router = express.Router();

// Get all records
router.get('/get', async (req, res) => {
    try {
        const records = await Record.find();
        res.json(records);
    } catch (error) {
        res.json({ error: 'Failed to fetch records', message: error.message });
    }
});
router.get('/records/phone/:phone', async (req, res) => {
    const { phone } = req.params;

    if (typeof phone !== 'string' || phone.length < 10) {
        return res.status(400).json({ error: 'Phone number must be a valid string of at least 10 characters' });
    }

    try {
        const records = await Record.find({ phone });
        if (records.length === 0) {
            return res.status(404).json({ error: 'No records found for this phone number' });
        }
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch records', message: error.message });
    }
});

// Add a new record
router.post('/records', async (req, res) => {
    const { name, age, gender, condition, phone, address, remarks } = req.body;

    // Validate input
    if (!name || !age || !gender || !condition || !phone || !address) {
        return res.status(400).json({ error: 'All required fields must be filled' });
    }

    if (typeof phone !== 'string' || phone.length < 10) {
        return res.status(400).json({ error: 'Phone must be a valid string of at least 10 characters' });
    }

    try {
        const record = new Record({ name, age, gender, condition, phone, address, remarks });
        const savedRecord = await record.save();
        res.status(201).json(savedRecord);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to save record', message: error.message });
    }
});


module.exports = router;