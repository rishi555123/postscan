const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Letter = require('../models/Letter');
const Beat = require('../models/Beat');
const { parseAddressFromImage } = require('../services/ai');
const { fetchWeather } = require('../services/weather');
const { protect, authorize } = require('../middleware/auth');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Images only (jpg, jpeg, png, webp)!'));
  }
});

/**
 * Server-side Beat Auto-Assignment logic
 * Matches pincode first, then runs area string checks.
 */
const autoAssignBeat = async (parsedAddress) => {
  const pincode = parsedAddress.address?.pincode;
  const fullAddressLower = (parsedAddress.address?.fullAddress || '').toLowerCase();
  const localityLower = (parsedAddress.address?.locality || '').toLowerCase();
  const streetLower = (parsedAddress.address?.street || '').toLowerCase();

  const beats = await Beat.find({});

  // 1. Pincode Match
  if (pincode) {
    for (const beat of beats) {
      if (beat.pincodes.includes(pincode)) {
        return beat;
      }
    }
  }

  // 2. Keyword Area Match
  for (const beat of beats) {
    for (const area of beat.areas) {
      if (area && (fullAddressLower.includes(area) || localityLower.includes(area) || streetLower.includes(area))) {
        return beat;
      }
    }
  }

  return null;
};

// @desc    Upload single letter label image
// @route   POST /api/letters/upload
// @access  Private (office_staff, admin)
router.post('/upload', protect, authorize('office_staff', 'admin'), upload.single('label'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a letter image' });
    }

    const parsedData = await parseAddressFromImage(req.file.path);
    const weatherData = await fetchWeather(parsedData.coordinates.lat, parsedData.coordinates.lng, parsedData.address.pincode);
    const matchedBeat = await autoAssignBeat(parsedData);
    const trackingId = `IN-${Date.now().toString().slice(-8)}`;

    const newLetter = new Letter({
      trackingId,
      recipientName: parsedData.recipientName,
      address: parsedData.address,
      coordinates: parsedData.coordinates,
      imageUrl: `/uploads/${req.file.filename}`,
      ocrText: parsedData.ocrText,
      ocrConfidence: parsedData.ocrConfidence,
      lowConfidence: parsedData.lowConfidence,
      weather: weatherData,
      status: matchedBeat ? 'assigned' : 'pending',
      beatId: matchedBeat ? matchedBeat._id : null,
      assignedPostmanId: matchedBeat ? matchedBeat.assignedPostmanId : null
    });

    await newLetter.save();

    const populatedLetter = await Letter.findById(newLetter._id)
      .populate('beatId')
      .populate('assignedPostmanId', 'name username role');

    res.status(201).json({
      success: true,
      message: matchedBeat ? 'Letter processed and auto-assigned beat!' : 'Letter processed, requires manual beat assignment.',
      package: populatedLetter // Retain key name for front compatibility or map it
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: `Error processing scan: ${error.message}` });
  }
});

// @desc    Batch upload multiple letter labels (10-100 images)
// @route   POST /api/letters/batch-upload
// @access  Private (office_staff, admin)
router.post('/batch-upload', protect, authorize('office_staff', 'admin'), upload.array('labels', 100), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one image file' });
    }

    const batchId = `BATCH-${Date.now().toString().slice(-6)}`;
    console.log(`Processing batch upload of ${req.files.length} letters under Batch ID: ${batchId}`);

    const processedLetters = [];

    // Process each in sequence (safe for free key limits / fallback rotating arrays)
    for (const file of req.files) {
      try {
        const parsedData = await parseAddressFromImage(file.path);
        const weatherData = await fetchWeather(parsedData.coordinates.lat, parsedData.coordinates.lng, parsedData.address.pincode);
        const matchedBeat = await autoAssignBeat(parsedData);
        const trackingId = `IN-B-${Math.floor(100000 + Math.random() * 900000)}`;

        const newLetter = new Letter({
          trackingId,
          recipientName: parsedData.recipientName,
          address: parsedData.address,
          coordinates: parsedData.coordinates,
          imageUrl: `/uploads/${file.filename}`,
          ocrText: parsedData.ocrText,
          ocrConfidence: parsedData.ocrConfidence,
          lowConfidence: parsedData.lowConfidence,
          isBatch: true,
          batchId,
          weather: weatherData,
          status: matchedBeat ? 'assigned' : 'pending',
          beatId: matchedBeat ? matchedBeat._id : null,
          assignedPostmanId: matchedBeat ? matchedBeat.assignedPostmanId : null
        });

        await newLetter.save();
        
        const populated = await Letter.findById(newLetter._id)
          .populate('beatId')
          .populate('assignedPostmanId', 'name username role');
        
        processedLetters.push(populated);
      } catch (err) {
        console.error(`Failed to process individual letter in batch:`, err.message);
      }
    }

    res.status(201).json({
      success: true,
      batchId,
      count: processedLetters.length,
      letters: processedLetters
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: `Batch process failure: ${error.message}` });
  }
});

// @desc    Get all letters
// @route   GET /api/letters
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.postmanId) {
      filter.assignedPostmanId = req.query.postmanId;
    }
    if (req.query.beatId) {
      filter.beatId = req.query.beatId;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const letters = await Letter.find(filter)
      .populate('beatId')
      .populate('assignedPostmanId', 'name username role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: letters.length, packages: letters }); // retain 'packages' key for front-end compatibility
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Manual override of Beat assignment
// @route   PUT /api/letters/:id/override
// @access  Private (office_staff, admin)
router.put('/:id/override', protect, authorize('office_staff', 'admin'), async (req, res) => {
  const { beatId } = req.body;

  try {
    const letter = await Letter.findById(req.params.id);
    if (!letter) {
      return res.status(404).json({ success: false, message: 'Letter not found' });
    }

    if (!beatId) {
      letter.beatId = null;
      letter.assignedPostmanId = null;
      letter.status = 'pending';
    } else {
      const beat = await Beat.findById(beatId);
      if (!beat) {
        return res.status(404).json({ success: false, message: 'Beat not found' });
      }
      letter.beatId = beat._id;
      letter.assignedPostmanId = beat.assignedPostmanId;
      letter.status = 'assigned';
    }

    await letter.save();

    const populated = await Letter.findById(letter._id)
      .populate('beatId')
      .populate('assignedPostmanId', 'name username role');

    res.json({
      success: true,
      message: 'Letter assignment overridden successfully',
      package: populated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Update letter delivery status (statusHistory updates automatically via pre-save)
// @route   PUT /api/letters/:id/status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  const { status, lat, lng } = req.body;
  const validStatuses = ['pending', 'assigned', 'out_for_delivery', 'delivered', 'house_locked', 'address_not_found', 'shifted', 'recipient_not_available', 'returned_to_office'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  try {
    const letter = await Letter.findById(req.params.id);
    if (!letter) {
      return res.status(404).json({ success: false, message: 'Letter not found' });
    }

    if (req.user.role === 'postman' && letter.assignedPostmanId?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this letter' });
    }

    letter.status = status;
    
    // Update coordinates if provided from GPS
    if (lat && lng) {
      letter.coordinates = { lat, lng };
    }

    await letter.save();

    const populated = await Letter.findById(letter._id)
      .populate('beatId')
      .populate('assignedPostmanId', 'name username role');

    res.json({
      success: true,
      message: `Letter status updated to ${status}`,
      package: populated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Reset collection and reseed packages (called by Admin reset)
// @route   POST /api/letters/reset
// @access  Private (Admin)
router.post('/reset', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('Resetting letters database...');
    await Letter.deleteMany({});

    const User = require('../models/User');
    const Beat = require('../models/Beat');

    const postman1 = await User.findOne({ username: 'postman1' });
    const postman2 = await User.findOne({ username: 'postman2' });

    const beat101 = await Beat.findOne({ beatNumber: /Beat 101/ });
    const beat102 = await Beat.findOne({ beatNumber: /Beat 102/ });
    const beat201 = await Beat.findOne({ beatNumber: /Beat 201/ });

    if (!postman1 || !postman2 || !beat101 || !beat102 || !beat201) {
      return res.status(500).json({ success: false, message: 'Default beats/users are missing.' });
    }

    const lettersToSeed = [
      {
        trackingId: 'IN-101001',
        recipientName: 'K. R. Rao',
        address: {
          houseNumber: '3-4-12',
          apartment: 'Meera Nilayam',
          street: 'Begumpet Main Road',
          locality: 'Begumpet',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500016',
          fullAddress: 'H.No. 3-4-12, Meera Nilayam, Begumpet Main Road, Hyderabad, Telangana, 500016'
        },
        coordinates: { lat: 17.4455, lng: 78.4720 },
        status: 'assigned',
        beatId: beat101._id,
        assignedPostmanId: postman1._id,
        ocrText: 'TO: K. R. Rao\nH.No. 3-4-12, Meera Nilayam\nBegumpet Main Road, Hyderabad - 500016',
        ocrConfidence: 94.2,
        lowConfidence: false,
        weather: { temp: 29, condition: 'Clear', description: 'Clear Sky', warning: 'None', updatedAt: new Date() }
      },
      {
        trackingId: 'IN-101002',
        recipientName: 'V. Lakshmi',
        address: {
          houseNumber: '402',
          apartment: 'Sai Towers',
          street: 'Ameerpet Cross Roads',
          locality: 'Ameerpet',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500016',
          fullAddress: 'Flat 402, Sai Towers, Ameerpet Cross Roads, Hyderabad, Telangana, 500016'
        },
        coordinates: { lat: 17.4375, lng: 78.4482 },
        status: 'assigned',
        beatId: beat101._id,
        assignedPostmanId: postman1._id,
        ocrText: 'V. Lakshmi\nFlat 402, Sai Twrs\nAmerpet Area, Hyd\nPIN 500016',
        ocrConfidence: 62.5,
        lowConfidence: true,
        weather: { temp: 24, condition: 'Rain', description: 'Moderate Rain', warning: 'Heavy Rain Alert - Slippery Roads', updatedAt: new Date() }
      },
      {
        trackingId: 'IN-101003',
        recipientName: 'N. Naidu',
        address: {
          houseNumber: '42',
          apartment: 'Methodist Mansion',
          street: 'Begumpet Colony Road',
          locality: 'Begumpet',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500016',
          fullAddress: 'Plot 42, Methodist Mansion, Begumpet Colony Road, Hyderabad, Telangana, 500016'
        },
        coordinates: { lat: 17.4420, lng: 78.4680 },
        status: 'assigned',
        beatId: beat101._id,
        assignedPostmanId: postman1._id,
        ocrText: 'TO: N. Naidu\nPlot 42, Methodist Mansion\nBegumpet, Hyderabad 500016',
        ocrConfidence: 89.2,
        lowConfidence: false,
        weather: { temp: 29, condition: 'Clear', description: 'Clear Sky', warning: 'None', updatedAt: new Date() }
      },
      {
        trackingId: 'IN-101004',
        recipientName: 'Anitha Reddy',
        address: {
          houseNumber: '1-10-74/A',
          apartment: 'Somajiguda Court',
          street: 'Raj Bhavan Road',
          locality: 'Somajiguda',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500082',
          fullAddress: '1-10-74/A, Somajiguda Court, Raj Bhavan Road, Hyderabad, Telangana, 500082'
        },
        coordinates: { lat: 17.4260, lng: 78.4530 },
        status: 'out_for_delivery',
        beatId: beat101._id,
        assignedPostmanId: postman1._id,
        ocrText: 'ATTN: Anitha Reddy\n1-10-74/A, Somajiguda Court\nHyderabad - 500082',
        ocrConfidence: 91.5,
        lowConfidence: false,
        weather: { temp: 24, condition: 'Rain', description: 'Moderate Rain', warning: 'Heavy Rain Alert - Slippery Roads', updatedAt: new Date() }
      },
      {
        trackingId: 'IN-102001',
        recipientName: 'Mohammed Ali',
        address: {
          houseNumber: '12-2-418',
          apartment: 'Ali Mansion',
          street: 'Murad Nagar Road',
          locality: 'Mehdipatnam',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500028',
          fullAddress: 'Door No. 12-2-418, Ali Mansion, Murad Nagar Road, Mehdipatnam, Hyderabad, Telangana, 500028'
        },
        coordinates: { lat: 17.3916, lng: 78.4325 },
        status: 'assigned',
        beatId: beat102._id,
        assignedPostmanId: postman1._id,
        ocrText: 'TO: Mohammed Ali\nDoor No. 12-2-418, Ali Mnsn\nMurad Nagar, Mehdipatnam, 500028',
        ocrConfidence: 87.8,
        lowConfidence: false,
        weather: { temp: 29, condition: 'Clear', description: 'Clear Sky', warning: 'None', updatedAt: new Date() }
      },
      {
        trackingId: 'IN-102002',
        recipientName: 'Praveen Kumar',
        address: {
          houseNumber: '5-9-108',
          apartment: 'Ganga Residency',
          street: 'Khairatabad Main Rd',
          locality: 'Khairatabad',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500004',
          fullAddress: 'H.No. 5-9-108, Ganga Residency, Khairatabad Main Rd, Hyderabad, Telangana, 500004'
        },
        coordinates: { lat: 17.4110, lng: 78.4610 },
        status: 'assigned',
        beatId: beat102._id,
        assignedPostmanId: postman1._id,
        ocrText: 'DELIVER: Praveen Kumar\n5-9-108, Ganga Residency\nKhairatabad, Hyderabad - 500004',
        ocrConfidence: 93.0,
        lowConfidence: false,
        weather: { temp: 34, condition: 'Haze', description: 'Hazy Sun', warning: 'None', updatedAt: new Date() }
      },
      {
        trackingId: 'IN-102003',
        recipientName: 'Zeenat Begum',
        address: {
          houseNumber: 'A-12',
          apartment: 'LIC Colony Buildings',
          street: 'Rethibowli Road',
          locality: 'Mehdipatnam',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500028',
          fullAddress: 'A-12, LIC Colony Buildings, Rethibowli Road, Mehdipatnam, Hyderabad, Telangana, 500028'
        },
        coordinates: { lat: 17.3950, lng: 78.4280 },
        status: 'assigned',
        beatId: beat102._id,
        assignedPostmanId: postman1._id,
        ocrText: 'TO: Zeenat Begum\nA-12, LIC Colony Buildings\nMehdipatnam, Hyderabad 500028',
        ocrConfidence: 90.1,
        lowConfidence: false,
        weather: { temp: 29, condition: 'Clear', description: 'Clear Sky', warning: 'None', updatedAt: new Date() }
      },
      {
        trackingId: 'IN-102004',
        recipientName: 'Sanjay Shah',
        address: {
          houseNumber: 'Block C',
          apartment: 'Metro Residency',
          street: 'Station Road',
          locality: 'Khairatabad',
          city: 'Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500004',
          fullAddress: 'Block C, Metro Residency, Station Road, Khairatabad, Hyderabad, Telangana, 500004'
        },
        coordinates: { lat: 17.4140, lng: 78.4580 },
        status: 'delivered',
        beatId: beat102._id,
        assignedPostmanId: postman1._id,
        ocrText: 'Block C, Metro Residency\nKhairatabad, Hyderabad\nPIN 500004\nREC: Sanjay Shah',
        ocrConfidence: 95.4,
        lowConfidence: false,
        weather: { temp: 34, condition: 'Haze', description: 'Hazy Sun', warning: 'None', updatedAt: new Date() }
      },
      {
        trackingId: 'IN-201001',
        recipientName: 'Siddharth Sen',
        address: {
          houseNumber: '89',
          apartment: 'Kavuri Chambers',
          street: 'Phase 2 Road',
          locality: 'Madhapur',
          city: 'Hyderabad',
          district: 'Rangareddy',
          state: 'Telangana',
          pincode: '500081',
          fullAddress: 'Plot 89, Kavuri Chambers, Phase 2, Madhapur, Hyderabad, Telangana, 500081'
        },
        coordinates: { lat: 17.4411, lng: 78.3965 },
        status: 'assigned',
        beatId: beat201._id,
        assignedPostmanId: postman2._id,
        ocrText: 'Siddharth Sen\nPlot 89, Kavuri Chmbrs\nPhase 2, Madhapur, Hyd - 500081',
        ocrConfidence: 96.1,
        lowConfidence: false,
        weather: { temp: 29, condition: 'Clear', description: 'Clear Sky', warning: 'None', updatedAt: new Date() }
      },
      {
        trackingId: 'IN-201002',
        recipientName: 'A. K. Sharma',
        address: {
          houseNumber: '14',
          apartment: 'Telecom Arcade',
          street: 'Telecom Nagar Street',
          locality: 'Gachibowli',
          city: 'Hyderabad',
          district: 'Rangareddy',
          state: 'Telangana',
          pincode: '500032',
          fullAddress: 'Shop 14, Telecom Arcade, Telecom Nagar, Gachibowli, Hyderabad, Telangana, 500032'
        },
        coordinates: { lat: 17.4401, lng: 78.3489 },
        status: 'assigned',
        beatId: beat201._id,
        assignedPostmanId: postman2._id,
        ocrText: 'A. K. Shrma\nShp 14, Telecom Arcd\nTelcom Ngr, Gachbwli, Hyd 500032',
        ocrConfidence: 59.4,
        lowConfidence: true,
        weather: { temp: 24, condition: 'Rain', description: 'Moderate Rain', warning: 'Heavy Rain Alert - Slippery Roads', updatedAt: new Date() }
      },
      {
        trackingId: 'IN-201003',
        recipientName: 'Deepika Patel',
        address: {
          houseNumber: '102',
          apartment: 'Orchid Apartments',
          street: 'Hitech City Road',
          locality: 'Madhapur',
          city: 'Hyderabad',
          district: 'Rangareddy',
          state: 'Telangana',
          pincode: '500081',
          fullAddress: 'Flat 102, Orchid Apartments, Hitech City Road, Madhapur, Hyderabad, Telangana, 500081'
        },
        coordinates: { lat: 17.4480, lng: 78.3910 },
        status: 'assigned',
        beatId: beat201._id,
        assignedPostmanId: postman2._id,
        ocrText: 'TO: Deepika Patel\nFlat 102, Orchid Apartments\nMadhapur, Hyderabad - 500081',
        ocrConfidence: 94.0,
        lowConfidence: false,
        weather: { temp: 29, condition: 'Clear', description: 'Clear Sky', warning: 'None', updatedAt: new Date() }
      },
      {
        trackingId: 'IN-201004',
        recipientName: 'Vikram Malhotra',
        address: {
          houseNumber: '22',
          apartment: 'Oak Woods Villa',
          street: 'Gachibowli High Road',
          locality: 'Gachibowli',
          city: 'Hyderabad',
          district: 'Rangareddy',
          state: 'Telangana',
          pincode: '500032',
          fullAddress: 'Villa 22, Oak Woods Villa, Gachibowli High Road, Gachibowli, Hyderabad, Telangana, 500032'
        },
        coordinates: { lat: 17.4350, lng: 78.3420 },
        status: 'delivered',
        beatId: beat201._id,
        assignedPostmanId: postman2._id,
        ocrText: 'Villa 22, Oak Woods\nGachibowli, Hyderabad - 500032\nREC: Vikram Malhotra',
        ocrConfidence: 93.8,
        lowConfidence: false,
        weather: { temp: 24, condition: 'Rain', description: 'Moderate Rain', warning: 'Heavy Rain Alert - Slippery Roads', updatedAt: new Date() }
      }
    ];

    await Letter.insertMany(lettersToSeed);
    console.log('Letter database reset successful.');
    res.json({ success: true, message: 'Database reset successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// @desc    Update letter details (Manual Review/Correction & Beat Assignment)
// @route   PUT /api/letters/:id
// @access  Private (office_staff, admin)
router.put('/:id', protect, authorize('office_staff', 'admin'), async (req, res) => {
  try {
    const { recipientName, address, beatId, lowConfidence } = req.body;
    const letter = await Letter.findById(req.params.id);

    if (!letter) {
      return res.status(404).json({ success: false, message: 'Letter not found' });
    }

    // Apply manual text corrections if provided
    if (recipientName) letter.recipientName = recipientName;
    if (address) letter.address = address; // Expects object with fullAddress & pincode
    if (lowConfidence !== undefined) letter.lowConfidence = lowConfidence;

    // Handle incoming beat definitions flexibly (resolves names like 'Beat 101' or ObjectIds)
    // If frontend selected a beat manually
if (beatId) {
    let matchedBeat;

    if (typeof beatId === "string" && beatId.startsWith("Beat")) {
        matchedBeat = await Beat.findOne({
            beatNumber: new RegExp(beatId, "i")
        });
    } else {
        matchedBeat = await Beat.findById(beatId);
    }

    if (matchedBeat) {
        letter.beatId = matchedBeat._id;
        letter.assignedPostmanId = matchedBeat.assignedPostmanId;
        letter.status = "assigned";
    }
}
// Otherwise auto assign based on corrected address
else if (address) {

    const parsedAddress = {
        address
    };

    const matchedBeat = await autoAssignBeat(parsedAddress);

    if (matchedBeat) {
        letter.beatId = matchedBeat._id;
        letter.assignedPostmanId = matchedBeat.assignedPostmanId;
        letter.status = "assigned";
    }
}

    await letter.save();

    // Populate the newly updated letter object to match frontend model layout formats
    const populated = await Letter.findById(letter._id)
      .populate('beatId')
      .populate('assignedPostmanId', 'name username role');

    res.json({
      success: true,
      message: 'Letter details updated successfully',
      package: populated
    });
  } catch (error) {
    console.error('Error updating letter:', error);
    res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
  }
});

module.exports = router;
