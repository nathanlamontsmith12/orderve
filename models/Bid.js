const mongoose = require('mongoose');

const bidSchema = mongoose.Schema({
    title: {type: String, required: true},
    bidAmount: {type: Number, required: true},
    note: String,
    hostId: String,
    accepted: {type: Boolean, default: false} 
});

module.exports = mongoose.model('Bid', bidSchema);