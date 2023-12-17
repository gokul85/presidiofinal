const express = require('express');
const Flight = require('../models/Flight');
const { default: mongoose } = require('mongoose');
const User = require('../models/User');
const router = express.Router();
const authenticateToken = require('./auth').authenticateToken;
const authenticateAdmin = require('./auth').authenticateAdmin;

router.post('/', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    try {
        const { flightName, flightId, origin, destination, departureTime, arrivalTime, passengers } = req.body;
        const newFlight = new Flight({ flightName, flightId, origin, destination, departureTime, arrivalTime, passengers });
        await newFlight.save();
        res.status(201).json({ message: 'Flight created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/search', async (req, res) => {
    try {
        const { flightName, flightId, departureTime } = req.query;

        let query = {};

        if (flightName) {
            query.flightName = new RegExp(flightName, 'i');
        }

        if (flightId) {
            query.flightId = flightId;
        }

        if (departureTime) {
            const startOfDay = new Date(departureTime);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(departureTime);
            endOfDay.setHours(23, 59, 59, 999);

            query.departureTime = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }
        const flights = await Flight.find(query).select('-__v -_id');
        res.status(200).json({ flights });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/adminsearch', authenticateAdmin, async (req, res) => {
    try {
        const { flightdata } = req.body;
        console.log(new Date(flightdata));
        const query = {
            $or: [
                { flightId: flightdata },
                { flightName: flightdata },
                {
                    date: new Date(flightdata)
                }
            ]
        };
        const flights = await Flight.find(query).select('-__v -_id');
        res.status(200).json({ flights });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.get('/', async (req, res) => {
    try {
        const flights = await Flight.find().select('-__v -_id');
        res.status(200).json({ flights });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/bookings', authenticateAdmin, async (req, res) => {
    try {
        const { flightId } = req.body;
        const f = await Flight.find({ flightId: flightId });
        const bookedusers = f[0].bookedUsers;
        const users = await Promise.all(
            bookedusers.map((id, i) =>
                User.findOne({ _id: id })
                    .select('name email')
                    .then(user => ({ seat: i + 1, name: user.name, email: user.email }))
            )
        );
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ error: "Error" });
    }
});

router.post('/book/:flightId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const flightId = req.params.flightId;
        const f = await Flight.find({ flightId: flightId });
        const flight = await Flight.findById(f[0]._id).populate('bookedUsers');

        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        if (flight.bookedUsers.some(user => user.toString() === userId.toString())) {
            return res.status(400).json({ message: 'User already booked this flight' });
        }

        flight.bookedUsers.push(userId);
        flight.availability = flight.availability - 1;
        await flight.save();

        return res.status(200).json({ message: 'Flight booked successfully' });
    } catch (error) {
        console.error('Error booking flight:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;