const mongoose = require('mongoose');

const BeatSchema = new mongoose.Schema({
  beatNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  postOfficeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostOffice',
    required: true
  },
  assignedPostmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  colorHex: {
    type: String,
    default: '#3b82f6'
  },
  pincodes: [{
    type: String,
    trim: true
  }],
  areas: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Beat', BeatSchema);
