const mongoose = require('mongoose');

const bidSchema = mongoose.Schema({
    title: {type: String, required: true},
    bidAmount: {type: Number, required: true},
    note: String,
    bidderId: String, // can be accessed from current userId on req.session when bid is MADE
    bossId: String, // can be accessed from current userId on req.session when bid is ACCEPTED
    serviceId: String, // should be accessed from req.params
    eventId: String, // should be accessed from req.params
    accepted: {type: Boolean, default: false}
});

module.exports = mongoose.model('Bid', bidSchema);