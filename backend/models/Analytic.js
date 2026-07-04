const mongoose = require('mongoose');

const AnalyticSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true, // "YYYY-MM-DD"
    index: true
  },
  totalLetters: {
    type: Number,
    default: 0
  },
  deliveredCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  avgDeliveryTime: {
    type: Number,
    default: 0 // In minutes
  },
  distanceCovered: {
    type: Number,
    default: 0 // In kilometers
  },
  ocrAccuracy: {
    type: Number,
    default: 100 // Out of 100
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Analytic', AnalyticSchema);
