const mongoose = require('mongoose');
const User = require('./User');

const flightSchema = new mongoose.Schema({
    flightName: {
        type: String,
        required: true
    },
    flightId: {
        type: String,
        required: true,
        unique: true
    },
    origin: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    departureTime: {
        type: Date,
        required: true
    },
    arrivalTime: {
        type: Date,
        required: true
    },
    passengers: {
        type: Number,
        default: 60
    },
    availability: {
        type: Number,
        default: 60
    },
    bookedUsers: {
        type: Array,
        default: []
    }
});


const Flight = mongoose.model('Flight', flightSchema)

module.exports = Flight;
