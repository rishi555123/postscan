const WeatherLog = require('../models/WeatherLog');

/**
 * Fetches weather details for coordinates and pincode.
 * Utilizes WeatherLog caching in database to minimize external API requests.
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @param {string} pincode Pincode associated with coordinates
 * @returns {Promise<object>} Weather details with warning alerts
 */
const fetchWeather = async (lat, lng, pincode = '500016') => {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  // 1. Check if recent Weather Log Cache exists in DB (expires index handles cleanup)
  try {
    const cachedLog = await WeatherLog.findOne({ pincode }).sort({ timestamp: -1 });
    if (cachedLog) {
      console.log(`Weather Cache Hit for pincode ${pincode}: ${cachedLog.temp}°C, ${cachedLog.condition}`);
      return {
        temp: cachedLog.temp,
        condition: cachedLog.condition,
        description: cachedLog.condition + ' weather cached',
        warning: cachedLog.warning,
        updatedAt: cachedLog.timestamp
      };
    }
  } catch (err) {
    console.error('Failed to query weather cache logs:', err.message);
  }

  // 2. Fetch from API or Fallback
  let weatherResult;

  if (!apiKey) {
    console.log(`OpenWeather API Key missing. Generating mock weather for pincode: ${pincode}`);
    weatherResult = generateMockWeather(lat, lng);
  } else {
    try {
      console.log(`Fetching live weather from OpenWeather for coords: (${lat}, ${lng})...`);
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`OpenWeather API returned status: ${response.status}`);
      }

      const data = await response.json();
      const mainCondition = data.weather?.[0]?.main || 'Clear';
      const description = data.weather?.[0]?.description || 'clear sky';
      const temp = data.main?.temp || 30;

      let warning = 'None';
      if (mainCondition === 'Thunderstorm' || mainCondition === 'Extreme') {
        warning = 'Severe Weather - Seek Shelter!';
      } else if (mainCondition === 'Rain' || mainCondition === 'Drizzle') {
        warning = 'Rainy Conditions - Slippery Roads';
      } else if (mainCondition === 'Dust' || mainCondition === 'Sand' || mainCondition === 'Haze') {
        warning = 'Low Visibility - Ride Safely';
      }

      weatherResult = {
        temp: Math.round(temp),
        condition: mainCondition,
        description: description.charAt(0).toUpperCase() + description.slice(1),
        warning: warning,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error fetching live weather API, triggering fallback:', error.message);
      weatherResult = generateMockWeather(lat, lng);
    }
  }

  // 3. Cache the weather log to DB
  try {
    await WeatherLog.create({
      pincode: pincode,
      temp: weatherResult.temp,
      condition: weatherResult.condition,
      warning: weatherResult.warning,
      timestamp: weatherResult.updatedAt
    });
    console.log(`Weather Cache Saved for pincode ${pincode}`);
  } catch (err) {
    console.error('Failed to write weather cache log to DB:', err.message);
  }

  return weatherResult;
};

// Generates dynamic mock weather to make the demo feel alive
const generateMockWeather = (lat, lng) => {
  const sum = Math.abs(lat) + Math.abs(lng);
  
  if (Math.floor(sum) % 2 === 0) {
    return {
      temp: 24,
      condition: 'Rain',
      description: 'Moderate Rain',
      warning: 'Heavy Rain Alert - Slippery Roads',
      updatedAt: new Date()
    };
  } else if (Math.floor(sum) % 3 === 0) {
    return {
      temp: 34,
      condition: 'Haze',
      description: 'Hazy Sun',
      warning: 'None',
      updatedAt: new Date()
    };
  } else {
    return {
      temp: 30,
      condition: 'Clear',
      description: 'Clear Sky',
      warning: 'None',
      updatedAt: new Date()
    };
  }
};

module.exports = {
  fetchWeather
};
