const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config({ path: path.join(__dirname, '.env') });

// Quick diagnostic checkpoint to verify the cloud pipeline in your terminal logs
console.log('👉 GEMINI API KEY CODES:', process.env.GEMINI_API_KEY ? '✅ DETECTED NATIVELY' : '❌ NOT RECOGNIZED');

// Initialize express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded package labels
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple root check
app.get('/', (req, res) => {
  res.json({ message: 'PostScan API is running...' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/letters', require('./routes/letters'));
app.use('/api/routing', require('./routes/routing'));
app.use('/api/analytics', require('./routes/analytics'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('API Error:', err.stack || err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Connect Database & Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`- API root: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Fatal error starting server:', error.message);
    process.exit(1);
  }
};

startServer();
