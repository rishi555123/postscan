const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const User = require('../models/User');
const PostOffice = require('../models/PostOffice');
const Beat = require('../models/Beat');
const Letter = require('../models/Letter');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seedDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/postscan';
    console.log(`Connecting to database: ${connStr}`);
    await mongoose.connect(connStr);
    console.log('Connected to MongoDB for seeding.');

    // 1. Clean Database
    console.log('Clearing database collections...');
    await User.deleteMany({});
    await PostOffice.deleteMany({});
    await Beat.deleteMany({});
    await Letter.deleteMany({});
    console.log('Database cleared.');

    // 2. Create Post Offices
    console.log('Seeding Post Offices...');
    const begumpetPO = await PostOffice.create({
      name: 'Begumpet Sub-Post Office',
      pincode: '500016',
      city: 'Hyderabad',
      state: 'Telangana',
      coordinates: { lat: 17.4448, lng: 78.4728 }
    });

    const madhapurPO = await PostOffice.create({
      name: 'Madhapur Post Office',
      pincode: '500081',
      city: 'Hyderabad',
      state: 'Telangana',
      coordinates: { lat: 17.4411, lng: 78.3965 }
    });

    console.log('Post Offices seeded.');

    // 3. Create Users
    console.log('Seeding User accounts...');
    const admin = await User.create({
      username: 'admin',
      password: 'password123',
      name: 'System Administrator',
      role: 'admin'
    });

    const staff = await User.create({
      username: 'staff',
      password: 'password123',
      name: 'Radhika Sen (Office Staff)',
      role: 'office_staff',
      postOfficeId: begumpetPO._id
    });

    const postman1 = await User.create({
      username: 'postman1',
      password: 'password123',
      name: 'Ramesh Kumar (Postman)',
      role: 'postman',
      postOfficeId: begumpetPO._id
    });

    const postman2 = await User.create({
      username: 'postman2',
      password: 'password123',
      name: 'Srinivas Rao (Postman)',
      role: 'postman',
      postOfficeId: madhapurPO._id
    });

    console.log('Users seeded.');

    // 4. Create Beats
    console.log('Seeding Delivery Beats...');
    const beat101 = await Beat.create({
      beatNumber: 'Beat 101 (Begumpet-Ameerpet)',
      postOfficeId: begumpetPO._id,
      assignedPostmanId: postman1._id,
      colorHex: '#C1272D', // India Post Red
      pincodes: ['500016'],
      areas: ['begumpet', 'ameerpet', 'somajiguda']
    });

    const beat102 = await Beat.create({
      beatNumber: 'Beat 102 (Khairatabad-Mehdipatnam)',
      postOfficeId: begumpetPO._id,
      assignedPostmanId: postman1._id,
      colorHex: '#10b981', // Emerald
      pincodes: ['500004', '500028'],
      areas: ['khairatabad', 'mehdipatnam', 'murad nagar']
    });

    const beat201 = await Beat.create({
      beatNumber: 'Beat 201 (Madhapur-Gachibowli)',
      postOfficeId: madhapurPO._id,
      assignedPostmanId: postman2._id,
      colorHex: '#FFC72C', // Golden Yellow
      pincodes: ['500081', '500032'],
      areas: ['madhapur', 'gachibowli', 'kavuri hills', 'telecom nagar']
    });

    console.log('Beats seeded.');

    // 5. Create Demo Letters (12 letters)
    console.log('Seeding Letters...');
    const letters = [
      // Beat 101
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

      // Beat 102
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

      // Beat 201
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

    await Letter.insertMany(letters);
    console.log(`Successfully seeded ${letters.length} demo letters!`);

    console.log('Seeding completed successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedDB();
