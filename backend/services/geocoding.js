const axios = require("axios");

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const HEADERS = {
  // Nominatim requires a descriptive User-Agent, or it will reject/block the request.
  // Replace the email with a real contact if possible.
  "User-Agent": "PostScan-App/1.0 (contact: your-email@example.com)",
};

async function tryGeocode(query) {
  const response = await axios.get(NOMINATIM_URL, {
    params: {
      q: query,
      format: "json",
      limit: 1,
      countrycodes: "in",
    },
    headers: HEADERS,
  });

  if (!response.data || !response.data.length) {
    return null;
  }

  const result = response.data[0];
  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
  };
}

/**
 * Geocodes an address, falling back to progressively simpler queries if the
 * exact address isn't found. OSM/Nominatim rarely has shop-level buildings
 * mapped in India, so an exact match on a full street address often fails
 * even when the general area is well-mapped. Falling back to
 * locality/city/pincode trades precision for a much higher hit rate — still
 * accurate enough for beat assignment.
 *
 * @param {string} fullAddress The complete address string (used first)
 * @param {object} [addressParts] Optional structured fields for fallback queries
 * @param {string} [addressParts.locality]
 * @param {string} [addressParts.city]
 * @param {string} [addressParts.state]
 * @param {string} [addressParts.pincode]
 */
async function geocodeAddress(fullAddress, addressParts = {}) {
  const { locality, city, state, pincode } = addressParts;

  // Ordered from most precise to least. Each is skipped if the pieces it
  // needs are missing/blank (OCR often leaves fields empty).
  const attempts = [
    fullAddress,
    [locality, city, state, pincode].filter(Boolean).join(", "),
    [city, pincode].filter(Boolean).join(", "),
    [pincode, "India"].filter(Boolean).join(", "),
  ].filter((q) => q && q.trim().length > 0);

  for (const query of attempts) {
    try {
      const coords = await tryGeocode(query);
      if (coords) {
        console.log(`Geocoding succeeded on query: "${query}"`);
        return coords;
      }
      console.log(`Geocoding zero results for: "${query}", trying next fallback...`);
    } catch (err) {
      console.error(`Geocoding request failed for "${query}":`, err.message);
      // Keep trying remaining fallbacks rather than giving up immediately.
    }
  }

  // Last resort: every attempt failed. Return a safe default (Hyderabad city
  // center) instead of null, so downstream code (weather, Mongo, Flutter map
  // widgets) never has to handle a missing-coordinate case. The letter is
  // still saved and shows up on the map, just at an approximate location
  // rather than the unmapped exact address.
  console.error("Geocoding Error: all fallback queries exhausted. Using default city-center coordinates.");
  return { lat: 17.3850, lng: 78.4867 };
}

module.exports = {
  geocodeAddress,
};