const mongoose = require('mongoose');

const StatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'assigned', 'out_for_delivery', 'delivered', 'house_locked', 'address_not_found', 'shifted', 'recipient_not_available', 'returned_to_office'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
});

const LetterSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  recipientName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    houseNumber: { type: String, trim: true },
    apartment: { type: String, trim: true },
    street: { type: String, trim: true },
    locality: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    fullAddress: { type: String, required: true, trim: true }
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'out_for_delivery', 'delivered', 'house_locked', 'address_not_found', 'shifted', 'recipient_not_available', 'returned_to_office'],
    default: 'pending'
  },
  beatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Beat',
    required: false
  },
  assignedPostmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  imageUrl: {
    type: String,
    required: false
  },
  ocrText: {
    type: String,
    required: false
  },
  ocrConfidence: {
    type: Number,
    default: 100
  },
  lowConfidence: {
    type: Boolean,
    default: false
  },
  isBatch: {
    type: Boolean,
    default: false
  },
  batchId: {
    type: String,
    required: false
  },
  weather: {
    temp: Number,
    condition: String,
    description: String,
    warning: String,
    updatedAt: Date
  },
  statusHistory: [StatusHistorySchema]
}, {
  timestamps: true
});

// Auto-push status updates into status history log before save
LetterSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    // Check if status is already in history to avoid duplicates
    const alreadyLogged = this.statusHistory.some(
      h => h.status === this.status && 
      Math.abs(new Date() - h.timestamp) < 5000 // within last 5 seconds
    );
    
    if (!alreadyLogged) {
      this.statusHistory.push({
        status: this.status,
        timestamp: new Date(),
        coordinates: this.coordinates
      });
    }
  }
  next();
});

module.exports = mongoose.model('Letter', LetterSchema);
