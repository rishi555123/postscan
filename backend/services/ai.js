const { GoogleGenerativeAI } = require('@google/generative-ai');
const { geocodeAddress } = require("./geocoding");
const fs = require('fs');
const path = require('path');

// Loaded mock printed addresses in Hyderabad matching government schema
const mockAddresses = [
  {
    recipientName: "K. R. Rao",
    address: {
      houseNumber: "3-4-12",
      apartment: "Meera Nilayam",
      street: "Begumpet Main Road",
      locality: "Begumpet",
      city: "Hyderabad",
      district: "Hyderabad",
      state: "Telangana",
      pincode: "500016",
      fullAddress: "H.No. 3-4-12, Meera Nilayam, Begumpet Main Road, Hyderabad, Telangana, 500016"
    },
    coordinates: { lat: 17.4448, lng: 78.4728 },
    ocrText: "TO: K. R. Rao\nH.No. 3-4-12, Meera Nilayam\nBegumpet Main Road, Hyd 500016\nTRACKING: IN-BG-101001",
    ocrConfidence: 94.2,
    lowConfidence: false
  },
  {
    recipientName: "V. Lakshmi",
    address: {
      houseNumber: "402",
      apartment: "Sai Towers",
      street: "Ameerpet Cross Roads",
      locality: "Ameerpet",
      city: "Hyderabad",
      district: "Hyderabad",
      state: "Telangana",
      pincode: "500016",
      fullAddress: "Flat 402, Sai Towers, Ameerpet Cross Roads, Hyderabad, Telangana, 500016"
    },
    coordinates: { lat: 17.4375, lng: 78.4482 },
    ocrText: "V. Lakshmi\nFlat 402, Sai Twrs\nAmerpet Area, Hyd\nPIN 500016", 
    ocrConfidence: 62.5, 
    lowConfidence: true
  },
  {
    recipientName: "Mohammed Ali",
    address: {
      houseNumber: "12-2-418",
      apartment: "Ali Mansion",
      street: "Murad Nagar Road",
      locality: "Mehdipatnam",
      city: "Hyderabad",
      district: "Hyderabad",
      state: "Telangana",
      pincode: "500028",
      fullAddress: "Door No. 12-2-418, Ali Mansion, Murad Nagar Road, Mehdipatnam, Hyderabad, Telangana, 500028"
    },
    coordinates: { lat: 17.3916, lng: 78.4325 },
    ocrText: "TO: Mohammed Ali\nDoor No. 12-2-418, Ali Mnsn\nMurad Nagar, Mehdipatnam, 500028",
    ocrConfidence: 87.8,
    lowConfidence: false
  },
  {
    recipientName: "Siddharth Sen",
    address: {
      houseNumber: "89",
      apartment: "Kavuri Chambers",
      street: "Phase 2 Road",
      locality: "Madhapur",
      city: "Hyderabad",
      district: "Rangareddy",
      state: "Telangana",
      pincode: "500081",
      fullAddress: "Plot 89, Kavuri Chambers, Phase 2, Madhapur, Hyderabad, Telangana, 500081"
    },
    coordinates: { lat: 17.4411, lng: 78.3965 },
    ocrText: "Siddharth Sen\nPlot 89, Kavuri Chmbrs\nPhase 2, Madhapur, Hyd - 500081",
    ocrConfidence: 96.1,
    lowConfidence: false
  },
  {
    recipientName: "A. K. Sharma",
    address: {
      houseNumber: "14",
      apartment: "Telecom Arcade",
      street: "Telecom Nagar Street",
      locality: "Gachibowli",
      city: "Hyderabad",
      district: "Rangareddy",
      state: "Telangana",
      pincode: "500032",
      fullAddress: "Shop 14, Telecom Arcade, Telecom Nagar, Gachibowli, Hyderabad, Telangana, 500032"
    },
    coordinates: { lat: 17.4401, lng: 78.3489 },
    ocrText: "A. K. Shrma\nShp 14, Telecom Arcd\nTelcom Ngr, Gachbwli, Hyd 500032",
    ocrConfidence: 59.4, 
    lowConfidence: true
  }
];

let mockCounter = 0;

// Initialize the official Google Gen AI client wrapper with your environment key
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Dynamically resolves file buffers and detects correct mime types to prevent 400 Bad Requests
 */
const fileToGenerativePart = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  let mimeType = "image/jpeg";
  if (ext === ".png") mimeType = "image/png";
  if (ext === ".webp") mimeType = "image/webp";

  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    }
  };
};

/**
 * Parses address details from printed shipping label images.
 * Uses official Gemini SDK in active mode, otherwise triggers mock fallbacks.
 */
const parseAddressFromImage = async (imagePath) => {
  if (!genAI) {
    console.log("Gemini API key missing.");
    return getFallbackAddress();
  }

  try {
    const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

    const imagePart = fileToGenerativePart(imagePath);

    const prompt = `
You are an OCR engine for India Post.

Read the postal cover carefully.

Extract ONLY the recipient details.

Return ONLY valid JSON.

{
  "recipientName": "",
  "address": {
    "houseNumber": "",
    "apartment": "",
    "street": "",
    "locality": "",
    "city": "",
    "district": "",
    "state": "",
    "pincode": "",
    "fullAddress": ""
  },
  "ocrText": ""
}

Do not return markdown.

Do not return explanation.

Do not use \`\`\`json.
`;

    console.log("Sending image to Gemini...");

    const result = await model.generateContent([
      prompt,
      imagePart,
    ]);

    const response = result.response.text();

    console.log("Gemini Response:");
    console.log(response);

    const parsedData = JSON.parse(response);

    if (
      !parsedData.recipientName ||
      !parsedData.address
    ) {
      throw new Error("Invalid OCR response.");
    }

    console.log("Getting coordinates from Nominatim...");

    const coordinates = await geocodeAddress(
      parsedData.address.fullAddress,
      {
        locality: parsedData.address.locality,
        city: parsedData.address.city,
        state: parsedData.address.state,
        pincode: parsedData.address.pincode,
      }
    );

    parsedData.coordinates = coordinates;

    // Nominatim's usage policy caps free requests at 1/sec. This delay runs
    // AFTER the geocode call completes, so it throttles the next letter in a
    // batch rather than slowing this one down. Safe to remove if you switch
    // to a provider without this limit (e.g. LocationIQ, Mapbox).
    await new Promise((resolve) => setTimeout(resolve, 1100));

    parsedData.lowConfidence = false;

    parsedData.ocrConfidence = 100;

    return parsedData;
  } catch (err) {
  console.error("========== OCR FAILURE ==========");
  console.error(err);

  throw err;
  }
};

const getFallbackAddress = () => {
  const mock = mockAddresses[mockCounter];
  mockCounter = (mockCounter + 1) % mockAddresses.length;
  // Clone to prevent mutating reference counts during diagnostics
  return JSON.parse(JSON.stringify(mock));
};

module.exports = {
  parseAddressFromImage
};