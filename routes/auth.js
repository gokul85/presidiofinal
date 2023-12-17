const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');

const router = express.Router();

router.post('/signup', async (req, res) => {
    try {
        const { name, username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: "User Already Exists" });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({
            $or: [{ email: username }, { username: username }]
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id, role: user.role }, "gokul", { expiresIn: '1h' });
        res.status(200).json({ token, "role": user.role });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/admincheck', authenticateToken, async (req, res) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ error: 'Token not provided' });
    }
    jwt.verify(token, "gokul", (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        return res.status(200).json({ role: user.role });
    });
});

// Middlewares
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ message: 'Token not provided' });
    }
    jwt.verify(token, "gokul", (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

function authenticateAdmin(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ message: 'Token not provided' });
    }
    jwt.verify(token, "gokul", (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Inavalid token' });
        }
        if (user.role !== "admin") {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        req.user = user;
        next();
    })
}

module.exports = { router, authenticateToken, authenticateAdmin };
