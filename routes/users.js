const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const JWT_SECRET = "nishma"; // Replace with a secure key

// User Signup
router.post('/signup', async (req, res) => {
    const { name, gender, phone, address, password } = req.body;

    // Validate input
    if (!name || !gender || !phone || !address || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        // Check if the phone number is already registered
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ error: 'Phone number already registered' });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, gender, phone, address, password: hashedPassword });

        await user.save();
        return res.json({
            status: 'success',
            success: true,
            message: 'User registered successfully'
        });
    } catch (error) {
        return res.json({
            status: 'error',
            success: false,
            message: 'Failed to register user'
        });
    }
});

// User Login
router.post('/login', async (req, res) => {
    const { phone, password } = req.body;

    // Validate input
    if (!phone || !password) {
        return res.json({
            status: 'error',
            success: false,
            message: 'Phone and password are required'
        });
    }

    try {
        const user = await User.findOne({ phone });

        if (!user) {
            return res.json({
                status: 'error',
                success: false,
                message: 'Invalid phone or password'
            });
        }

        // Compare the provided password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.json({
                status: 'error',
                success: false,
                message: 'Invalid phone or password'
            });
        }

        // Generate JWT token for successful login
        const token = jwt.sign({ id: user._id, phone: user.phone }, JWT_SECRET, { expiresIn: '1h' });

        // Return success response with JWT token
        res.json({
            status: 'success',
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                address: user.address,
                gender: user.gender
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            success: false,
            message: 'An error occurred during login',
            error: error.message
        });
    }
});

// Update User API
router.put('/update', async (req, res) => {
    const { name, gender, phone, address } = req.body;
    const { id } = req.body;

    // Validate input
    if (!name && !gender && !phone && !address) {
        return res.json({
            success: false,
            status: 'error',
            error: 'At least one field is required to update'
        });
    }

    try {
        const user = await User.findById(id);

        if (!user) {
            return res.json({
                status: 'error',
                success: false,
                error: 'User not found'
            });
        }

        // Update fields
        if (name) user.name = name;
        if (gender) user.gender = gender;
        if (phone) user.phone = phone;
        if (address) user.address = address;

        await user.save();

        res.json({
            status: 'success',
            success: true,
            message: 'User updated successfully',
        });
    } catch (error) {
        res.json({
            status: 'error',
            success: false,
            message: 'Failed to update user',
            error: error.message,
        });
    }
});

router.get('/profile', async (req, res) => {
    const { id } = req.body;
    // console.log("profile",id);
    try {
        const user = await User.findById(id);

        if (!user) {
            return res.json({
                status: 'error',
                success: false,
                message: 'User not found',
            });
        }


        const { password, ...userData } = user.toObject();
        res.json({
            status: 'success',
            success: true,
            user: userData,
        });
    } catch (error) {
        res.json({
            status: 'error',
            success: false,
            message: 'Failed to fetch user data',
            error: error.message,
        });
    }
});


module.exports = router;
