const mongoose = require('mongoose');
const Bids = require('./Bid');

const serviceSchema = mongoose.Schema({
    title: {type: String, required: true},
    images: String,
    about: String,
    hostId: String,
    bids: [Bids.schema]
});

module.exports = mongoose.model('Service', serviceSchema);