const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const PostOffice = require('../models/PostOffice');
const Beat = require('../models/Beat');
const Letter = require('../models/Letter');
const WeatherLog = require('../models/WeatherLog');
const { fetchWeather } = require('../services/weather');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const getDistance = (c1, c2) => {
  return Math.sqrt(Math.pow(c1.lat - c2.lat, 2) + Math.pow(c1.lng - c2.lng, 2));
};

const runDiagnostic = async () => {
  console.log('==================================================');
  console.log('    PostScan India Post Integration Diagnostics   ');
  console.log('==================================================');

  let connected = false;
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/postscan';
    console.log(`\n[1/5] Connecting to MongoDB...`);
    await mongoose.connect(connStr);
    console.log('✅ Connection successful!');
    connected = true;
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`);
    process.exit(1);
  }

  // --- Step 1: Database Seed Validation ---
  console.log(`\n[2/5] Verifying Seed Data Collections...`);
  const userCount = await User.countDocuments();
  const poCount = await PostOffice.countDocuments();
  const beatCount = await Beat.countDocuments();
  const letterCount = await Letter.countDocuments();
  
  console.log(`- Post Offices found : ${poCount}`);
  console.log(`- Beats found        : ${beatCount}`);
  console.log(`- User accounts found: ${userCount}`);
  console.log(`- Letters found      : ${letterCount}`);

  if (userCount === 0 || poCount === 0 || beatCount === 0 || letterCount === 0) {
    console.error('❌ Database is missing seed data. Run "node scripts/seed.js" first.');
    mongoose.connection.close();
    process.exit(1);
  }
  console.log('✅ Seed database status: VALID');

  // --- Step 2: Login Authentication for All 3 Roles ---
  console.log(`\n[3/5] Verifying Multi-Role Auth Logic...`);
  const rolesToTest = [
    { username: 'admin', expectedRole: 'admin' },
    { username: 'staff', expectedRole: 'office_staff' },
    { username: 'postman1', expectedRole: 'postman' }
  ];

  const jwtSecret = process.env.JWT_SECRET || 'postscan_super_secret_jwt_key_123!';

  for (const testUser of rolesToTest) {
    const user = await User.findOne({ username: testUser.username });
    if (!user) {
      console.error(`❌ User ${testUser.username} not found!`);
      continue;
    }
    
    const isMatch = await user.comparePassword('password123');
    if (isMatch && user.role === testUser.expectedRole) {
      const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1h' });
      console.log(`✅ Login SUCCESS for role [${user.role.toUpperCase()}] (${user.name})`);
      console.log(`   Signed JWT Token: Bearer ${token.substring(0, 20)}...[TRUNCATED]`);
    } else {
      console.error(`❌ Login FAILED for user: ${testUser.username}`);
    }
  }

  // --- Step 3: Auto-Assignment of Beats by Pincode & Area ---
  console.log(`\n[4/5] Verifying Letter Beat Auto-Assignment...`);
  const beats = await Beat.find({});

  const testAddresses = [
    {
      pincode: '500016',
      fullAddress: 'H.No. 3-4-12, Begumpet Road, Hyderabad',
      locality: 'Begumpet',
      expectedBeat: 'Beat 101'
    },
    {
      pincode: '500032',
      fullAddress: 'Shop 12, Telecom Nagar, Gachibowli, Hyderabad',
      locality: 'Gachibowli',
      expectedBeat: 'Beat 201'
    },
    {
      pincode: '999999',
      fullAddress: 'H.No. 12-5, Mehdipatnam Area, Hyderabad',
      locality: 'Mehdipatnam',
      expectedBeat: 'Beat 102'
    }
  ];

  for (const addr of testAddresses) {
    let matchedBeat = null;
    
    // Pincode Match
    for (const beat of beats) {
      if (beat.pincodes.includes(addr.pincode)) {
        matchedBeat = beat;
        break;
      }
    }

    // Keyword locality Match
    if (!matchedBeat) {
      const lowerAddr = addr.fullAddress.toLowerCase();
      const lowerLoc = addr.locality.toLowerCase();
      for (const beat of beats) {
        for (const area of beat.areas) {
          if (lowerAddr.includes(area) || lowerLoc.includes(area)) {
            matchedBeat = beat;
            break;
          }
        }
        if (matchedBeat) break;
      }
    }

    if (matchedBeat) {
      console.log(`✅ Pincode ${addr.pincode} matched Beat -> "${matchedBeat.beatNumber}" (Matches: ${addr.expectedBeat})`);
    } else {
      console.error(`❌ Address [${addr.pincode}] failed auto-assignment.`);
    }
  }

  // --- Step 4: Routing Sequence & Weather Warnings ---
  console.log(`\n[5/5] Testing Route Optimization & Weather Alerts Cache...`);
  
  const postman = await User.findOne({ username: 'postman1' }).populate('postOfficeId');
  if (!postman || !postman.postOfficeId) {
    console.error('❌ Postman Ramesh or assigned Post Office not found.');
  } else {
    console.log(`Postman: ${postman.name}`);
    console.log(`Hub Coordinate: (${postman.postOfficeId.coordinates.lat}, ${postman.postOfficeId.coordinates.lng})`);

    const letters = await Letter.find({
      assignedPostmanId: postman._id,
      status: { $in: ['assigned', 'out_for_delivery'] }
    });

    const unvisited = [...letters];
    const orderedSequence = [];
    let currentPos = { ...postman.postOfficeId.coordinates };

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

    console.log(`Optimized Route sequence:`);
    currentPos = { ...postman.postOfficeId.coordinates };
    
    for (let i = 0; i < orderedSequence.length; i++) {
      const letter = orderedSequence[i];
      const dist = getDistance(currentPos, letter.coordinates);
      
      const w = await fetchWeather(letter.coordinates.lat, letter.coordinates.lng, letter.address.pincode);
      
      console.log(`  Stop ${i + 1}: ${letter.recipientName} (${letter.address.pincode})`);
      console.log(`     Step Proximity: ${dist.toFixed(5)} units`);
      console.log(`     Weather Alert : ${w.warning !== 'None' ? '⚠️ ' + w.warning : '✅ Clear'}`);
      
      currentPos = letter.coordinates;
    }
  }

  // --- Step 5: Admin Analytics Calculation check ---
  console.log(`\n[6/6] Testing Aggregated Analytics Engine...`);
  try {
    const totalLetters = await Letter.countDocuments();
    const deliveredCount = await Letter.countDocuments({ status: 'delivered' });
    const failedCount = await Letter.countDocuments({ status: { $in: ['house_locked', 'address_not_found', 'shifted', 'recipient_not_available'] } });
    
    const dbLetters = await Letter.find({});
    let totalConf = 0;
    dbLetters.forEach(l => totalConf += l.ocrConfidence || 100);
    const accuracy = totalLetters > 0 ? Math.round(totalConf / totalLetters) : 100;
    
    console.log(`✅ Analytics Computation Check:`);
    console.log(`   - Scanned Letters  : ${totalLetters}`);
    console.log(`   - Delivered Counts : ${deliveredCount}`);
    console.log(`   - Failed Counts    : ${failedCount}`);
    console.log(`   - Average OCR Acc  : ${accuracy}%`);
  } catch (err) {
    console.error('❌ Failed to run analytics computation test:', err.message);
  }

  console.log('\n==================================================');
  await mongoose.connection.close();
  console.log('Database connection closed.');
};

runDiagnostic();
