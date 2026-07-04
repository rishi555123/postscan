const express = require('express');
const router = express.Router();
const Letter = require('../models/Letter');
const PostOffice = require('../models/PostOffice');
const User = require('../models/User');
const { fetchWeather } = require('../services/weather');
const { protect, authorize } = require('../middleware/auth');

// Simple Euclidean Distance Calculator (Accurate enough for local sector routing)
const getDistance = (c1, c2) => {
  return Math.sqrt(Math.pow(c1.lat - c2.lat, 2) + Math.pow(c1.lng - c2.lng, 2));
};

// @desc    Get ordered delivery sequence for postman based on Nearest-Neighbor heuristic
// @route   GET /api/routing/postman
// @access  Private (postman, admin)
router.get('/postman', protect, async (req, res) => {
  try {
    const postmanId = req.user.id;

    // 1. Fetch user to get their Post Office details
    const user = await User.findById(postmanId).populate('postOfficeId');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Default starting point (Hyderabad Central) if postman has no assigned Post Office
    let startCoordinates = { lat: 17.3850, lng: 78.4867 };
    let postOfficeName = 'Hyderabad Central Hub';

    if (user.postOfficeId) {
      startCoordinates = user.postOfficeId.coordinates;
      postOfficeName = user.postOfficeId.name;
    }

    // 2. Fetch all packages assigned to this postman that are NOT yet delivered
    const letters = await Letter.find({
      assignedPostmanId: postmanId,
      status: { $in: ['assigned', 'out_for_delivery', 'house_locked', 'address_not_found', 'shifted', 'recipient_not_available'] }
    }).populate('beatId');

    // 3. Nearest-Neighbor Sequencing Heuristic
    const unvisited = [...letters];
    const orderedSequence = [];
    let currentPos = { ...startCoordinates };

    while (unvisited.length > 0) {
      let closestIdx = 0;
      let minDistance = getDistance(currentPos, unvisited[0].coordinates);

      for (let i = 1; i < unvisited.length; i++) {
        const dist = getDistance(currentPos, unvisited[i].coordinates);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      }

      const closestLetter = unvisited.splice(closestIdx, 1)[0];
      orderedSequence.push(closestLetter);
      currentPos = closestLetter.coordinates;
    }

    // 4. Dynamically update weather warnings for each package in parallel
    await Promise.all(
      orderedSequence.map(async (letter) => {
        try {
          const freshWeather = await fetchWeather(
            letter.coordinates.lat,
            letter.coordinates.lng,
            letter.address.pincode
          );
          letter.weather = freshWeather;
          await letter.save();
        } catch (err) {
          console.error(`Failed to update weather for letter ${letter.trackingId}: ${err.message}`);
        }
      })
    );
    // Extract unique beats
const beats = [];
const seen = new Set();

for (const letter of orderedSequence) {
  if (letter.beatId && !seen.has(letter.beatId._id.toString())) {
    seen.add(letter.beatId._id.toString());

    beats.push({
      id: letter.beatId._id,
      beatNumber: letter.beatId.beatNumber,
      name: letter.beatId.name,
      colorHex: letter.beatId.colorHex,
      coordinates: letter.beatId.coordinates,
      assignedPostman: user.name
    });
  }
}

res.json({
  success: true,
  origin: {
    name: postOfficeName,
    coordinates: startCoordinates
  },
  routeLength: orderedSequence.length,
  route: orderedSequence,
  beats: beats
});

} catch (error) {
  console.error('Error calculating delivery route:', error);
  res.status(500).json({
    success: false,
    message: 'Error generating route sequence'
  });
}

});

module.exports = router;