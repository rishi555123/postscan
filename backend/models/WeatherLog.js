const mongoose = require('mongoose');

const WeatherLogSchema = new mongoose.Schema({
  pincode: {
    type: String,
    required: true,
    index: true
  },
  temp: {
    type: Number,
    required: true
  },
  condition: {
    type: String,
    required: true
  },
  warning: {
    type: String,
    default: 'None'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 3600 // Automatically expire logs after 1 hour (cache expiration)
  }
});

module.exports = mongoose.model('WeatherLog', WeatherLogSchema);
